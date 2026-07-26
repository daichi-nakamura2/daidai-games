// ============================================================
// 勇気のしずくゲーム — サーバーロジック
//   だいだいゲームズの共通サーバー(../../server.js)から読み込まれる。
//   通信は Socket.io のネームスペース `/games/yuuki-no-shizuku` 上で行うので、
//   このゲームの通信が他のゲームに混ざることはない。
//   画面ファイルは ./public/ 以下に置く。
// ============================================================

// 共通サーバーから渡されるネームスペース。
// 以降のコードでは今までどおり `io` として使える。
let io = null;

const TOPICS = [
  '最近失敗したこと',
  '子どもの頃の夢',
  '今の悩み',
  '人に感謝していること',
  '本当は挑戦したいこと',
  '最近うれしかったこと',
  'なかなか人に言えない本音',
  '昔の自分に言ってあげたいこと',
  '実はコンプレックスに思っていること',
  '最近泣いたこと・泣きそうになったこと',
  '人生で一番怖かった経験',
  '誰かに謝りたいと思っていること',
  '自分の好きなところ',
  '自分のちょっと嫌いなところ',
  '最近腹が立ったこと',
  '憧れている人と、その理由',
  '明日すべての予定がなくなったらやりたいこと',
  '人に助けられて忘れられない経験',
  '今までの人生で一番の冒険',
  'どうしても捨てられないもの・こだわり',
  '最近見つけた小さな幸せ',
  '人間関係で悩んだ経験',
  '本当はやめたいと思っていること',
  '10年後、自分はどうなっていたいか',
  '人生でまだやり残していること',
  '初恋の思い出',
  '学生時代の一番の思い出',
  '「自分は変わったな」と思った瞬間',
  '家族への本音',
  '最近感動したこと',
  '今、一番ほしいもの',
  '誰にも言っていない小さな秘密',
  '頑張った自分にあげたいご褒美',
  '今年中に達成したいこと',
];

const SPEAK_SECONDS = 60;

// 判定の選択肢: 送られてくる値 → コイン枚数
const JUDGE_OPTIONS = {
  1: '勇気があった',
  2: 'とても勇気があった',
  3: '心を開いた',
};



/** @type {Map<string, object>} */
const rooms = new Map();

function makeRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (rooms.has(code));
  return code;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 器の容量（コイン枚数）。実物のコイン20〜30枚に合わせつつ、
// 1ターンの平均獲得枚数 ≒ (人数-1)×2 で全員に2〜3回ターンが回る程度にする。
function vesselCapacityFor(playerCount) {
  return Math.min(30, Math.max(15, 4 * playerCount * (playerCount - 1)));
}

function createRoom(hostSocketId, hostName) {
  const code = makeRoomCode();
  const room = {
    code,
    hostId: hostSocketId,
    players: new Map(), // socketId -> { name, coins, connected }
    deck: shuffle(TOPICS.map((_, i) => i)),
    currentTopic: null,
    phase: 'lobby', // lobby | topic | speaking | judging | result | ended
    turnOrder: [],
    turnIndex: 0,
    vesselCoins: 0,
    vesselCapacity: 0,
    judgments: new Map(), // judgeId -> 1|2|3
    lastResult: null,
    winnerId: null,
    timerEndsAt: null,
    timerTimeout: null,
  };
  room.players.set(hostSocketId, { name: hostName, coins: 0, connected: true });
  rooms.set(code, room);
  return room;
}

function speakerId(room) {
  return room.turnOrder[room.turnIndex] || null;
}

function connectedPlayers(room) {
  return [...room.players.entries()].filter(([, p]) => p.connected);
}

function judgeIds(room) {
  const sp = speakerId(room);
  return connectedPlayers(room)
    .map(([id]) => id)
    .filter((id) => id !== sp);
}

