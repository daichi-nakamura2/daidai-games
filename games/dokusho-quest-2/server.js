// ============================================================
// 読書クエスト2.0 — サーバーロジック
//   だいだいゲームズの共通サーバー(../../server.js)から読み込まれる。
//   通信は Socket.io のネームスペース `/games/dokusho-quest-2` 上で行う。
//
//   1.0 との一番の違い:
//     部屋が「今どのSTEPか(phase)」を持ち、ホストのボタンで全員が同時に進む。
//     参加者は1人1つの「エントリー」(本・カード・メモ・仮アクション・
//     フィードバック・最終アクション)を育てていく。
// ============================================================

// 共通サーバーから渡されるネームスペース。以降 `io` として使える。
let io = null;

// ---------- 進行のSTEP ----------
// lobby   : あつまる(チュートリアル)
// mission : STEP1 ミッションを決める
// reading : STEP2 みんなで読書
// draft   : STEP3+4 読書内容を整理して「仮アクション」を書く
// share   : STEP5+6 1人ずつ共有 → 全員からフィードバック
// final   : STEP7 最終アクションを決める
// done    : しめくくり(24時間以内に実行)
const PHASES = ["lobby", "mission", "reading", "draft", "share", "final", "done"];
// メモと仮アクションを部屋の全員に見せてよいのは、共有STEPに入ってから。
// (先に自分ひとりで考えてから人に話す、という体験を守るため)
const REVEAL_PHASES = new Set(["share", "final", "done"]);

// ---------- EXP ----------
const GIFT_XP_TO_AUTHOR = 20; // フィードバックをもらった人
const GIFT_XP_TO_GIFTER = 5; // フィードバックを贈った人
const GIFT_COMMENT_BONUS = 5; // ひとこと添えたときの上乗せ
const FINAL_XP_CHANGED = 30; // 仮アクションから変化した最終アクション
const FINAL_XP_KEPT = 15; // 仮アクションを貫いた最終アクション

// ---------- 入力の上限 ----------
const MAX_CHEER = 60;
const MAX_ACTION = 100;
const MAX_MEMO = 500;
const MAX_NAME = 20;
const MAX_TITLE = 60;
const MAX_MISSION = 60;
const MAX_PLAYER_ID = 40;

// 応援コメントにふさわしくない言葉(public/data.js の DQ.NG_WORDS と同じ内容)
const NG_WORDS = [
  "つまらな", "くだらな", "意味不明", "意味ない", "ばか", "バカ", "馬鹿",
  "アホ", "きもい", "キモい", "うざい", "ウザい", "下手",
  "ダサ", "だっさ", "死ね", "消えろ", "最悪", "微妙", "浅い", "薄っぺら",
];

// ---------- タイマー ----------
const READING_MINUTES = [15, 20, 25, 30]; // 読書タイムの選択肢
const SHARE_SECONDS = [90, 120, 180, 240]; // 1人あたりの共有時間の選択肢
const DEFAULT_READING_MINUTES = 20;
const DEFAULT_SHARE_SECONDS = 120;
const EXTEND_SECONDS = 60; // 「＋1分」ボタン

// 全員の接続が切れても、この時間だけは部屋を残す(再読み込み・電波切れ用)
const ROOM_GRACE_MS = 30 * 60 * 1000;
// ホストが切れてから、別の人に👑を引き継ぐまでの猶予
const HOST_GRACE_MS = 60 * 1000;

/** @type {Map<string, object>} 部屋コード -> 部屋 */
const rooms = new Map();

