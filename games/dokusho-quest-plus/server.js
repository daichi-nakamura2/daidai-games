// ============================================================
// 読書クエスト＋（読書会モード） — サーバーロジック
//   だいだいゲームズの共通サーバー(../../server.js)から読み込まれる。
//   通信は Socket.io のネームスペース `/games/dokusho-quest-plus` 上で行うので、
//   このゲームの通信が他のゲームに混ざることはない。
//   画面ファイルは ./public/ 以下に置く。
// ============================================================

// 共通サーバーから渡されるネームスペース。
// 以降のコードでは今までどおり `io` として使える。
let io = null;

// ---------- 定数 ----------
const GIFT_XP_TO_AUTHOR = 20; // EXPを贈られた人がもらう
const GIFT_XP_TO_GIFTER = 5; // 贈った人ももらえる応援ボーナス
const GIFT_COMMENT_BONUS = 5; // 応援コメントを添えて贈ると、贈った人に上乗せ
const MAX_CHEER = 60;
const MAX_ACTION = 100;
// 応援コメントにふさわしくない言葉(public/data.js の DQ.NG_WORDS と同じ内容)
const NG_WORDS = [
  "つまらな", "くだらな", "意味不明", "意味ない", "ばか", "バカ", "馬鹿",
  "アホ", "きもい", "キモい", "うざい", "ウザい", "下手",
  "ダサ", "だっさ", "死ね", "消えろ", "最悪", "微妙", "浅い", "薄っぺら",
];
const MAX_NAME = 20;
const MAX_TITLE = 60;
const MAX_MEMO = 500;
const MAX_MISSION = 60;
const MAX_PLAYER_ID = 40;
// 全員の接続が切れても、この時間だけは部屋を残す(再読み込み・電波切れからの復帰用)
const ROOM_GRACE_MS = 10 * 60 * 1000;
// ホストが切れてから、別の人に👑を引き継ぐまでの猶予
// (再読み込みや一瞬の電波切れでホストが替わってしまわないように)
const HOST_GRACE_MS = 60 * 1000;
const ALLOWED_MINUTES = [15, 25, 60, 90]; // みんなで読書の時間の選択肢

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

// 読書アウトプットの獲得EXPを計算(public/data.js の DQ.calcSessionXp と同じ式)
function baseXpFor({ minutes, missionBonus, memoLength, hasAction }) {
  const m = Math.max(1, Math.min(600, Math.round(Number(minutes) || 1)));
  const bonus = Math.max(0, Math.min(100, Math.round(Number(missionBonus) || 0)));
  const memo = memoLength > 0 ? 20 : 0;
  const deep = memoLength >= 200 ? 20 : memoLength >= 100 ? 10 : 0; // じっくり書いたボーナス
  const action = hasAction ? 10 : 0; // 明日の一歩
  return 20 + m * 2 + bonus + memo + deep + action;
}