function publicState(room) {
  return {
    code: room.code,
    hostId: room.hostId,
    phase: room.phase,
    currentTopic: room.currentTopic,
    speakerId: speakerId(room),
    vesselCoins: room.vesselCoins,
    vesselCapacity: room.vesselCapacity,
    timerEndsAt: room.timerEndsAt,
    judgedIds: [...room.judgments.keys()],
    judgesTotal: room.phase === 'judging' ? judgeIds(room).length : 0,
    lastResult: room.lastResult,
    winnerId: room.winnerId,
    players: [...room.players.entries()].map(([id, p]) => ({
      id,
      name: p.name,
      coins: p.coins,
      connected: p.connected,
    })),
  };
}

function broadcastState(room) {
  io.to(room.code).emit('roomUpdate', publicState(room));
}

function clearTimer(room) {
  if (room.timerTimeout) {
    clearTimeout(room.timerTimeout);
    room.timerTimeout = null;
  }
  room.timerEndsAt = null;
}

function drawNextCard(room) {
  if (room.deck.length === 0) {
    room.deck = shuffle(TOPICS.map((_, i) => i));
  }
  const idx = room.deck.pop();
  room.currentTopic = TOPICS[idx];
}

function endSpeaking(room) {
  if (room.phase !== 'speaking') return;
  clearTimer(room);
  room.phase = 'judging';
  room.judgments = new Map();
  broadcastState(room);
  checkJudgingComplete(room);
}

function checkJudgingComplete(room) {
  if (room.phase !== 'judging') return;
  const judges = judgeIds(room);
  const allJudged = judges.length > 0 && judges.every((id) => room.judgments.has(id));
  if (allJudged) tallyJudgments(room);
}

function tallyJudgments(room) {
  const sp = speakerId(room);
  const speaker = room.players.get(sp);
  let gained = 0;
  const counts = { 1: 0, 2: 0, 3: 0 };
  for (const [, value] of room.judgments) {
    gained += value;
    counts[value] += 1;
  }
  if (speaker) speaker.coins += gained;
  room.vesselCoins += gained;
  const overflowed = room.vesselCoins > room.vesselCapacity;
  room.lastResult = {
    speakerId: sp,
    speakerName: speaker ? speaker.name : '(退出済み)',
    gained,
    counts,
    labels: JUDGE_OPTIONS,
    overflowed,
  };
  if (overflowed) {
    room.winnerId = sp;
    room.phase = 'ended';
  } else {
    room.phase = 'result';
  }
  broadcastState(room);
}

function advanceTurn(room) {
  const total = room.turnOrder.length;
  for (let i = 1; i <= total; i++) {
    const idx = (room.turnIndex + i) % total;
    const p = room.players.get(room.turnOrder[idx]);
    if (p && p.connected) {
      room.turnIndex = idx;
      return true;
    }
  }
  return false;
}

