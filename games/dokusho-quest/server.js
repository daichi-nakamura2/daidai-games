// ============================================================
// 読書クエスト（読書会モード） — サーバーロジック
//   だいだいゲームズの共通サーバー(../../server.js)から読み込まれる。
//   通信は Socket.io のネームスペース `/games/dokusho-quest` 上で行うので、
//   このゲームの通信が他のゲームに混ざることはない。
//   画面ファイルは ./public/ 以下に置く。
// ============================================================

// 共通サーバーから渡されるネームスペース。
// 以降のコードでは今までどおり `io` として使える。
let io = null;

// ---------- 定数 ----------
const GIFT_XP_TO_AUTHOR = 20; // EXPを贈られた人がもらう
const GIFT_XP_TO_GIFTER = 5; // 贈った人ももらえる応援ボーナス
const MAX_NAME = 20;
const MAX_TITLE = 60;
const MAX_MEMO = 500;
const MAX_MISSION = 60;

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

function cleanXp(n) {
  const x = Math.round(Number(n) || 0);
  return Math.max(0, Math.min(10000000, x));
}

// 読書アウトプットの獲得EXPを計算(ソロ版と同じ式)
function baseXpFor({ minutes, missionBonus, hasMemo }) {
  const m = Math.max(1, Math.min(600, Math.round(Number(minutes) || 1)));
  const bonus = Math.max(0, Math.min(100, Math.round(Number(missionBonus) || 0)));
  return 20 + m * 2 + bonus + (hasMemo ? 20 : 0);
}

function createRoom(hostSocketId, hostName, totalXp) {
  const code = makeRoomCode();
  const room = {
    code,
    hostId: hostSocketId,
    // socketId -> { name, totalXp, connected }
    players: new Map(),
    feed: [], // 読書アウトプットの配列(古い順)
    nextOutputId: 1,
  };
  room.players.set(hostSocketId, { name: hostName, totalXp, connected: true });
  rooms.set(code, room);
  return room;
}

// クライアントに送る公開状態
function publicState(room) {
  return {
    code: room.code,
    hostId: room.hostId,
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
      minutes: o.minutes,
      baseXp: o.baseXp,
      giftCount: Object.keys(o.gifts).length,
      gifterIds: Object.keys(o.gifts),
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
  socket.on("createRoom", ({ name, totalXp }) => {
    const room = createRoom(
      socket.id,
      cleanStr(name, MAX_NAME) || "ホスト",
      cleanXp(totalXp),
    );
    socket.join(room.code);
    socket.data.roomCode = room.code;
    socket.emit("joined", { code: room.code, selfId: socket.id });
    broadcastState(room);
  });

  // 部屋に入る(読書会は途中参加OK)
  socket.on("joinRoom", ({ code, name, totalXp }) => {
    const room = rooms.get(cleanStr(code, 8).toUpperCase());
    if (!room) {
      socket.emit("errorMsg", "その部屋コードは見つかりませんでした。");
      return;
    }
    room.players.set(socket.id, {
      name: cleanStr(name, MAX_NAME) || "プレイヤー",
      totalXp: cleanXp(totalXp),
      connected: true,
    });
    socket.join(room.code);
    socket.data.roomCode = room.code;
    socket.emit("joined", { code: room.code, selfId: socket.id });
    broadcastState(room);
  });

  // 読書アウトプットを投稿(EXPはサーバーで計算)
  socket.on("submitOutput", (data) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    const player = room.players.get(socket.id);
    if (!player) return;

    const minutes = Math.max(1, Math.min(600, Math.round(Number(data.minutes) || 1)));
    const memo = cleanStr(data.memo, MAX_MEMO);
    const baseXp = baseXpFor({
      minutes,
      missionBonus: data.missionBonus,
      hasMemo: memo.length > 0,
    });

    const output = {
      id: room.nextOutputId++,
      authorId: socket.id,
      authorName: player.name,
      bookTitle: cleanStr(data.bookTitle, MAX_TITLE) || "(無題)",
      missionIcon: cleanStr(data.missionIcon, 8),
      missionTitle: cleanStr(data.missionTitle, MAX_MISSION),
      memo,
      minutes,
      baseXp,
      gifts: {}, // 贈った人の socketId -> true
      createdAt: Date.now(),
    };
    room.feed.push(output);
    player.totalXp += baseXp;
    broadcastState(room);
  });

  // 誰かのアウトプットにEXPを贈る(1アウトプットにつき1人1回、自分にはNG)
  socket.on("giftXp", ({ outputId }) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    const gifter = room.players.get(socket.id);
    if (!gifter) return;
    const output = room.feed.find((o) => o.id === Number(outputId));
    if (!output) return;
    if (output.authorId === socket.id) return;
    if (output.gifts[socket.id]) return;

    output.gifts[socket.id] = true;
    const author = room.players.get(output.authorId);
    if (author) author.totalXp += GIFT_XP_TO_AUTHOR;
    gifter.totalXp += GIFT_XP_TO_GIFTER;
    broadcastState(room);
  });

  socket.on("disconnect", () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    const player = room.players.get(socket.id);
    if (player) player.connected = false;

    // ホストが抜けたら、接続中の別の人にホストを引き継ぐ
    if (room.hostId === socket.id) {
      const next = [...room.players.entries()].find(
        ([id, p]) => id !== socket.id && p.connected,
      );
      if (next) room.hostId = next[0];
    }

    // 全員切断したら部屋を破棄
    const anyConnected = [...room.players.values()].some((p) => p.connected);
    if (!anyConnected) {
      rooms.delete(room.code);
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