// ---------- ユーティリティ ----------
function makeRoomCode() {
  // 紛らわしい文字(0/O/1/I)を除いた4文字
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code;
  do {
    code = Array.from(
      { length: 4 },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join("");
  } while (rooms.has(code));
  return code;
}

function cleanStr(s, max) {
  return String(s || "").trim().slice(0, max);
}

// プレイヤーID(端末が localStorage に持つ固定ID)。無ければ socket.id で代用する
function cleanPlayerId(id, fallback) {
  const s = String(id || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, MAX_PLAYER_ID);
  return s || fallback;
}

function cleanXp(n) {
  const x = Math.round(Number(n) || 0);
  return Math.max(0, Math.min(10000000, x));
}

// 読書アウトプットの獲得EXP(public/data.js の DQ.calcOutputXp と同じ式にそろえること)
function outputXpFor({ minutes, missionBonus, memoLength, hasAction }) {
  const m = Math.max(1, Math.min(600, Math.round(Number(minutes) || 1)));
  const bonus = Math.max(0, Math.min(100, Math.round(Number(missionBonus) || 0)));
  const memo = memoLength > 0 ? 20 : 0;
  const deep = memoLength >= 200 ? 20 : memoLength >= 100 ? 10 : 0; // じっくり書いたボーナス
  const action = hasAction ? 10 : 0; // 仮アクション
  return 20 + m * 2 + bonus + memo + deep + action;
}

// ---------- 部屋 ----------
function createRoom(hostSocketId, hostPlayerId, hostName, totalXp) {
  const code = makeRoomCode();
  const room = {
    code,
    hostId: hostPlayerId,
    // playerId -> { name, totalXp, connected, sockets }
    //   キーは socket.id ではなく端末の固定IDなので、
    //   再読み込みや電波切れでつなぎ直しても同じ人として復帰できる
    players: new Map(),
    phase: "lobby",
    // playerId -> エントリー(1人1つ、1ラウンド制)
    entries: new Map(),
    // 共有タイマー { kind: "reading"|"share", label, endsAt, durationMs }
    timer: null,
    timerTimeout: null,
    // 共有STEPの発表順 { order: [playerId], index: 0 }
    stage: null,
    readingMinutes: DEFAULT_READING_MINUTES,
    shareSeconds: DEFAULT_SHARE_SECONDS,
    emptyTimeout: null, // 全員切断後、部屋を片づけるまでの猶予タイマー
    hostTimeout: null, // ホストの引き継ぎを待つ猶予タイマー
  };
  room.players.set(hostPlayerId, {
    name: hostName,
    totalXp,
    connected: true,
    // 同じ人が複数タブで開いていても1人として扱えるよう、接続を集合で持つ
    sockets: new Set([hostSocketId]),
    joinedAt: Date.now(),
  });
  rooms.set(code, room);
  return room;
}

/** その人のエントリーを取り出す(無ければ作る) */
function entryFor(room, playerId) {
  let e = room.entries.get(playerId);
  if (!e) {
    e = {
      playerId,
      bookTitle: "",
      missionIcon: "",
      missionTitle: "",
      missionBonus: 0,
      memo: "",
      draftAction: "",
      finalAction: "",
      feedback: {}, // gifterId -> { comment, at }
      outputXp: 0, // 付与ずみのEXP(二重付与ふせぎ)
      finalXp: 0,
      draftAt: 0,
      finalAt: 0,
    };
    room.entries.set(playerId, e);
  }
  return e;
}

function isHost(room, socket) {
  return room.hostId === socket.data.playerId;
}

// 誰かが戻ってきたら、部屋の片づけ予約を取り消す
function cancelRoomCleanup(room) {
  if (room.emptyTimeout) {
    clearTimeout(room.emptyTimeout);
    room.emptyTimeout = null;
  }
}

// 全員の接続が切れたときは、すぐ消さずに猶予時間だけ部屋を残す
function scheduleRoomCleanup(room) {
  cancelRoomCleanup(room);
  room.emptyTimeout = setTimeout(() => {
    room.emptyTimeout = null;
    const r = rooms.get(room.code);
    if (!r || r.emptyTimeout) return;
    const anyConnected = [...r.players.values()].some((p) => p.connected);
    if (anyConnected) return;
    if (r.timerTimeout) clearTimeout(r.timerTimeout);
    if (r.hostTimeout) clearTimeout(r.hostTimeout);
    rooms.delete(r.code);
  }, ROOM_GRACE_MS);
}

// ホストが戻ってきた(または誰かが入ってきた)ので、引き継ぎ予約を取り消す
function cancelHostHandover(room) {
  if (room.hostTimeout) {
    clearTimeout(room.hostTimeout);
    room.hostTimeout = null;
  }
}

// ホストが切れたとき、すぐには替えずに猶予を置いてから引き継ぐ
function scheduleHostHandover(room, leftHostId) {
  cancelHostHandover(room);
  room.hostTimeout = setTimeout(() => {
    room.hostTimeout = null;
    const r = rooms.get(room.code);
    if (!r || r.hostId !== leftHostId) return;
    const host = r.players.get(leftHostId);
    if (host && host.connected) return; // 戻ってきていた
    const next = [...r.players.entries()].find(
      ([id, p]) => id !== leftHostId && p.connected,
    );
    if (next) {
      r.hostId = next[0];
      broadcastState(r);
    }
  }, HOST_GRACE_MS);
}

// ---------- タイマー ----------
function clearTimer(room) {
  if (room.timerTimeout) {
    clearTimeout(room.timerTimeout);
    room.timerTimeout = null;
  }
}

/**
 * 部屋の全員が同じカウントダウンを見る共有タイマーを開始する。
 * 読書タイマーが自然に終わったときだけ、自動で次のSTEP(draft)へ進める。
 */
function startTimer(room, { kind, label, ms }) {
  clearTimer(room);
  room.timer = { kind, label, endsAt: Date.now() + ms, durationMs: ms };
  room.timerTimeout = setTimeout(() => {
    room.timerTimeout = null;
    const r = rooms.get(room.code);
    if (!r || !r.timer || r.timer.kind !== kind) return;
    // 読書タイムが終わったら、ホストの操作を待たずに「仮アクション」STEPへ
    if (kind === "reading" && r.phase === "reading") r.phase = "draft";
    broadcastState(r);
  }, ms + 500);
}

// ---------- 公開状態 ----------
function serializeEntry(room, e, revealed) {
  const player = room.players.get(e.playerId) || {};
  return {
    playerId: e.playerId,
    name: player.name || "だれか",
    bookTitle: e.bookTitle,
    missionIcon: e.missionIcon,
    missionTitle: e.missionTitle,
    // 進み具合(常に全員へ。「あと何人待ち?」がホストに分かるように)
    hasMission: !!e.missionTitle,
    hasDraft: e.draftAt > 0,
    hasFinal: e.finalAt > 0,
    // 中身は共有STEP以降だけ公開する
    memo: revealed ? e.memo : "",
    draftAction: revealed ? e.draftAction : "",
    finalAction: revealed ? e.finalAction : "",
    actionChanged: revealed && e.finalAt > 0 ? e.finalAction !== e.draftAction : false,
    outputXp: e.outputXp,
    finalXp: e.finalXp,
    feedbackCount: Object.keys(e.feedback).length,
    gifterIds: Object.keys(e.feedback),
    feedback: Object.entries(e.feedback)
      .sort((a, b) => a[1].at - b[1].at)
      .map(([gid, f]) => ({
        gifterId: gid,
        gifterName: (room.players.get(gid) || {}).name || "だれか",
        comment: f.comment,
        at: f.at,
      })),
  };
}

/**
 * 部屋の状態。viewerId から見た形で作る
 * (自分が書いたものは、共有STEPより前でも自分にだけは見える)
 */
function publicState(room, viewerId) {
  const revealed = REVEAL_PHASES.has(room.phase);
  return {
    code: room.code,
    hostId: room.hostId,
    phase: room.phase,
    readingMinutes: room.readingMinutes,
    shareSeconds: room.shareSeconds,
    // 残り時間はブロードキャスト時点で計算して渡す(各端末で取り直す)
    timer: room.timer
      ? {
          kind: room.timer.kind,
          label: room.timer.label,
          durationMs: room.timer.durationMs,
          remainingMs: Math.max(0, room.timer.endsAt - Date.now()),
        }
      : null,
    stage: room.stage
      ? {
          order: room.stage.order,
          index: room.stage.index,
          currentId: room.stage.order[room.stage.index] || null,
          total: room.stage.order.length,
        }
      : null,
    players: [...room.players.entries()].map(([id, p]) => ({
      id,
      name: p.name,
      totalXp: p.totalXp,
      connected: p.connected,
    })),
    entries: [...room.entries.values()].map((e) =>
      serializeEntry(room, e, revealed || e.playerId === viewerId),
    ),
  };
}

// 人によって見える範囲が違うので、1人ずつその人向けの状態を送る
function broadcastState(room) {
  for (const [pid, player] of room.players) {
    if (player.sockets.size === 0) continue;
    const state = publicState(room, pid);
    for (const sid of player.sockets) io.to(sid).emit("roomUpdate", state);
  }
}

// ---------- Socket.io ----------
function onConnection(socket) {
  /** 今つながっている人の部屋を返す(無ければ null) */
  const myRoom = () => rooms.get(socket.data.roomCode) || null;

  // 部屋をつくる
  socket.on("createRoom", ({ name, totalXp, playerId }) => {
    const pid = cleanPlayerId(playerId, socket.id);
    const room = createRoom(
      socket.id,
      pid,
      cleanStr(name, MAX_NAME) || "ホスト",
      cleanXp(totalXp),
    );
    socket.join(room.code);
    socket.data.roomCode = room.code;
    socket.data.playerId = pid;
    socket.emit("joined", { code: room.code, selfId: pid });
    broadcastState(room);
  });

  // 部屋に入る(途中参加OK / 同じ端末なら再入室で元の自分に戻る)
  socket.on("joinRoom", ({ code, name, totalXp, playerId }) => {
    const room = rooms.get(cleanStr(code, 8).toUpperCase());
    if (!room) {
      socket.emit("errorMsg", "その部屋コードは見つかりませんでした。");
      return;
    }
    const pid = cleanPlayerId(playerId, socket.id);
    const newName = cleanStr(name, MAX_NAME);
    const existing = room.players.get(pid);

    if (existing) {
      // 再入室: EXPもエントリーも引き継ぐ(XPはサーバーの値が正)
      existing.sockets.add(socket.id);
      existing.connected = true;
      if (newName) existing.name = newName;
    } else {
      room.players.set(pid, {
        name: newName || "プレイヤー",
        totalXp: cleanXp(totalXp),
        connected: true,
        sockets: new Set([socket.id]),
        joinedAt: Date.now(),
      });
    }

    cancelRoomCleanup(room);
    // 元ホストが戻ってきたなら、👑はそのまま本人に残す
    if (room.hostId === pid) cancelHostHandover(room);
    socket.join(room.code);
    socket.data.roomCode = room.code;
    socket.data.playerId = pid;
    socket.emit("joined", { code: room.code, selfId: pid });
    broadcastState(room);
  });

  // ---------- 参加者の操作 ----------

  // STEP1: 本とミッションカードを決めた
  socket.on("setMission", ({ bookTitle, missionIcon, missionTitle, missionBonus }) => {
    const room = myRoom();
    if (!room || !room.players.has(socket.data.playerId)) return;
    const e = entryFor(room, socket.data.playerId);
    e.bookTitle = cleanStr(bookTitle, MAX_TITLE) || "(無題)";
    e.missionIcon = cleanStr(missionIcon, 8);
    e.missionTitle = cleanStr(missionTitle, MAX_MISSION);
    e.missionBonus = Math.max(0, Math.min(100, Math.round(Number(missionBonus) || 0)));
    broadcastState(room);
  });

  // STEP3+4: 読書メモと「仮アクション」を提出(ここでアウトプットEXPが入る)
  socket.on("submitDraft", ({ memo, draftAction }) => {
    const room = myRoom();
    if (!room) return;
    const player = room.players.get(socket.data.playerId);
    if (!player) return;
    const e = entryFor(room, socket.data.playerId);

    e.memo = cleanStr(memo, MAX_MEMO);
    e.draftAction = cleanStr(draftAction, MAX_ACTION);
    e.draftAt = Date.now();

    // EXPは「今の内容でいくら分か」を計算し、すでに払った分との差額だけ足す。
    // (書き直して再提出しても二重取りにならない)
    const earned = outputXpFor({
      minutes: room.readingMinutes,
      missionBonus: e.missionBonus,
      memoLength: e.memo.length,
      hasAction: e.draftAction.length > 0,
    });
    if (earned > e.outputXp) {
      player.totalXp += earned - e.outputXp;
      e.outputXp = earned;
    }
    broadcastState(room);
  });

  // STEP6: 誰かにフィードバック(EXP＋ひとこと)を贈る。1人につき1回、自分にはNG
  socket.on("sendFeedback", ({ targetId, comment }) => {
    const room = myRoom();
    if (!room) return;
    const pid = socket.data.playerId;
    const gifter = room.players.get(pid);
    if (!gifter) return;
    const target = cleanPlayerId(targetId, "");
    if (!target || target === pid) return;
    if (!room.players.has(target)) return;
    // 何も書かずに口頭だけで話した人にも贈れるように、無ければエントリーを作る
    const e = entryFor(room, target);
    if (e.feedback[pid]) return; // 1人につき1回

    const cheer = cleanStr(comment, MAX_CHEER).replace(/\s+/g, " ");
    // 画面側でも止めているが、念のためサーバーでもポジティブでない言葉は受け付けない
    if (NG_WORDS.some((w) => cheer.includes(w))) return;

    e.feedback[pid] = { comment: cheer, at: Date.now() };
    const author = room.players.get(target);
    if (author) author.totalXp += GIFT_XP_TO_AUTHOR;
    gifter.totalXp += GIFT_XP_TO_GIFTER + (cheer ? GIFT_COMMENT_BONUS : 0);
    broadcastState(room);
  });

  // STEP7: 最終アクションを確定する
  socket.on("submitFinal", ({ finalAction }) => {
    const room = myRoom();
    if (!room) return;
    const player = room.players.get(socket.data.playerId);
    if (!player) return;
    const e = entryFor(room, socket.data.playerId);
    const action = cleanStr(finalAction, MAX_ACTION);
    if (!action) return;

    e.finalAction = action;
    e.finalAt = Date.now();
    // 仮アクションから変わっていたら、対話で行動が具体化した証としてEXPを多めに
    const earned = action !== e.draftAction ? FINAL_XP_CHANGED : FINAL_XP_KEPT;
    if (earned > e.finalXp) {
      player.totalXp += earned - e.finalXp;
      e.finalXp = earned;
    }
    broadcastState(room);
  });

  // ---------- ホストの進行操作 ----------

  // STEPを切り替える
  socket.on("setPhase", ({ phase }) => {
    const room = myRoom();
    if (!room || !isHost(room, socket)) return;
    if (!PHASES.includes(phase)) return;
    room.phase = phase;
    // STEPが変わったら、前のSTEPのタイマーは片づける
    if (phase !== "reading" && phase !== "share") {
      clearTimer(room);
      room.timer = null;
    }
    broadcastState(room);
  });

  // 読書タイムを開始(全員のカウントダウンが一斉に始まる)
  socket.on("startReading", ({ minutes }) => {
    const room = myRoom();
    if (!room || !isHost(room, socket)) return;
    const m = READING_MINUTES.includes(Number(minutes))
      ? Number(minutes)
      : DEFAULT_READING_MINUTES;
    room.readingMinutes = m;
    room.phase = "reading";
    startTimer(room, { kind: "reading", label: `${m}分 読書`, ms: m * 60000 });
    broadcastState(room);
  });

  // 共有STEPを始める(発表順をつくって、1人目のタイマーを回す)
  socket.on("startShare", ({ seconds, shuffle }) => {
    const room = myRoom();
    if (!room || !isHost(room, socket)) return;
    const s = SHARE_SECONDS.includes(Number(seconds))
      ? Number(seconds)
      : DEFAULT_SHARE_SECONDS;
    room.shareSeconds = s;
    room.phase = "share";

    // 提出ずみの人を先に、まだの人を後ろに。提出順で並べる
    const submitted = [...room.entries.values()]
      .filter((e) => e.draftAt > 0 && room.players.has(e.playerId))
      .sort((a, b) => a.draftAt - b.draftAt)
      .map((e) => e.playerId);
    const rest = [...room.players.keys()].filter((id) => !submitted.includes(id));
    let order = [...submitted, ...rest];
    if (shuffle) {
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
    }
    room.stage = { order, index: 0 };
    startTimer(room, { kind: "share", label: "共有タイム", ms: s * 1000 });
    broadcastState(room);
  });

  // 発表者を進める / 戻す(進めると次の人のタイマーが自動で始まる)
  socket.on("movePresenter", ({ delta }) => {
    const room = myRoom();
    if (!room || !isHost(room, socket) || !room.stage) return;
    const next = room.stage.index + (Number(delta) > 0 ? 1 : -1);
    if (next < 0 || next >= room.stage.order.length) return;
    room.stage.index = next;
    startTimer(room, {
      kind: "share",
      label: "共有タイム",
      ms: room.shareSeconds * 1000,
    });
    broadcastState(room);
  });

  // タイマーを止める / 延長する
  socket.on("stopTimer", () => {
    const room = myRoom();
    if (!room || !isHost(room, socket) || !room.timer) return;
    clearTimer(room);
    room.timer.endsAt = Date.now(); // 残り0にして終了
    // 読書タイムを早じまいしたときも、自動で次のSTEPへ
    if (room.timer.kind === "reading" && room.phase === "reading") room.phase = "draft";
    broadcastState(room);
  });

  socket.on("extendTimer", () => {
    const room = myRoom();
    if (!room || !isHost(room, socket) || !room.timer) return;
    const remaining = Math.max(0, room.timer.endsAt - Date.now());
    startTimer(room, {
      kind: room.timer.kind,
      label: room.timer.label,
      ms: remaining + EXTEND_SECONDS * 1000,
    });
    broadcastState(room);
  });

  // 帰ってしまった人を一覧から外す(切断中の人だけ)
  socket.on("removePlayer", ({ playerId }) => {
    const room = myRoom();
    if (!room || !isHost(room, socket)) return;
    const target = cleanPlayerId(playerId, "");
    const p = room.players.get(target);
    if (!p || p.connected || target === room.hostId) return;
    room.players.delete(target);
    room.entries.delete(target);
    if (room.stage) {
      const i = room.stage.order.indexOf(target);
      if (i >= 0) {
        room.stage.order.splice(i, 1);
        if (room.stage.index > i) room.stage.index -= 1;
        room.stage.index = Math.max(
          0,
          Math.min(room.stage.index, room.stage.order.length - 1),
        );
      }
    }
    broadcastState(room);
  });

  socket.on("disconnect", () => {
    const room = myRoom();
    if (!room) return;
    const pid = socket.data.playerId;
    const player = room.players.get(pid);
    if (!player) return;
    player.sockets.delete(socket.id);
    // 別のタブ・別の接続がまだ生きているなら、その人はまだ部屋にいる
    if (player.sockets.size > 0) return;
    player.connected = false;

    // ホストが抜けても、しばらくは👑を空けて待つ
    if (room.hostId === pid) scheduleHostHandover(room, pid);

    // 全員切断しても、すぐには消さない(猶予のあいだに戻ってこられる)
    const anyConnected = [...room.players.values()].some((p) => p.connected);
    if (!anyConnected) {
      scheduleRoomCleanup(room);
      return;
    }
    broadcastState(room);
  });
}

// 共通サーバーから呼ばれる登録関数
module.exports = function register({ nsp }) {
  io = nsp;
  io.on("connection", onConnection);
};
