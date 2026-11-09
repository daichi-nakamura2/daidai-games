// ============================================================
// 感謝脳ゲーム マルシェ版 — サーバーロジック
//   QRを読んだ人を自動で卓に座らせ、お題2問を時間で自動進行する。
//   ホストもスタッフ操作も無し。進行はすべてサーバー側。
//   ネームスペース: /games/kansha-marche
// ============================================================
const crypto = require("crypto");
const { TOPICS, GENERIC, BOTS, NICKNAMES, AVATARS } = require("./topics");

let io = null;

const ROUNDS = 2;
const WRITE_MS = 60 * 1000;
const VOTE_MS = 25 * 1000;
const RESULT_MS = 12 * 1000;
const MIN_ANSWERS = 3; // 答えがこれより少なければお助けキャラが埋める
const MAX_SEATED = 8;
const MAX_TABLES = 200;
const LATE_JOIN_MIN_MS = 20 * 1000; // 第1問の残りがこれ未満なら途中参加させず別卓へ
const ABANDON_MS = 60 * 1000;
const FINAL_KEEP_MS = 5 * 60 * 1000;
const REACTIONS = ["🙏", "🤣", "✨", "👏"];

/** @type {Map<string, any>} */
const tables = new Map();
/** token -> table */
const seats = new Map();

// 見ず知らずの人同士で読み合うので、明らかに不適切なものだけ弾く
const NG_PATTERNS = [
  /死ね|殺す|殺せ|ころす|ころせ|消えろ|きえろ|自殺/,
  /(^|[^ぁ-ん])しね/,
  /うざい|ウザい|きもい|キモい|ブス|デブ|クズ|カス|ガイジ/,
  /ちんこ|まんこ|セックス|おっぱい/i,
  /https?:|www\.|\.com|\.jp/i,
  /\d{2,4}-\d{2,4}-\d{3,4}|0[789]0\d{8}/,
];
const isNg = (text) => NG_PATTERNS.some((re) => re.test(text.replace(/\s/g, "")));

const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const cleanText = (v, max) => String(v == null ? "" : v).replace(/\s+/g, " ").trim().slice(0, max);
const cleanToken = (v) => (typeof v === "string" && /^[a-f0-9]{16,64}$/.test(v) ? v : null);

const humans = (t) => [...t.players.values()];
const connected = (t) => humans(t).filter((p) => p.connected);

function createTable() {
  const table = {
    id: crypto.randomBytes(4).toString("hex"),
    phase: "lobby", // lobby | writing | voting | results | final
    round: 0,
    topic: null,
    deck: shuffle(TOPICS),
    hintPool: [],
    genericPool: [],
    players: new Map(), // token -> player
    bots: BOTS.map((b, i) => ({ ...b, id: `bot${i}`, isBot: true, score: 0, joined: false, answer: null })),
    activeBots: [],
    answers: [],
    best: null,
    endsAt: null,
    timer: null,
    lastActive: Date.now(),
    finishedAt: null,
  };
  tables.set(table.id, table);
  return table;
}

function findJoinable() {
  let best = null;
  for (const t of tables.values()) {
    const n = connected(t).length;
    if (n === 0 || n >= MAX_SEATED) continue;
    const open =
      t.phase === "lobby" ||
      (t.phase === "writing" && t.round === 1 && t.endsAt - Date.now() >= LATE_JOIN_MIN_MS);
    if (open && (!best || n > connected(best).length)) best = t;
  }
  return best;
}

function removeSeat(token) {
  const table = seats.get(token);
  if (!table) return;
  seats.delete(token);
  table.players.delete(token);
  if (connected(table).length > 0) {
    maybeAdvance(table);
    broadcast(table);
  }
}

function deleteTable(table) {
  clearTimer(table);
  for (const [token, p] of table.players) {
    seats.delete(token);
    if (p.connected) io.to(p.socketId).emit("noSeat");
  }
  tables.delete(table.id);
}

function clearTimer(table) {
  if (table.timer) clearTimeout(table.timer);
  table.timer = null;
  table.endsAt = null;
}

function schedule(table, ms, fn) {
  clearTimer(table);
  table.endsAt = Date.now() + ms;
  table.timer = setTimeout(fn, ms);
}

// ---------- 進行 ----------

function beginRound(table) {
  table.round += 1;
  if (table.deck.length === 0) table.deck = shuffle(TOPICS);
  const card = table.deck.pop();
  table.topic = card.t;
  table.hintPool = shuffle(card.s);
  table.genericPool = shuffle(GENERIC);
  table.answers = [];
  table.activeBots = [];
  for (const p of table.players.values()) {
    p.answer = null;
    p.draft = "";
    p.vote = null;
    p.hinted = false;
  }
  table.phase = "writing";
  schedule(table, WRITE_MS, () => endWriting(table));
  broadcast(table);
}

