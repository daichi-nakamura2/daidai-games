// このゲーム専用の Socket.io ネームスペースにつなぐ（他ゲームと通信が混ざらないように）
const socket = io("/games/kansha-nou");

let selfId = null;
let roomCode = null;
let state = null;
let timerInterval = null;
let myVoteTarget = null;

const el = (id) => document.getElementById(id);

function showError(id, msg) {
  el(id).textContent = msg;
  setTimeout(() => {
    if (el(id).textContent === msg) el(id).textContent = '';
  }, 4000);
}

// ---- 開始画面 ----
el('btn-create').addEventListener('click', () => {
  const name = el('create-name').value;
  socket.emit('createRoom', { name });
});

el('btn-join').addEventListener('click', () => {
  const code = el('join-code').value;
  const name = el('join-name').value;
  socket.emit('joinRoom', { code, name });
});

socket.on('joined', (data) => {
  selfId = data.selfId;
  roomCode = data.code;
});

socket.on('errorMsg', (msg) => {
  showError('start-error', msg);
  showError('global-error', msg);
});

// ---- ロビー操作 ----
el('btn-start-game').addEventListener('click', () => socket.emit('startGame'));

// ---- お題フェーズ ----
el('btn-start-timer').addEventListener('click', () => socket.emit('startTimer'));

// ---- 発表フェーズ ----
el('chat-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = el('chat-input');
  const text = input.value;
  if (!text.trim()) return;
  socket.emit('sendMessage', { text });
  input.value = '';
});

el('btn-end-timer').addEventListener('click', () => socket.emit('endTimerEarly'));

// ---- 結果フェーズ ----
el('btn-next-round').addEventListener('click', () => socket.emit('nextRound'));
el('btn-end-game').addEventListener('click', () => socket.emit('endGame'));

// ---- 状態受信 ----
socket.on('roomUpdate', (s) => {
  state = s;
  render();
});

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

  ['topic', 'presentation', 'voting', 'results', 'ended'].forEach((p) => {
    el(`phase-${p}`).classList.toggle('hidden', p !== state.phase);
  });

  if (state.phase !== 'voting') myVoteTarget = null;

  if (state.phase === 'topic') renderTopic(isHost);
  if (state.phase === 'presentation') renderPresentation();
  if (state.phase === 'voting') renderVoting();
  if (state.phase === 'results') renderResults(isHost);
  if (state.phase === 'ended') renderEnded();
}

function renderLobby(isHost) {
  el('lobby-code').textContent = state.code;
  const list = el('lobby-players');
  list.innerHTML = '';
  state.players.forEach((p) => {
    const li = document.createElement('li');
    if (p.id === selfId) li.classList.add('self');
    li.innerHTML = `<span>${escapeHtml(p.name)}${p.id === state.hostId ? ' 👑' : ''}</span>`;
    list.appendChild(li);
  });
  el('btn-start-game').classList.toggle('hidden', !isHost);
  el('lobby-wait').classList.toggle('hidden', isHost);
}

function renderTopic(isHost) {
  el('topic-text').textContent = state.currentTopic || '';
  el('btn-start-timer').classList.toggle('hidden', !isHost);
  el('topic-wait').classList.toggle('hidden', isHost);
}

function renderPresentation() {
  el('pres-topic').textContent = state.currentTopic || '';
  const log = el('chat-log');
  log.innerHTML = '';
  state.chatLog.forEach((m) => {
    const div = document.createElement('div');
    div.className = 'chat-msg';
    div.innerHTML = `<span class="name">${escapeHtml(m.name)}:</span>${escapeHtml(m.text)}`;
    log.appendChild(div);
  });
  log.scrollTop = log.scrollHeight;

  const isHost = state.hostId === selfId;
  el('btn-end-timer').classList.toggle('hidden', !isHost);

  clearInterval(timerInterval);
  const update = () => {
    const remaining = Math.max(0, Math.round((state.timerEndsAt - Date.now()) / 1000));
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    el('timer-display').textContent = `${m}:${String(s).padStart(2, '0')}`;
  };
  update();
  timerInterval = setInterval(update, 250);
}

function renderVoting() {
  const list = el('vote-list');
  list.innerHTML = '';
  state.players
    .filter((p) => !p.finished && p.connected)
    .forEach((p) => {
      const li = document.createElement('li');
      li.textContent = p.name + (p.id === selfId ? '（自分）' : '');
      if (p.id === selfId) {
        li.style.opacity = 0.5;
        li.style.cursor = 'default';
      } else {
        if (p.id === myVoteTarget) li.classList.add('voted-for');
        li.addEventListener('click', () => {
          myVoteTarget = p.id;
          socket.emit('castVote', { targetId: p.id });
        });
      }
      list.appendChild(li);
    });
  const activeCount = state.players.filter((p) => !p.finished && p.connected).length;
  el('vote-progress').textContent = `投票済み: ${state.votesCast.length} / ${activeCount} 人`;
}

function renderResults(isHost) {
  const list = el('result-gains');
  list.innerHTML = '';
  (state.lastRoundGains || []).forEach((g) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${escapeHtml(g.name)}</span><span class="coin-badge">+${g.amount}</span>`;
    list.appendChild(li);
  });
  const winnersDiv = el('result-winners');
  const winners = state.lastRoundWinners || [];
  winnersDiv.textContent = winners.length
    ? `🎉 勝ち抜け: ${winners.map((w) => w.name).join('、')}`
    : '';

  el('btn-next-round').classList.toggle('hidden', !isHost);
  el('btn-end-game').classList.toggle('hidden', !isHost);
  el('results-wait').classList.toggle('hidden', isHost);
}

function renderEnded() {
  const ol = el('final-ranking');
  ol.innerHTML = '';
  const ranked = state.players.slice().sort((a, b) => {
    if (a.finishRank == null) return 1;
    if (b.finishRank == null) return -1;
    return a.finishRank - b.finishRank;
  });
  ranked.forEach((p) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${escapeHtml(p.name)}</span><span class="coin-badge">${p.coins} コイン</span>`;
    ol.appendChild(li);
  });
}

function renderScoreboard() {
  const list = el('scoreboard');
  list.innerHTML = '';
  state.players.forEach((p) => {
    const li = document.createElement('li');
    if (p.id === selfId) li.classList.add('self');
    if (p.finished) li.classList.add('finished');
    if (!p.connected) li.classList.add('disconnected');
    li.innerHTML = `<span>${escapeHtml(p.name)}${p.id === state.hostId ? ' 👑' : ''}${p.finished ? ' 🏁' : ''}</span><span class="coin-badge">${p.coins}</span>`;
    list.appendChild(li);
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