function onConnection(socket) {
  socket.on('createRoom', ({ name }) => {
    const cleanName = (name || '').trim().slice(0, 20) || 'ホスト';
    const room = createRoom(socket.id, cleanName);
    socket.join(room.code);
    socket.data.roomCode = room.code;
    socket.emit('joined', { code: room.code, selfId: socket.id });
    broadcastState(room);
  });

  socket.on('joinRoom', ({ code, name }) => {
    const room = rooms.get((code || '').toUpperCase());
    if (!room) {
      socket.emit('errorMsg', 'その部屋コードは見つかりませんでした。');
      return;
    }
    if (room.phase !== 'lobby') {
      socket.emit('errorMsg', 'このゲームはすでに開始されています。');
      return;
    }
    const cleanName = (name || '').trim().slice(0, 20) || 'プレイヤー';
    room.players.set(socket.id, { name: cleanName, coins: 0, connected: true });
    socket.join(room.code);
    socket.data.roomCode = room.code;
    socket.emit('joined', { code: room.code, selfId: socket.id });
    broadcastState(room);
  });

  socket.on('startGame', () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.id || room.phase !== 'lobby') return;
    const connected = connectedPlayers(room);
    if (connected.length < 2) {
      socket.emit('errorMsg', '2人以上集まってから開始してください。');
      return;
    }
    // 切断されたままのプレイヤーはゲームから外す
    for (const [id, p] of room.players) {
      if (!p.connected) room.players.delete(id);
      else p.coins = 0;
    }
    room.turnOrder = shuffle([...room.players.keys()]);
    room.turnIndex = 0;
    room.vesselCoins = 0;
    room.vesselCapacity = vesselCapacityFor(room.players.size);
    room.winnerId = null;
    room.lastResult = null;
    room.deck = shuffle(TOPICS.map((_, i) => i));
    drawNextCard(room);
    room.phase = 'topic';
    broadcastState(room);
  });

  // 話し手（またはホスト）が発表タイマーを開始
  socket.on('startSpeaking', () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.phase !== 'topic') return;
    if (socket.id !== speakerId(room) && socket.id !== room.hostId) return;
    room.phase = 'speaking';
    room.timerEndsAt = Date.now() + SPEAK_SECONDS * 1000;
    room.timerTimeout = setTimeout(() => endSpeaking(room), SPEAK_SECONDS * 1000);
    broadcastState(room);
  });

  // 話し手（またはホスト）が、答えたくないお題をパスして次の人へ（ペナルティなし）
  socket.on('passTopic', () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.phase !== 'topic') return;
    if (socket.id !== speakerId(room) && socket.id !== room.hostId) return;
    clearTimer(room);
    const passer = room.players.get(speakerId(room));
    room.lastResult = null;
    if (!advanceTurn(room)) return;
    drawNextCard(room);
    room.phase = 'topic';
    io.to(room.code).emit('passNotice', {
      name: passer ? passer.name : '',
    });
    broadcastState(room);
  });

  // 話し手（またはホスト）が早めに話を締める
  socket.on('endSpeaking', () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.phase !== 'speaking') return;
    if (socket.id !== speakerId(room) && socket.id !== room.hostId) return;
    endSpeaking(room);
  });

  socket.on('judge', ({ value }) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.phase !== 'judging') return;
    const v = Number(value);
    if (![1, 2, 3].includes(v)) return;
    if (!judgeIds(room).includes(socket.id)) return;
    room.judgments.set(socket.id, v);
    broadcastState(room);
    checkJudgingComplete(room);
  });

  socket.on('nextTurn', () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.id || room.phase !== 'result') return;
    room.lastResult = null;
    if (!advanceTurn(room)) return;
    drawNextCard(room);
    room.phase = 'topic';
    broadcastState(room);
  });

  socket.on('backToLobby', () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.id || room.phase !== 'ended') return;
    clearTimer(room);
    for (const [id, p] of room.players) {
      if (!p.connected) room.players.delete(id);
    }
    room.phase = 'lobby';
    room.currentTopic = null;
    room.vesselCoins = 0;
    room.winnerId = null;
    room.lastResult = null;
    broadcastState(room);
  });

  socket.on('endGame', () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.id) return;
    clearTimer(room);
    room.phase = 'ended';
    broadcastState(room);
  });

  socket.on('disconnect', () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    const player = room.players.get(socket.id);
    if (player) player.connected = false;

    if (room.hostId === socket.id) {
      const nextHost = connectedPlayers(room).find(([id]) => id !== socket.id);
      if (nextHost) room.hostId = nextHost[0];
    }

    const remaining = connectedPlayers(room);
    if (remaining.length === 0) {
      clearTimer(room);
      rooms.delete(room.code);
      return;
    }

    if (room.phase !== 'lobby' && room.phase !== 'ended') {
      if (remaining.length < 2) {
        // 1人だけ残った場合はゲーム続行不能
        clearTimer(room);
        room.phase = 'ended';
      } else if (socket.id === speakerId(room) && (room.phase === 'topic' || room.phase === 'speaking' || room.phase === 'judging')) {
        // 話し手が退出したらそのターンは流して次へ
        clearTimer(room);
        room.judgments = new Map();
        room.lastResult = null;
        if (advanceTurn(room)) {
          drawNextCard(room);
          room.phase = 'topic';
        } else {
          room.phase = 'ended';
        }
      }
    }

    broadcastState(room);
    checkJudgingComplete(room);
  });
}

// 共通サーバーから呼ばれる登録関数
module.exports = function register({ nsp }) {
  io = nsp;
  io.on("connection", onConnection);
};