function endWriting(table) {
  if (table.phase !== "writing") return;
  // 時間切れのときは、書きかけをそのまま答えにする
  for (const p of humans(table)) {
    if (!p.answer && p.draft && !isNg(p.draft)) p.answer = p.draft;
  }
  const written = humans(table).filter((p) => p.answer);
  const need = Math.max(0, MIN_ANSWERS - written.length);
  table.activeBots = table.bots.slice(0, need);
  for (const bot of table.activeBots) {
    bot.joined = true;
    bot.answer = table.hintPool.pop() || table.genericPool.pop();
  }
  table.answers = shuffle([...written, ...table.activeBots]).map((owner, aid) => ({
    aid,
    text: owner.answer,
    owner,
    votes: 0,
  }));
  table.phase = "voting";
  schedule(table, VOTE_MS, () => endVoting(table));
  broadcast(table);
}

function endVoting(table) {
  if (table.phase !== "voting") return;
  for (const p of table.players.values()) {
    const a = table.answers[p.vote];
    if (a && a.owner !== p) a.votes += 1;
  }
  // お助けキャラも投票する。なるべく人の答えに入れる
  for (const bot of table.activeBots) {
    const others = table.answers.filter((a) => a.owner !== bot);
    const people = others.filter((a) => !a.owner.isBot);
    const pool = people.length > 0 && Math.random() < 0.8 ? people : others;
    pick(pool).votes += 1;
  }
  for (const a of table.answers) {
    a.owner.score += a.votes;
    const better =
      !table.best ||
      a.votes > table.best.votes ||
      (a.votes === table.best.votes && table.best.isBot && !a.owner.isBot);
    if (a.votes > 0 && better) {
      table.best = { text: a.text, votes: a.votes, name: a.owner.name, avatar: a.owner.avatar, topic: table.topic, isBot: !!a.owner.isBot };
    }
    if (!a.owner.isBot && (!a.owner.best || a.votes > a.owner.best.votes)) {
      a.owner.best = { text: a.text, votes: a.votes, topic: table.topic };
    }
  }
  table.answers.sort((x, y) => y.votes - x.votes);
  table.phase = "results";
  schedule(table, RESULT_MS, () => {
    if (table.round < ROUNDS) beginRound(table);
    else finishGame(table);
  });
  broadcast(table);
}

function finishGame(table) {
  clearTimer(table);
  table.phase = "final";
  table.finishedAt = Date.now();
  broadcast(table);
}

// 全員が書き終わった／投票し終わったら時間を待たずに次へ
function maybeAdvance(table) {
  const here = connected(table);
  if (here.length === 0) return;
  if (table.phase === "writing" && here.every((p) => p.answer)) endWriting(table);
  else if (table.phase === "voting" && here.every((p) => p.vote !== null)) endVoting(table);
}

// ---------- 画面へ送る情報（1人ずつ別々に作る） ----------

function ranking(table) {
  const rows = [
    ...humans(table).filter((p) => p.connected || p.score > 0),
    ...table.bots.filter((b) => b.joined),
  ].sort((a, b) => b.score - a.score || Number(!!a.isBot) - Number(!!b.isBot));
  let rank = 0;
  let prev = null;
  return rows.map((r, i) => {
    if (r.score !== prev) rank = i + 1;
    prev = r.score;
    return { id: r.id, name: r.name, avatar: r.avatar, score: r.score, rank, isBot: !!r.isBot };
  });
}

function viewFor(table, me) {
  const view = {
    phase: table.phase,
    round: table.round,
    rounds: ROUNDS,
    topic: table.topic,
    remainMs: table.endsAt ? Math.max(0, table.endsAt - Date.now()) : null,
    me: {
      id: me.id,
      name: me.name,
      avatar: me.avatar,
      score: me.score,
      answer: me.answer,
      vote: me.vote,
      hinted: me.hinted,
    },
    players: connected(table).map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      answered: !!p.answer,
      voted: p.vote !== null,
    })),
    helpers: table.activeBots.map((b) => ({ name: b.name, avatar: b.avatar })),
  };
  if (table.phase === "voting") {
    // 投票中は誰の答えかを送らない
    view.answers = table.answers.map((a) => ({ aid: a.aid, text: a.text, mine: a.owner === me }));
  }
  if (table.phase === "results" || table.phase === "final") {
    view.answers = table.answers.map((a) => ({
      aid: a.aid,
      text: a.text,
      votes: a.votes,
      mine: a.owner === me,
      name: a.owner.name,
      avatar: a.owner.avatar,
      isBot: !!a.owner.isBot,
    }));
    view.ranking = ranking(table);
  }
  if (table.phase === "final") {
    const { isBot, ...best } = table.best || {};
    view.best = table.best ? best : null;
    view.myBest = me.best || null;
  }
  return view;
}

