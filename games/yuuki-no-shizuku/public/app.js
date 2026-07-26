// このゲーム専用の Socket.io ネームスペースにつなぐ（他ゲームと通信が混ざらないように）
const socket = io("/games/yuuki-no-shizuku");

let selfId = null;
let state = null;
let timerInterval = null;
let myJudgeValue = null;
let lastVesselCoins = 0;
let passNoticeTimer = null;

const el = (id) => document.getElementById(id);

function showError(id, msg) {
  el(id).textContent = msg;
  setTimeout(() => {
    if (el(id).textContent === msg) el(id).textContent = '';
  }, 4000);
}

// ---- 開始画面 ----
el('btn-create').addEventListener('click', () => {
  socket.emit('createRoom', { name: el('create-name').value });
});

el('btn-join').addEventListener('click', () => {
  socket.emit('joinRoom', { code: el('join-code').value, name: el('join-name').value });
});

socket.on('joined', (data) => {
  selfId = data.selfId;
});

socket.on('errorMsg', (msg) => {
  showError('start-error', msg);
  showError('global-error', msg);
});

// ---- 操作ボタン ----
el('btn-start-game').addEventListener('click', () => socket.emit('startGame'));
el('btn-start-speaking').addEventListener('click', () => socket.emit('startSpeaking'));
el('btn-pass').addEventListener('click', () => socket.emit('passTopic'));
el('btn-end-speaking').addEventListener('click', () => socket.emit('endSpeaking'));
el('btn-next-turn').addEventListener('click', () => socket.emit('nextTurn'));
el('btn-end-game').addEventListener('click', () => socket.emit('endGame'));
el('btn-back-lobby').addEventListener('click', () => socket.emit('backToLobby'));

document.querySelectorAll('.judge-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    myJudgeValue = Number(btn.dataset.value);
    socket.emit('judge', { value: myJudgeValue });
    render();
  });
});

// ---- 状態受信 ----
socket.on('roomUpdate', (s) => {
  state = s;
  render();
});

// ---- パス通知 ----
socket.on('passNotice', (data) => {
  const box = el('pass-notice');
  const name = data.name ? `${escapeHtml(data.name)} さん` : '手番の人';
  box.innerHTML = `${name}がお題をパスしました。次の人へ 🍀`;
  box.classList.remove('hidden');
  clearTimeout(passNoticeTimer);
  passNoticeTimer = setTimeout(() => box.classList.add('hidden'), 4500);
});

function playerById(id) {
  return state.players.find((p) => p.id === id) || null;
}

function render() {
  if (!state) return;
  const isHost = state.hostId === selfId;

  const showScreen = (name) => {
    ['start', 'lobby', 'game'].forEach((n) => {
      el(`screen-${n}`).classList.toggle('hidden', n !== name);
    });
  };

  if (state.phase === 'lobby') {
    showScreen('lobby');
    renderLobby(isHost);
    return;
  }

  showScreen('game');
  el('game-code-label').textContent = state.code;
  renderScoreboard();
  renderVessel();

  ['topic', 'speaking', 'judging', 'result', 'ended'].forEach((p) => {
    el(`phase-${p}`).classList.toggle('hidden', p !== state.phase);
  });

  if (state.phase !== 'judging') myJudgeValue = null;
  if (state.phase !== 'speaking') clearInterval(timerInterval);

  if (state.phase === 'topic') renderTopic(isHost);
  if (state.phase === 'speaking') renderSpeaking(isHost);
  if (state.phase === 'judging') renderJudging();
  if (state.phase === 'result') renderResult(isHost);
  if (state.phase === 'ended') renderEnded(isHost);
}

function renderLobby(isHost) {
  el('lobby-code').textContent = state.code;
  const list = el('lobby-players');
  list.innerHTML = '';
  state.players.forEach((p) => {
    const li = document.createElement('li');
    if (p.id === selfId) li.classList.add('self');
    if (!p.connected) li.classList.add('disconnected');
    li.innerHTML = `<span>${escapeHtml(p.name)}${p.id === state.hostId ? ' 👑' : ''}</span>`;
    list.appendChild(li);
  });
  el('btn-start-game').classList.toggle('hidden', !isHost);
  el('lobby-wait').classList.toggle('hidden', isHost);
}

function renderTopic(isHost) {
  const speaker = playerById(state.speakerId);
  const isSpeaker = state.speakerId === selfId;
  el('topic-text').textContent = state.currentTopic || '';
  el('topic-speaker').textContent = speaker ? speaker.name : '';
  el('btn-start-speaking').classList.toggle('hidden', !(isSpeaker || isHost));
  el('btn-pass').classList.toggle('hidden', !(isSpeaker || isHost));
  document.querySelector('.pass-hint').classList.toggle('hidden', !(isSpeaker || isHost));
  el('topic-wait').classList.toggle('hidden', isSpeaker || isHost);
}

