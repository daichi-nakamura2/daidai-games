// このゲーム専用の Socket.io ネームスペースにつなぐ（他ゲームと通信が混ざらないように）
const socket = io("/games/9masu-writing");

let selfId = null;
let state = null;
let myVote = null;          // [5]
let composedFor = null;     // どのテンプレートで下書きを作ったか
const cellDebounce = {};    // index -> timeout

const el = (id) => document.getElementById(id);

function showError(id, msg) {
  el(id).textContent = msg;
  setTimeout(() => {
    if (el(id).textContent === msg) el(id).textContent = '';
  }, 4000);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function playerById(id) {
  return state ? state.players.find((p) => p.id === id) || null : null;
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
el('btn-start-writing').addEventListener('click', () => {
  const theme = el('theme-input').value.trim();
  // テーマ空欄（おまかせ）ならサーバがテーマとおすすめセットを選ぶ
  socket.emit('startWriting', { theme, questionSet: theme ? el('set-select').value : null });
});
// テーマを選ぶと、テーマ名の欄とおすすめ質問セットが自動で切り替わる
el('theme-select').addEventListener('change', () => {
  const opt = el('theme-select').selectedOptions[0];
  if (!opt || opt.value === '__custom__') {
    el('theme-input').value = '';
    el('theme-input').focus();
    return;
  }
  if (opt.value === '__random__') {
    el('theme-input').value = '';
    return;
  }
  el('theme-input').value = opt.dataset.text || '';
  if (opt.dataset.set) el('set-select').value = opt.dataset.set;
  renderSetPreview();
});
el('set-select').addEventListener('change', renderSetPreview);
el('btn-end-writing').addEventListener('click', () => {
  if (confirm('記入を締め切って、みんなの発表に進みますか？')) socket.emit('endWriting');
});
el('btn-compose').addEventListener('click', composeDraft);
el('btn-submit-final').addEventListener('click', () => {
  socket.emit('submitFinal', { text: el('final-text').value });
});
el('final-text').addEventListener('input', () => {
  socket.emit('setFinalText', { text: el('final-text').value });
});
el('btn-vote').addEventListener('click', () => {
  socket.emit('castVote', { breakdown: myVote });
});
el('btn-next-presenter').addEventListener('click', () => socket.emit('nextPresenter'));
el('btn-back-lobby').addEventListener('click', () => socket.emit('backToLobby'));

// ---- 状態受信 ----
socket.on('roomUpdate', (s) => {
  const prevPhase = state ? state.phase : null;
  const prevPresenter = state && state.presenter ? state.presenter.id : null;
  state = s;
  // 発表者が変わったら投票をリセット
  const nowPresenter = s.presenter ? s.presenter.id : null;
  if (nowPresenter !== prevPresenter) {
    myVote = null;
  }
  // 新しいラウンド（ロビーに戻った）ら記入UIを作り直す
  if (prevPhase !== 'lobby' && s.phase === 'lobby') {
    gridBuilt = false;
    templatesBuilt = false;
    composedFor = null;
    el('final-text').value = '';
  }
  render();
});

// ---------- 描画 ----------
function render() {
  if (!state) return;
  const isHost = state.hostId === selfId;

  const screens = ['start', 'lobby', 'writing', 'presenting', 'ranking'];
  const map = { lobby: 'lobby', writing: 'writing', presenting: 'presenting', ranking: 'ranking' };
  const target = map[state.phase] || 'start';
  screens.forEach((n) => el(`screen-${n}`).classList.toggle('hidden', n !== target));

  if (state.phase === 'lobby') return renderLobby(isHost);
  if (state.phase === 'writing') return renderWriting(isHost);
  if (state.phase === 'presenting') return renderPresenting(isHost);
  if (state.phase === 'ranking') return renderRanking(isHost);
}

function renderLobby(isHost) {
  el('lobby-code').textContent = state.code;
  const list = el('lobby-players');
  list.innerHTML = '';
  state.players.forEach((p) => {
    const li = document.createElement('li');
    if (p.id === selfId) li.classList.add('self');
    if (!p.connected) li.classList.add('disconnected');
    li.innerHTML = `<span>${escapeHtml(p.name)}${p.id === state.hostId ? ' 🧭' : ''}</span>`;
    list.appendChild(li);
  });
  el('lobby-host').classList.toggle('hidden', !isHost);
  el('lobby-wait').classList.toggle('hidden', isHost);
  if (isHost) buildLobbySelectorsOnce();
}

// テーマ・質問セットのプルダウンを一度だけ組み立てる
let lobbySelectorsBuilt = false;
function buildLobbySelectorsOnce() {
  if (lobbySelectorsBuilt || !state.themes || !state.questionSets) return;
  const themeSel = el('theme-select');
  themeSel.innerHTML = '';
  // 「おまかせ（ランダム）」と「自由に入力」を先頭に
  const random = document.createElement('option');
  random.value = '__random__';
  random.textContent = '🎲 おまかせ（ランダムに選ぶ）';
  themeSel.appendChild(random);
  const custom = document.createElement('option');
  custom.value = '__custom__';
  custom.textContent = '✏️ 自由に入力';
  themeSel.appendChild(custom);
  // テーマは質問セット別にグループ表示（100個でも探しやすいように）
  const groups = {};
  Object.entries(state.questionSets).forEach(([key, s]) => {
    const og = document.createElement('optgroup');
    og.label = s.name;
    groups[key] = og;
    themeSel.appendChild(og);
  });
  state.themes.forEach((t) => {
    const o = document.createElement('option');
    o.value = t.text;
    o.dataset.text = t.text;
    o.dataset.set = t.set;
    o.textContent = t.text;
    (groups[t.set] || themeSel).appendChild(o);
  });

  const setSel = el('set-select');
  setSel.innerHTML = '';
  Object.entries(state.questionSets).forEach(([key, s]) => {
    const o = document.createElement('option');
    o.value = key;
    o.textContent = s.name;
    setSel.appendChild(o);
  });

  // 初期表示は「おまかせ（ランダム）」＝テーマ欄は空のまま
  lobbySelectorsBuilt = true;
  renderSetPreview();
}

// 選択中の質問セットの説明と9問プレビューを表示
function renderSetPreview() {
  if (!state || !state.questionSets) return;
  const key = el('set-select').value;
  const set = state.questionSets[key];
  if (!set) return;
  el('set-desc').textContent = set.desc || '';
  const ol = el('set-preview-list');
  ol.innerHTML = '';
  set.questions.forEach((q) => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="prev-cat">${escapeHtml(q.cat)}</span>${escapeHtml(q.text)}`;
    ol.appendChild(li);
  });
}

// ---- 記入画面 ----
let gridBuilt = false;
function renderWriting(isHost) {
  el('writing-theme').textContent = state.theme;

  buildGridOnce();
  // 進捗
  el('grid-filled').textContent = state.players.find((p) => p.id === selfId)?.filled ?? 0;

  buildTemplatesOnce();
  const me = playerById(selfId);
  document.querySelectorAll('.template-choice').forEach((b) => {
    b.classList.toggle('selected', me && me.template === b.dataset.key);
  });
  el('btn-compose').disabled = !(me && me.template);

  el('writing-done').classList.toggle('hidden', !(me && me.submitted));

  // ファシリテーターパネル
  el('facilitator-panel').classList.toggle('hidden', !isHost);
  if (isHost) renderFacilitator();
}

function buildGridOnce() {
  if (gridBuilt) return;
  const grid = el('grid');
  grid.innerHTML = '';
  state.questions.forEach((q, i) => {
    const cell = document.createElement('div');
    cell.className = 'grid-cell';
    cell.innerHTML = `
      <div class="cell-cat">${escapeHtml(q.cat)}</div>
      <label class="cell-q">${i + 1}. ${escapeHtml(q.text)}</label>
      <textarea class="cell-input" data-index="${i}" maxlength="300" placeholder="答えを書く…"></textarea>`;
    grid.appendChild(cell);
  });
  grid.querySelectorAll('.cell-input').forEach((ta) => {
    ta.addEventListener('input', () => {
      const i = Number(ta.dataset.index);
      clearTimeout(cellDebounce[i]);
      cellDebounce[i] = setTimeout(() => {
        socket.emit('updateCell', { index: i, text: ta.value });
      }, 500);
    });
    ta.addEventListener('blur', () => {
      const i = Number(ta.dataset.index);
      clearTimeout(cellDebounce[i]);
      socket.emit('updateCell', { index: i, text: ta.value });
    });
  });
  gridBuilt = true;
}

let templatesBuilt = false;
function buildTemplatesOnce() {
  if (templatesBuilt) return;
  const box = el('template-choices');
  box.innerHTML = '';
  Object.entries(state.templates).forEach(([key, t]) => {
    const b = document.createElement('button');
    b.className = 'template-choice';
    b.dataset.key = key;
    b.innerHTML = `<strong>${escapeHtml(t.name)}</strong><span>${escapeHtml(t.hint)}</span>`;
    b.addEventListener('click', () => socket.emit('setTemplate', { template: key }));
    box.appendChild(b);
  });
  templatesBuilt = true;
}

// 選んだテンプレートの並び順（サーバから受け取る）で、自分の回答をつないで下書きを作る
function composeDraft() {
  const me = playerById(selfId);
  if (!me || !me.template) return;
  const cells = readMyCells();
  const order = (state.templates[me.template] && state.templates[me.template].order) || [];
  const parts = [];
  order.forEach((idx) => {
    const val = (cells[idx] || '').trim();
    if (!val) return;
    if (me.template === 'list') {
      parts.push(`・${val}`);
    } else {
      // 同じマスを2回使う結論優先型では2回目は「まとめ」として使う
      parts.push(val);
    }
  });
  const joiner = me.template === 'list' ? '\n' : '\n\n';
  const existing = el('final-text').value.trim();
  const draft = parts.join(joiner);
  if (existing && !confirm('いまの文章を下書きで上書きします。よろしいですか？')) return;
  el('final-text').value = draft;
  socket.emit('setFinalText', { text: draft });
  composedFor = me.template;
}

function readMyCells() {
  const cells = [];
  document.querySelectorAll('#grid .cell-input').forEach((ta) => {
    cells[Number(ta.dataset.index)] = ta.value;
  });
  return cells;
}

function renderFacilitator() {
  el('fac-count').textContent = state.players.filter((p) => p.connected).length;
  const list = el('fac-list');
  list.innerHTML = '';
  state.players.forEach((p) => {
    const total = p.questionCount || 9;
    const bars = Array.from({ length: total }, (_, i) => (i < p.filled ? '■' : '□')).join('');
    const pct = Math.round((p.filled / total) * 100);
    const li = document.createElement('li');
    if (!p.connected) li.classList.add('disconnected');
    const tmpl = p.hasTemplate ? '型✓' : '型…';
    const done = p.submitted ? '<span class="done-mark">完成✅</span>' : '';
    li.innerHTML = `
      <span class="fac-name">${escapeHtml(p.name)}${p.id === state.hostId ? ' 🧭' : ''}</span>
      <span class="fac-bar">${bars}</span>
      <span class="fac-pct">${pct}%</span>
      <span class="fac-tmpl">${tmpl}</span>${done}`;
    list.appendChild(li);
  });
}

// ---- 発表画面 ----
function renderPresenting(isHost) {
  el('present-theme').textContent = state.theme;
  el('present-counter').textContent = `${state.presentIndex + 1} / ${state.presentTotal}`;
  const pr = state.presenter;
  if (!pr) return;
  const isPresenter = pr.id === selfId;
  el('present-name').textContent = `${pr.name} さん`;
  el('present-self').classList.toggle('hidden', !isPresenter);
  el('present-text').textContent = pr.finalText || '（文章が入力されていません）';

  const cellList = el('present-cell-list');
  cellList.innerHTML = '';
  state.questions.forEach((q, i) => {
    const val = (pr.cells[i] || '').trim();
    if (!val) return;
    const li = document.createElement('li');
    li.innerHTML = `<span class="cell-q-small">${i + 1}. ${escapeHtml(q.text)}</span><span>${escapeHtml(val)}</span>`;
    cellList.appendChild(li);
  });

  // 投票エリア（発表者以外）
  const alreadyVoted = playerById(selfId)?.voted;
  el('vote-area').classList.toggle('hidden', isPresenter);
  if (!isPresenter) buildVoteRows(alreadyVoted);
  el('vote-done').classList.toggle('hidden', !alreadyVoted);

  if (state.voteProgress) {
    el('vote-progress').textContent = `投票 ${state.voteProgress.done} / ${state.voteProgress.total} 人`;
  }
  el('btn-next-presenter').classList.toggle('hidden', !isHost);
}

function buildVoteRows(disabled) {
  const box = el('vote-rows');
  if (myVote === null) myVote = state.voteCategories.map(() => 0);
  box.innerHTML = '';
  state.voteCategories.forEach((cat, i) => {
    const row = document.createElement('div');
    row.className = 'vote-row';
    row.innerHTML = `<span class="vote-cat">${escapeHtml(cat)}</span>`;
    const btns = document.createElement('div');
    btns.className = 'vote-btns';
    [0, 1, 2].forEach((v) => {
      const b = document.createElement('button');
      b.className = 'vote-pt';
      b.textContent = v;
      if (myVote[i] === v) b.classList.add('selected');
      b.disabled = disabled;
      b.addEventListener('click', () => {
        myVote[i] = v;
        buildVoteRows(disabled);
      });
      btns.appendChild(b);
    });
    row.appendChild(btns);
    box.appendChild(row);
  });
  el('vote-total').textContent = myVote.reduce((a, b) => a + b, 0);
  el('btn-vote').disabled = disabled;
}

// ---- ランキング画面 ----
function renderRanking(isHost) {
  const sorted = state.players.slice().sort((a, b) => b.totalScore - a.totalScore);
  const winner = sorted[0];
  el('ranking-winner').innerHTML = winner
    ? `🏆 優勝：<strong>${escapeHtml(winner.name)}</strong> さん<br><span class="win-title">${escapeHtml(winner.title)}</span> ／ ${winner.totalScore}点`
    : 'ゲーム終了';

  const ol = el('ranking-list');
  ol.innerHTML = '';
  sorted.forEach((p) => {
    const li = document.createElement('li');
    if (p.id === selfId) li.classList.add('self');
    li.innerHTML = `
      <div class="rank-main">
        <span class="name">${escapeHtml(p.name)}</span>
        <span class="rank-title">${escapeHtml(p.title)}</span>
      </div>
      <div class="rank-scores">
        <span class="score-total">${p.totalScore}点</span>
        <span class="score-sub">基本 ${p.baseScore} ＋ 投票 ${p.bonusScore}</span>
      </div>`;
    ol.appendChild(li);
  });

  el('btn-back-lobby').classList.toggle('hidden', !isHost);
  el('ranking-wait').classList.toggle('hidden', isHost);
}