function broadcast(table) {
  table.lastActive = Date.now();
  for (const p of table.players.values()) {
    if (p.connected) io.to(p.socketId).emit("state", viewFor(table, p));
  }
}

// ---------- 通信 ----------

function onConnection(socket) {
  // この socket が今も席の持ち主なら { table, player } を返す
  const seat = () => {
    const token = socket.data.token;
    const table = token && seats.get(token);
    const player = table && table.players.get(token);
    return player && player.socketId === socket.id ? { table, player } : null;
  };

  socket.on("resume", (payload) => {
    const token = cleanToken(payload && payload.token);
    const table = token && seats.get(token);
    const player = table && table.players.get(token);
    if (!player) {
      socket.emit("noSeat");
      return;
    }
    socket.data.token = token;
    player.socketId = socket.id;
    player.connected = true;
    broadcast(table);
  });

  socket.on("join", (payload) => {
    const token = cleanToken(payload && payload.token);
    if (!token) return;
    removeSeat(token);
    const table = findJoinable() || (tables.size < MAX_TABLES ? createTable() : null);
    if (!table) {
      socket.emit("errorMsg", "ただいま混み合っています。少し待ってからお試しください。");
      return;
    }
    const typed = cleanText(payload.name, 10);
    const used = new Set(humans(table).map((p) => p.name));
    const name =
      typed && !isNg(typed) ? typed : shuffle(NICKNAMES).find((n) => !used.has(n)) || "おきゃくさん";
    const usedAvatars = new Set(humans(table).map((p) => p.avatar));
    const player = {
      id: crypto.randomBytes(4).toString("hex"),
      socketId: socket.id,
      connected: true,
      name,
      avatar: shuffle(AVATARS).find((a) => !usedAvatars.has(a)) || "🍙",
      score: 0,
      answer: null,
      draft: "",
      vote: null,
      hinted: false,
      best: null,
      lastReact: 0,
    };
    socket.data.token = token;
    seats.set(token, table);
    table.players.set(token, player);
    broadcast(table);
  });

  socket.on("start", () => {
    const s = seat();
    if (s && s.table.phase === "lobby") beginRound(s.table);
  });

  socket.on("hint", () => {
    const s = seat();
    if (!s || s.table.phase !== "writing" || s.player.hinted || s.player.answer) return;
    s.player.hinted = true;
    s.player.draft = s.table.hintPool.pop() || s.table.genericPool.pop() || pick(GENERIC);
    socket.emit("hint", s.player.draft);
    broadcast(s.table);
  });

  socket.on("draft", (payload) => {
    const s = seat();
    if (s && s.table.phase === "writing") s.player.draft = cleanText(payload && payload.text, 40);
  });

  socket.on("answer", (payload) => {
    const s = seat();
    if (!s || s.table.phase !== "writing" || s.player.answer) return;
    const text = cleanText(payload && payload.text, 40);
    if (!text) return;
    if (isNg(text)) {
      socket.emit("errorMsg", "別のやさしい言葉に変えてみてください。");
      return;
    }
    s.player.answer = text;
    broadcast(s.table);
    maybeAdvance(s.table);
  });

  socket.on("vote", (payload) => {
    const s = seat();
    if (!s || s.table.phase !== "voting") return;
    const aid = payload && payload.aid;
    const a = Number.isInteger(aid) ? s.table.answers[aid] : null;
    if (!a || a.owner === s.player) return;
    s.player.vote = a.aid;
    broadcast(s.table);
    maybeAdvance(s.table);
  });

  socket.on("react", (payload) => {
    const s = seat();
    const emoji = payload && payload.emoji;
    if (!s || !REACTIONS.includes(emoji)) return;
    const now = Date.now();
    if (now - s.player.lastReact < 200) return;
    s.player.lastReact = now;
    for (const p of connected(s.table)) io.to(p.socketId).emit("reaction", emoji);
  });

  socket.on("disconnect", () => {
    const s = seat();
    if (!s) return;
    s.player.connected = false;
    if (connected(s.table).length > 0) {
      maybeAdvance(s.table);
      broadcast(s.table);
    } else {
      s.table.lastActive = Date.now();
    }
  });
}

// 誰もいなくなった卓・終わって時間のたった卓を片づける
function sweep() {
  const now = Date.now();
  for (const t of tables.values()) {
    const gone = connected(t).length === 0 && now - t.lastActive > ABANDON_MS;
    const stale = t.phase === "final" && now - t.finishedAt > FINAL_KEEP_MS;
    if (gone || stale) deleteTable(t);
  }
}

module.exports = function register({ nsp }) {
  io = nsp;
  io.on("connection", onConnection);
  setInterval(sweep, 20 * 1000).unref();
};