function createRoom(hostSocketId, hostPlayerId, hostName, totalXp) {
  const code = makeRoomCode();
  const room = {
    code,
    hostId: hostPlayerId,
    // playerId -> { name, totalXp, connected, sockets }
    //   キーは socket.id ではなく端末の固定IDなので、
    //   再読み込みや電波切れでつなぎ直しても同じ人として復帰できる
    players: new Map(),
    feed: [], // 読書アウトプットの配列(古い順)
    nextOutputId: 1,
    session: null, // みんなで読書の共有タイマー { minutes, endsAt }
    sessionTimeout: null, // 終了時に全員へ再通知するためのタイマー
    emptyTimeout: null, // 全員切断後、部屋を片づけるまでの猶予タイマー
    hostTimeout: null, // ホストの引き継ぎを待つ猶予タイマー
  };
  room.players.set(hostPlayerId, {
    name: hostName,
    totalXp,
    connected: true,
    // 同じ人が複数タブ(端末)で開いていても1人として扱えるよう、接続を集合で持つ
    sockets: new Set([hostSocketId]),
  });
  rooms.set(code, room);
  return room;
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
    if (r.sessionTimeout) clearTimeout(r.sessionTimeout);
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

// クライアントに送る公開状態
function publicState(room) {
  return {
    code: room.code,
    hostId: room.hostId,
    // 共有読書タイマー(残り時間はブロードキャスト時点で計算して渡す)
    session: room.session
      ? {
          minutes: room.session.minutes,
          remainingMs: Math.max(0, room.session.endsAt - Date.now()),
        }
      : null,
    players: [...room.players.entries()].map(([id, p]) => ({
      id,
      name: p.name,
      totalXp: p.totalXp,
      connected: p.connected,
    })),
    feed: room.feed.map((o) => ({
      id: o.id,
      authorId: o.authorId,
      authorName: o.authorName,
      bookTitle: o.bookTitle,
      missionIcon: o.missionIcon,
      missionTitle: o.missionTitle,
      memo: o.memo,
      action: o.action,
      minutes: o.minutes,
      baseXp: o.baseXp,
      giftCount: Object.keys(o.gifts).length,
      gifterIds: Object.keys(o.gifts),
      // 応援コメント(贈られた順)。贈った人の名前は今の表示名を使う
      cheers: Object.entries(o.gifts)
        .filter(([, g]) => g.comment)
        .sort((a, b) => a[1].at - b[1].at)
        .map(([gid, g]) => ({
          gifterId: gid,
          gifterName: (room.players.get(gid) || {}).name || "だれか",
          comment: g.comment,
          at: g.at,
        })),
      createdAt: o.createdAt,
    })),
  };
}

function broadcastState(room) {
  io.to(room.code).emit("roomUpdate", publicState(room));
}

// ---------- Socket.io ----------
function onConnection(socket) {
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

  // 部屋に入る(読書会は途中参加OK / 同じ端末なら再入室で元の自分に戻る)
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
      // 再入室: EXPも投稿も引き継ぐ(XPはサーバーの値が正)
      existing.sockets.add(socket.id);
      existing.connected = true;
      if (newName && newName !== existing.name) {
        existing.name = newName;
        // 過去の投稿の表示名もそろえる
        for (const o of room.feed) {
          if (o.authorId === pid) o.authorName = newName;
        }
      }
    } else {
      room.players.set(pid, {
        name: newName || "プレイヤー",
        totalXp: cleanXp(totalXp),
        connected: true,
        sockets: new Set([socket.id]),
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

  // 読書アウトプットを投稿(EXPはサーバーで計算)
  socket.on("submitOutput", (data) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    const player = room.players.get(socket.data.playerId);
    if (!player) return;

    const minutes = Math.max(1, Math.min(600, Math.round(Number(data.minutes) || 1)));
    const memo = cleanStr(data.memo, MAX_MEMO);
    const action = cleanStr(data.action, MAX_ACTION);
    const baseXp = baseXpFor({
      minutes,
      missionBonus: data.missionBonus,
      memoLength: memo.length,
      hasAction: action.length > 0,
    });

    const output = {
      id: room.nextOutputId++,
      authorId: socket.data.playerId,
      authorName: player.name,
      bookTitle: cleanStr(data.bookTitle, MAX_TITLE) || "(無題)",
      missionIcon: cleanStr(data.missionIcon, 8),
      missionTitle: cleanStr(data.missionTitle, MAX_MISSION),
      memo,
      action,
      minutes,
      baseXp,
      gifts: {}, // 贈った人の playerId -> { comment, at }
      createdAt: Date.now(),
    };
    room.feed.push(output);
    player.totalXp += baseXp;
    broadcastState(room);
  });

  // 誰かのアウトプットにEXPと応援コメントを贈る(1アウトプットにつき1人1回、自分にはNG)
  socket.on("giftXp", ({ outputId, comment }) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    const pid = socket.data.playerId;
    const gifter = room.players.get(pid);
    if (!gifter) return;
    const output = room.feed.find((o) => o.id === Number(outputId));
    if (!output) return;
    if (output.authorId === pid) return; // 自分の投稿には贈れない
    if (output.gifts[pid]) return; // 1投稿につき1人1回

    const cheer = cleanStr(comment, MAX_CHEER).replace(/\s+/g, " ");
    // 画面側でも止めているが、念のためサーバーでもポジティブでない言葉は受け付けない
    if (NG_WORDS.some((w) => cheer.includes(w))) return;

    output.gifts[pid] = { comment: cheer, at: Date.now() };
    const author = room.players.get(output.authorId);
    if (author) author.totalXp += GIFT_XP_TO_AUTHOR;
    gifter.totalXp += GIFT_XP_TO_GIFTER + (cheer ? GIFT_COMMENT_BONUS : 0);
    broadcastState(room);
  });

  // ホストが「みんなで一斉に読書」を開始(全員が同じカウントダウンを見る)
  socket.on("startReading", ({ minutes }) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.data.playerId) return;
    const m = ALLOWED_MINUTES.includes(Number(minutes)) ? Number(minutes) : 15;
    if (room.sessionTimeout) clearTimeout(room.sessionTimeout);
    room.session = { minutes: m, endsAt: Date.now() + m * 60000 };
    // 終了時にもう一度ブロードキャストして、全員のUIを「終了」に切り替える
    room.sessionTimeout = setTimeout(() => {
      room.sessionTimeout = null;
      const r = rooms.get(room.code);
      if (r) broadcastState(r);
    }, m * 60000 + 500);
    broadcastState(room);
  });

  // ホストが読書タイムを早めに終える
  socket.on("stopReading", () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.data.playerId || !room.session) return;
    if (room.sessionTimeout) {
      clearTimeout(room.sessionTimeout);
      room.sessionTimeout = null;
    }
    room.session.endsAt = Date.now(); // 残り0にして終了
    broadcastState(room);
  });

  socket.on("disconnect", () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    const pid = socket.data.playerId;
    const player = room.players.get(pid);
    if (!player) return;
    player.sockets.delete(socket.id);
    // 別のタブ・別の接続がまだ生きているなら、その人はまだ部屋にいる
    if (player.sockets.size > 0) return;
    player.connected = false;

    // ホストが抜けても、しばらくは👑を空けて待つ
    // (再読み込み・一瞬の電波切れでホストが替わらないように)
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