function renderSpeaking(isHost) {
  const speaker = playerById(state.speakerId);
  const isSpeaker = state.speakerId === selfId;
  el('speaking-topic').textContent = state.currentTopic || '';
  el('speaking-speaker').textContent = speaker ? speaker.name : '';
  el('btn-end-speaking').classList.toggle('hidden', !(isSpeaker || isHost));

  clearInterval(timerInterval);
  const update = () => {
    const remaining = Math.max(0, Math.round((state.timerEndsAt - Date.now()) / 1000));
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    const disp = el('timer-display');
    disp.textContent = `${m}:${String(s).padStart(2, '0')}`;
    disp.classList.toggle('warning', remaining <= 10);
  };
  update();
  timerInterval = setInterval(update, 250);
}

function renderJudging() {
  const speaker = playerById(state.speakerId);
  const isSpeaker = state.speakerId === selfId;
  el('judging-speaker').textContent = speaker ? speaker.name : '';
  el('judge-buttons').classList.toggle('hidden', isSpeaker);
  el('judging-self').classList.toggle('hidden', !isSpeaker);
  document.querySelectorAll('.judge-btn').forEach((btn) => {
    btn.classList.toggle('selected', Number(btn.dataset.value) === myJudgeValue);
  });
  el('judge-progress').textContent = `判定済み: ${state.judgedIds.length} / ${state.judgesTotal} 人`;
}

function renderResult(isHost) {
  const r = state.lastResult;
  if (!r) return;
  el('result-speaker').textContent = r.speakerName;
  el('result-gained').textContent = `+${r.gained}`;
  const list = el('result-breakdown');
  list.innerHTML = '';
  [3, 2, 1].forEach((v) => {
    if (!r.counts[v]) return;
    const li = document.createElement('li');
    li.innerHTML = `${escapeHtml(r.labels[v])} × ${r.counts[v]}<span class="coin-badge">+${v * r.counts[v]}</span>`;
    list.appendChild(li);
  });
  el('btn-next-turn').classList.toggle('hidden', !isHost);
  el('btn-end-game').classList.toggle('hidden', !isHost);
  el('result-wait').classList.toggle('hidden', isHost);
}

function renderEnded(isHost) {
  const winner = state.winnerId ? playerById(state.winnerId) : null;
  el('ended-winner').innerHTML = winner
    ? `🌊 心の器があふれました！<br>🏆 勝者: ${escapeHtml(winner.name)} さん 🏆`
    : 'ゲーム終了';
  const ol = el('final-ranking');
  ol.innerHTML = '';
  state.players
    .slice()
    .sort((a, b) => b.coins - a.coins)
    .forEach((p) => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="name">${escapeHtml(p.name)}</span><span class="coin-badge">${p.coins} 枚</span>`;
      ol.appendChild(li);
    });
  el('btn-back-lobby').classList.toggle('hidden', !isHost);
}

function renderScoreboard() {
  const list = el('scoreboard');
  list.innerHTML = '';
  state.players.forEach((p) => {
    const li = document.createElement('li');
    if (p.id === selfId) li.classList.add('self');
    if (!p.connected) li.classList.add('disconnected');
    if (p.id === state.speakerId && state.phase !== 'ended') li.classList.add('speaker');
    const speakingMark = p.id === state.speakerId && state.phase !== 'ended' ? ' 🎤' : '';
    li.innerHTML = `<span>${escapeHtml(p.name)}${p.id === state.hostId ? ' 👑' : ''}${speakingMark}</span><span class="coin-badge">${p.coins}</span>`;
    list.appendChild(li);
  });
}

function renderVessel() {
  const capacity = state.vesselCapacity || 1;
  const coins = state.vesselCoins;
  // 空でも少し水が入って見えるように 12%〜98% の範囲で表示
  const ratio = Math.min(1, coins / capacity);
  const overflowed = state.lastResult && state.lastResult.overflowed && state.phase === 'ended';
  const height = overflowed ? 100 : 12 + ratio * 86;
  el('vessel-water').style.height = `${height}%`;
  el('vessel-coins').textContent = coins;
  el('vessel-capacity').textContent = capacity;
  el('overflow-drops').classList.toggle('hidden', !overflowed);
  document.querySelector('.vessel').classList.toggle('overflowing', !!overflowed);

  if (coins > lastVesselCoins) {
    dropCoins(Math.min(coins - lastVesselCoins, 8));
  }
  lastVesselCoins = coins;
}

function dropCoins(count) {
  const layer = el('coin-layer');
  for (let i = 0; i < count; i++) {
    const coin = document.createElement('span');
    coin.className = 'falling-coin';
    coin.textContent = '🪙';
    coin.style.left = `${15 + Math.random() * 65}%`;
    coin.style.animationDelay = `${i * 0.15}s`;
    layer.appendChild(coin);
    setTimeout(() => coin.remove(), 1500 + i * 150);
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
