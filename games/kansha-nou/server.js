// ============================================================
// 感謝脳ゲーム — サーバーロジック
//   だいだいゲームズの共通サーバー(../../server.js)から読み込まれる。
//   通信は Socket.io のネームスペース `/games/kansha-nou` 上で行うので、
//   このゲームの通信が他のゲームに混ざることはない。
//   画面ファイルは ./public/ 以下に置く。
// ============================================================

// 共通サーバーから渡されるネームスペース。
// 以降のコードでは今までどおり `io` として使える。
let io = null;

const TOPICS = [
  '上司に厳しい指摘を受けた。',
  'プロジェクトが思い通りに進まない。',
  '同僚に仕事を押し付けられたと感じる。',
  '昇進が見送られてしまった。',
  '残業が続いて疲れが溜まっている。',
  'クレーム対応を任されることになった。',
  '同僚のミスをフォローすることになった。',
  '取引先に急な予定変更を言われた。',
  '会議で意見を否定された。',
  '突然の転勤を命じられた。',
  '友人に約束をキャンセルされた。',
  '親しい人から冷たい態度を取られた。',
  '家族と意見が衝突してしまった。',
  '恋人と喧嘩をしてしまった。',
  '子どもが言うことを聞いてくれない。',
  'ご近所トラブルが発生した。',
  '他人に誤解されて批判された。',
  'SNSで嫌なコメントを受けた。',
  '長時間連絡が取れない友人に不安を感じる。',
  '感謝されるどころか責められた。',
  '体調を崩している状態が続いている。',
  'ダイエットが思うように進まない。',
  '怪我をして動きにくい状況にある。',
  '病院で長時間待たされた。',
  '睡眠不足で集中できない。',
  '好きな食べ物を我慢している。',
  '天候のせいで予定が狂った。',
  '大雨や台風で外出が難しい。',
  '季節の変わり目で花粉症がひどい。',
  '運動中に予期せぬトラブルが起きた。',
  '家事が山積みで手が回らない。',
  'ゴミの日を忘れてしまった。',
  'ペットが言うことを聞かない。',
  '通勤途中で電車が遅れた。',
  '財布を忘れてしまった。',
  '買ったばかりの服を汚してしまった。',
  '料理がうまくいかなかった。',
  '家電が突然壊れてしまった。',
  '待ち合わせで相手が遅刻した。',
  '停電や断水が起きて不便を感じた。',
  '公共の場でマナーが悪い人を見かけた。',
  '混雑した場所でストレスを感じた。',
  '役所の手続きが煩雑で疲れた。',
  '交通事故に遭遇した（軽微なものも含む）。',
  'レジで長蛇の列に並ばされた。',
  '飲食店で注文を間違えられた。',
  'チケットが売り切れで予定が台無しになった。',
  '値上げやサービス低下を感じた。',
  '近所で騒音がひどい。',
  '車が渋滞にはまり動けなくなった。',
  '勉強や試験で成果が出ない。',
  'チャレンジが失敗に終わった。',
  '計画通りに物事が進まない。',
  '自分の能力に限界を感じた。',
  '他人と比べて自己嫌悪に陥った。',
  '趣味が思うように進まない。',
  '期待していた結果が得られなかった。',
  '努力が認められないと感じる。',
  'イベントや大会で良い成績を残せなかった。',
  '忙しさに追われて自分の時間が取れない。',
];

const PRESENTATION_SECONDS = 120;
const WIN_SCORE = 10;



/** @type {Map<string, Room>} */
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

function createRoom(hostSocketId, hostName) {
  const code = makeRoomCode();
  const room = {
    code,
    hostId: hostSocketId,
    players: new Map(), // socketId -> { name, coins, finished, finishRank, connected }
    deck: shuffle(TOPICS.map((_, i) => i)),
    currentTopic: null,
    phase: 'lobby', // lobby | topic | presentation | voting | results | ended
    chatLog: [],
    votes: new Map(), // voterId -> targetId
    timerEndsAt: null,
    timerTimeout: null,
    finishCounter: 0,
  };
  room.players.set(hostSocketId, { name: hostName, coins: 0, finished: false, finishRank: null, connected: true });
  rooms.set(code, room);
  return room;
}

function activePlayers(room) {
  return [...room.players.entries()].filter(([, p]) => !p.finished && p.connected);
}

function publicState(room) {
  return {
    code: room.code,
    hostId: room.hostId,
    phase: room.phase,
    currentTopic: room.currentTopic,
    cardsRemaining: room.deck.length,
    chatLog: room.chatLog,
    timerEndsAt: room.timerEndsAt,
    votesCast: [...room.votes.keys()],
    lastRoundGains: room.lastRoundGains || null,
    lastRoundWinners: room.lastRoundWinners || null,
    players: [...room.players.entries()].map(([id, p]) => ({
      id,
      name: p.name,
      coins: p.coins,
      finished: p.finished,
      finishRank: p.finishRank,
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

function endPresentation(room) {
  if (room.phase !== 'presentation') return;
  clearTimer(room);
  room.phase = 'voting';
  room.votes = new Map();
  broadcastState(room);
}

function tallyVotesAndAdvance(room) {
  const gains = new Map();
  for (const [, targetId] of room.votes) {
    gains.set(targetId, (gains.get(targetId) || 0) + 1);
  }
  const newlyFinished = [];
  for (const [id, amount] of gains) {
    const player = room.players.get(id);
    if (!player || player.finished) continue;
    player.coins += amount;
    if (player.coins >= WIN_SCORE) {
      player.finished = true;
      room.finishCounter += 1;
      player.finishRank = room.finishCounter;
      newlyFinished.push({ id, name: player.name });
    }
  }
  room.phase = 'results';
  room.lastRoundGains = [...gains.entries()].map(([id, amount]) => ({
    id,
    name: room.players.get(id) ? room.players.get(id).name : '(退出済み)',
    amount,
  }));
  room.lastRoundWinners = newlyFinished;

  const remaining = activePlayers(room);
  if (remaining.length <= 1) {
    if (remaining.length === 1) {
      const [lastId, lastPlayer] = remaining[0];
      lastPlayer.finished = true;
      room.finishCounter += 1;
      lastPlayer.finishRank = room.finishCounter;
    }
    room.phase = 'ended';
  }
  broadcastState(room);
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
    room.players.set(socket.id, { name: cleanName, coins: 0, finished: false, finishRank: null, connected: true });
    socket.join(room.code);
    socket.data.roomCode = room.code;
    socket.emit('joined', { code: room.code, selfId: socket.id });
    broadcastState(room);
  });

  socket.on('startGame', () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.id || room.phase !== 'lobby') return;
    if (room.players.size < 2) {
      socket.emit('errorMsg', '2人以上集まってから開始してください。');
      return;
    }
    room.phase = 'topic';
    room.deck = shuffle(TOPICS.map((_, i) => i));
    drawNextCard(room);
    broadcastState(room);
  });

  function drawNextCard(room) {
    if (room.deck.length === 0) {
      room.deck = shuffle(TOPICS.map((_, i) => i));
    }
    const idx = room.deck.pop();
    room.currentTopic = TOPICS[idx];
    room.chatLog = [];
  }

  socket.on('startTimer', () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.id || room.phase !== 'topic') return;
    room.phase = 'presentation';
    room.chatLog = [];
    room.timerEndsAt = Date.now() + PRESENTATION_SECONDS * 1000;
    room.timerTimeout = setTimeout(() => endPresentation(room), PRESENTATION_SECONDS * 1000);
    broadcastState(room);
  });

  socket.on('endTimerEarly', () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.id || room.phase !== 'presentation') return;
    endPresentation(room);
  });

  socket.on('sendMessage', ({ text }) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.phase !== 'presentation') return;
    const player = room.players.get(socket.id);
    if (!player) return;
    const clean = (text || '').trim().slice(0, 300);
    if (!clean) return;
    room.chatLog.push({ name: player.name, id: socket.id, text: clean, time: Date.now() });
    broadcastState(room);
  });

  socket.on('castVote', ({ targetId }) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.phase !== 'voting') return;
    const voter = room.players.get(socket.id);
    if (!voter || voter.finished) return;
    if (targetId === socket.id) {
      socket.emit('errorMsg', '自分には投票できません。');
      return;
    }
    const target = room.players.get(targetId);
    if (!target || target.finished) return;
    room.votes.set(socket.id, targetId);
    broadcastState(room);
    checkVotingComplete(room);
  });

  socket.on('nextRound', () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.id || room.phase !== 'results') return;
    room.phase = 'topic';
    room.lastRoundGains = null;
    room.lastRoundWinners = null;
    drawNextCard(room);
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
    if (player) {
      player.connected = false;
    }
    if (room.hostId === socket.id) {
      const nextHost = [...room.players.entries()].find(([id, p]) => id !== socket.id && p.connected);
      if (nextHost) {
        room.hostId = nextHost[0];
      }
    }
    const anyoneLeft = [...room.players.values()].some((p) => p.connected);
    if (!anyoneLeft) {
      clearTimer(room);
      rooms.delete(room.code);
      return;
    }
    broadcastState(room);
    checkVotingComplete(room);
  });
}

function checkVotingComplete(room) {
  if (room.phase !== 'voting') return;
  const activeVoters = activePlayers(room).map(([id]) => id);
  const allVoted = activeVoters.length > 0 && activeVoters.every((id) => room.votes.has(id));
  if (allVoted) {
    tallyVotesAndAdvance(room);
  }
}

// 共通サーバーから呼ばれる登録関数
module.exports = function register({ nsp }) {
  io = nsp;
  io.on("connection", onConnection);
};
