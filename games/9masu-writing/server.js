// ============================================================
// 9マス式ライティングゲーム — サーバーロジック
//   だいだいゲームズの共通サーバー(../../server.js)から読み込まれる。
//   通信は Socket.io のネームスペース `/games/9masu-writing` 上で行うので、
//   このゲームの通信が他のゲームに混ざることはない。
//   画面ファイルは ./public/ 以下に置く。
// ============================================================

// 共通サーバーから渡されるネームスペース。
// 以降のコードでは今までどおり `io` として使える。
let io = null;

// ---- ゲーム定数 ----

// 1テーマあたりのマス数（全質問セット共通で9マス）
const CELL_COUNT = 9;

// 質問セット（AIは文章を書かず、テーマに適した質問を提供するだけ）。
// テーマの種類に合わせて選ぶ。各セットは9問で、
// index7 = 数字で表すと？ / index8 = 伝えたいこと に統一してある
// （文章テンプレートの並べ替え順と噛み合うようにするため）。
const QUESTION_SETS = {
  experience: {
    name: '体験・できごと型',
    desc: '失敗・挑戦・冒険・思い出など「あった出来事」を書くとき',
    questions: [
      { cat: '読者目線', text: '何についての体験ですか？（ひとことで）' },
      { cat: 'エピソード', text: 'いつ・どこで起きたことですか？' },
      { cat: 'エピソード', text: '具体的に何がありましたか？' },
      { cat: '感情', text: 'そのとき、どんな気持ちでしたか？' },
      { cat: 'エピソード', text: '一番大変だった・印象的だった場面は？' },
      { cat: 'エピソード', text: '結果、どうなりましたか？' },
      { cat: '感情', text: 'その経験から気づいたこと・学んだことは？' },
      { cat: '読者目線', text: '数字で表すと？（回数・年数など）' },
      { cat: '読者目線', text: '読む人に、何を伝えたいですか？' },
    ],
  },
  person: {
    name: '人・感謝型',
    desc: '感謝している人・忘れられない出会い・言われた言葉など',
    questions: [
      { cat: '読者目線', text: '誰について書きますか？（どんな人）' },
      { cat: 'エピソード', text: 'その人と、いつ・どこで出会いましたか？' },
      { cat: 'エピソード', text: '心に残っているエピソードは？' },
      { cat: 'エピソード', text: 'その人が言ってくれた言葉・してくれたことは？' },
      { cat: '感情', text: 'そのとき、どんな気持ちになりましたか？' },
      { cat: '感情', text: 'その人のおかげで、自分はどう変わりましたか？' },
      { cat: '読者目線', text: 'その人を、色や物にたとえると？' },
      { cat: '読者目線', text: '数字で表すと？（一緒にいた年数・回数など）' },
      { cat: '読者目線', text: 'その人に、いま何を伝えたいですか？' },
    ],
  },
  passion: {
    name: '好き・こだわり型',
    desc: '仕事のこだわり・ハマっていること・譲れないもの・続けている習慣',
    questions: [
      { cat: '読者目線', text: '何が好き・こだわっていますか？（ひとことで）' },
      { cat: 'エピソード', text: 'それを好きになった・始めたきっかけは？' },
      { cat: 'エピソード', text: 'どんなふうに楽しんで・こだわっていますか？（具体的に）' },
      { cat: '感情', text: 'それをしているとき、どんな気持ちですか？' },
      { cat: 'エピソード', text: '人にはわからないかもしれない魅力・こだわりは？' },
      { cat: 'エピソード', text: 'これまでで一番の名場面・エピソードは？' },
      { cat: '感情', text: 'それがある生活と、ない生活は何が違いますか？' },
      { cat: '読者目線', text: '数字で表すと？（年数・費やした時間・回数など）' },
      { cat: '読者目線', text: 'まだ知らない人に、どんな魅力を伝えたいですか？' },
    ],
  },
  place: {
    name: '場所・ふるさと型',
    desc: 'ふるさと自慢・好きな場所・思い出の場所など',
    questions: [
      { cat: '読者目線', text: 'どこの・どんな場所ですか？' },
      { cat: 'エピソード', text: 'その場所で、いつ・どんな時間を過ごしますか？' },
      { cat: 'エピソード', text: 'そこでの忘れられない思い出は？' },
      { cat: '感情', text: 'その場所にいると、どんな気持ちになりますか？' },
      { cat: '読者目線', text: '五感で表すと？（見える・聞こえる・匂い・味）' },
      { cat: 'エピソード', text: 'その場所ならではの、おすすめ・名物は？' },
      { cat: '感情', text: 'あなたにとって、その場所はどんな存在ですか？' },
      { cat: '読者目線', text: '数字で表すと？（通った年数・距離など）' },
      { cat: '読者目線', text: '誰を連れて行きたい？ 何を伝えたい？' },
    ],
  },
  growth: {
    name: '変化・成長型',
    desc: '昔と今・続けて変わったこと・自分が成長した話など',
    questions: [
      { cat: '読者目線', text: '何についての「変化」の話ですか？' },
      { cat: 'エピソード', text: '昔（ビフォー）はどうでしたか？' },
      { cat: 'エピソード', text: '変わるきっかけになった出来事は？' },
      { cat: '感情', text: 'そのとき、どんな気持ちでしたか？' },
      { cat: 'エピソード', text: 'どんな行動・努力を続けましたか？' },
      { cat: 'エピソード', text: '今（アフター）はどうなりましたか？' },
      { cat: '感情', text: '変わってみて、いま何を感じていますか？' },
      { cat: '読者目線', text: '数字で表すと？（かかった期間・続けた回数など）' },
      { cat: '読者目線', text: '昔の自分や、同じ悩みの人に何を伝えたいですか？' },
    ],
  },
};

const DEFAULT_SET = 'experience';

// テーマ一覧（ファシリテーターが空欄で開始するとランダムに1つ選ばれる）。
// set = そのテーマにおすすめの質問セット。プリセット選択時に自動で切り替わる。
// 各セット20個 × 5セット = 100テーマ。
const THEMES = [
  // ---- 好き・こだわり型（passion）----
  { text: '私の仕事のこだわり', set: 'passion' },
  { text: '最近ハマっていること', set: 'passion' },
  { text: 'これだけは譲れないもの', set: 'passion' },
  { text: '続けている習慣', set: 'passion' },
  { text: '私の朝のルーティン', set: 'passion' },
  { text: '休日の過ごし方', set: 'passion' },
  { text: '大好きな食べもの', set: 'passion' },
  { text: '私の推し', set: 'passion' },
  { text: '集めているもの・コレクション', set: 'passion' },
  { text: '愛用している道具', set: 'passion' },
  { text: '私のストレス解消法', set: 'passion' },
  { text: '大切にしている座右の銘', set: 'passion' },
  { text: '私の健康法', set: 'passion' },
  { text: 'こだわりの一杯', set: 'passion' },
  { text: '好きな本・マンガ', set: 'passion' },
  { text: '好きな音楽・歌', set: 'passion' },
  { text: '好きな映画・ドラマ', set: 'passion' },
  { text: '私の節約術', set: 'passion' },
  { text: '料理のこだわり', set: 'passion' },
  { text: '私のカバンの中身', set: 'passion' },
  // ---- 人・感謝型（person）----
  { text: '感謝している人', set: 'person' },
  { text: '人生を変えた出会い', set: 'person' },
  { text: '一番うれしかった言葉', set: 'person' },
  { text: '私の恩師', set: 'person' },
  { text: '家族に伝えたいこと', set: 'person' },
  { text: '親友の話', set: 'person' },
  { text: '尊敬している人', set: 'person' },
  { text: '忘れられない先生', set: 'person' },
  { text: '職場で助けられた人', set: 'person' },
  { text: '私のヒーロー', set: 'person' },
  { text: '大切な人との思い出', set: 'person' },
  { text: '初めてできた友だち', set: 'person' },
  { text: 'ライバルだったあの人', set: 'person' },
  { text: '憧れの人', set: 'person' },
  { text: '母・父の思い出', set: 'person' },
  { text: 'おじいちゃん・おばあちゃんの話', set: 'person' },
  { text: '私を叱ってくれた人', set: 'person' },
  { text: '名前も知らないあの人への感謝', set: 'person' },
  { text: '子どもに教えられたこと', set: 'person' },
  { text: 'チームの仲間の話', set: 'person' },
  // ---- 場所・ふるさと型（place）----
  { text: '私のふるさと自慢', set: 'place' },
  { text: '私の好きな場所', set: 'place' },
  { text: '思い出の場所', set: 'place' },
  { text: '行ってよかった旅行先', set: 'place' },
  { text: 'もう一度行きたい場所', set: 'place' },
  { text: '通った学校の思い出', set: 'place' },
  { text: '私の街のおすすめスポット', set: 'place' },
  { text: '落ち着くカフェ・お店', set: 'place' },
  { text: '初めての一人旅', set: 'place' },
  { text: '心に残る絶景', set: 'place' },
  { text: '我が家のお気に入りの場所', set: 'place' },
  { text: '通勤・通学の道の風景', set: 'place' },
  { text: '子どもの頃の遊び場', set: 'place' },
  { text: '忘れられないお祭り・イベント', set: 'place' },
  { text: '海の思い出・山の思い出', set: 'place' },
  { text: '住んでみたい場所', set: 'place' },
  { text: '私の秘密基地', set: 'place' },
  { text: '地元の自慢の味', set: 'place' },
  { text: '旅先でのハプニング', set: 'place' },
  { text: '帰りたくなる場所', set: 'place' },
  // ---- 体験・できごと型（experience）----
  { text: '忘れられない失敗', set: 'experience' },
  { text: '挑戦してよかったこと', set: 'experience' },
  { text: '子どもの頃の思い出', set: 'experience' },
  { text: '人生で一番緊張した日', set: 'experience' },
  { text: '一番笑った出来事', set: 'experience' },
  { text: '初めてのアルバイト', set: 'experience' },
  { text: '学生時代の部活の話', set: 'experience' },
  { text: '人生最大のピンチ', set: 'experience' },
  { text: '泣くほど感動したこと', set: 'experience' },
  { text: '初めて○○した日', set: 'experience' },
  { text: '大失敗から学んだこと', set: 'experience' },
  { text: '奇跡みたいな偶然', set: 'experience' },
  { text: '忘れられない誕生日', set: 'experience' },
  { text: 'がんばった受験・試験', set: 'experience' },
  { text: '人生で一番の買い物', set: 'experience' },
  { text: '病気・ケガから学んだこと', set: 'experience' },
  { text: '停電・災害のときの話', set: 'experience' },
  { text: '初めての海外', set: 'experience' },
  { text: 'お祝いの日の思い出', set: 'experience' },
  { text: '昨日あったちょっといいこと', set: 'experience' },
  // ---- 変化・成長型（growth）----
  { text: '昔と今で変わったこと', set: 'growth' },
  { text: '苦手を克服した話', set: 'growth' },
  { text: '性格が変わったきっかけ', set: 'growth' },
  { text: '続けて身についたこと', set: 'growth' },
  { text: '転職・転機の話', set: 'growth' },
  { text: 'やめてよかったこと', set: 'growth' },
  { text: '始めてよかったこと', set: 'growth' },
  { text: '10年前の自分と今の自分', set: 'growth' },
  { text: '考え方が180度変わったこと', set: 'growth' },
  { text: '大人になったと感じた瞬間', set: 'growth' },
  { text: '失敗から立ち直った話', set: 'growth' },
  { text: '私のビフォーアフター', set: 'growth' },
  { text: '新しい趣味で変わった生活', set: 'growth' },
  { text: '引っ越して変わったこと', set: 'growth' },
  { text: '子育てで変わったこと', set: 'growth' },
  { text: '体づくり・ダイエットの話', set: 'growth' },
  { text: '学び直しの話', set: 'growth' },
  { text: '苦手だった人と仲良くなれた話', set: 'growth' },
  { text: 'お金の使い方の変化', set: 'growth' },
  { text: 'コンプレックスとの付き合い方', set: 'growth' },
];

// 文章テンプレート。cells は9マス(0-8)の並べ替え順。
// AIは生成しない ── プレイヤー自身の回答をこの順に並べて下書きを作るだけ。
const TEMPLATES = {
  conclusion: {
    name: '結論優先型',
    hint: '伝えたいこと → エピソード → 気持ち → 変化 → もう一度まとめ',
    order: [8, 3, 2, 6, 8],
  },
  list: {
    name: '列挙型',
    hint: '9つの答えを順番に箇条書きでならべる',
    order: [0, 1, 2, 3, 4, 5, 6, 7, 8],
  },
  story: {
    name: 'ストーリー型',
    hint: '主役 → 場面 → 出来事 → 失敗 → 成功 → 気持ちの変化 → 伝えたいこと',
    order: [0, 1, 3, 4, 5, 6, 8],
  },
};

// 投票（採点）項目。各項目 0〜2点、5項目で合計 0〜10点。
const VOTE_CATEGORIES = ['読みやすさ', '具体性', '伝わりやすさ', '面白さ', 'もう一度読みたい'];

// 基本点の満点（9マスすべて記入で満点）と、投票ボーナスの満点。
const BASE_MAX = 60;
const BONUS_MAX = 40;



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

function titleFor(total) {
  if (total >= 95) return '質問マスター';
  if (total >= 80) return '文章職人';
  if (total >= 60) return 'ストーリービルダー';
  if (total >= 40) return '文章探検家';
  if (total >= 20) return '質問コレクター';
  return '見習い質問家';
}

function newPlayer(name, connected = true) {
  return {
    name,
    connected,
    cells: Array(CELL_COUNT).fill(''),
    template: null,
    finalText: '',
    submitted: false,
    // 集計用
    baseScore: 0,
    bonusScore: 0,
    totalScore: 0,
    title: '',
    votes: new Map(), // voterId -> { breakdown:[5], total }
  };
}

function createRoom(hostSocketId, hostName) {
  const code = makeRoomCode();
  const room = {
    code,
    hostId: hostSocketId,
    players: new Map(), // socketId -> player
    phase: 'lobby', // lobby | writing | presenting | ranking
    theme: '',
    questionSet: DEFAULT_SET,
    presentOrder: [],
    presentIndex: 0,
  };
  room.players.set(hostSocketId, newPlayer(hostName));
  rooms.set(code, room);
  return room;
}

function connectedPlayers(room) {
  return [...room.players.entries()].filter(([, p]) => p.connected);
}

function filledCount(player) {
  return player.cells.filter((c) => c.trim() !== '').length;
}

function currentPresenterId(room) {
  return room.presentOrder[room.presentIndex] || null;
}

// 現在の発表者に投票できる人（発表者以外の接続者）
function voterIds(room) {
  const pid = currentPresenterId(room);
  return connectedPlayers(room)
    .map(([id]) => id)
    .filter((id) => id !== pid);
}

function publicState(room) {
  const presenterId = room.phase === 'presenting' ? currentPresenterId(room) : null;
  const presenter = presenterId ? room.players.get(presenterId) : null;
  return {
    code: room.code,
    hostId: room.hostId,
    phase: room.phase,
    theme: room.theme,
    questionSet: room.questionSet,
    questions: (QUESTION_SETS[room.questionSet] || QUESTION_SETS[DEFAULT_SET]).questions,
    // ロビーでファシリテーターが選ぶための一覧（テーマ・質問セット）
    themes: THEMES,
    questionSets: Object.fromEntries(
      Object.entries(QUESTION_SETS).map(([k, v]) => [k, { name: v.name, desc: v.desc, questions: v.questions }])
    ),
    templates: Object.fromEntries(
      Object.entries(TEMPLATES).map(([k, v]) => [k, { name: v.name, hint: v.hint, order: v.order }])
    ),
    voteCategories: VOTE_CATEGORIES,
    presentIndex: room.presentIndex,
    presentTotal: room.presentOrder.length,
    voteProgress:
      room.phase === 'presenting'
        ? { done: voterIds(room).filter((id) => presenter && presenter.votes.has(id)).length, total: voterIds(room).length }
        : null,
    // 発表中は「今の発表者の回答だけ」を全員に公開する（他の人の記入は見えない）
    presenter:
      presenter && presenterId
        ? {
            id: presenterId,
            name: presenter.name,
            template: presenter.template,
            cells: presenter.cells,
            finalText: presenter.finalText,
          }
        : null,
    players: [...room.players.entries()].map(([id, p]) => ({
      id,
      name: p.name,
      connected: p.connected,
      filled: filledCount(p),
      questionCount: CELL_COUNT,
      hasTemplate: !!p.template,
      template: p.template,
      submitted: p.submitted,
      voted: presenter ? presenter.votes.has(id) : false,
      baseScore: p.baseScore,
      bonusScore: p.bonusScore,
      totalScore: p.totalScore,
      title: p.title,
    })),
  };
}

function broadcastState(room) {
  io.to(room.code).emit('roomUpdate', publicState(room));
}

// 現在の発表者への投票が出そろったか確認し、そろっていれば集計して次へ
function checkVotingComplete(room) {
  if (room.phase !== 'presenting') return;
  const presenter = room.players.get(currentPresenterId(room));
  if (!presenter) return;
  const voters = voterIds(room);
  const allVoted = voters.length > 0 && voters.every((id) => presenter.votes.has(id));
  if (allVoted) closeCurrentPresenter(room);
}

// 現在の発表者の投票を締めてボーナス点を確定し、次の発表者へ（いなければランキングへ）
function closeCurrentPresenter(room) {
  if (room.phase !== 'presenting') return;
  const presenter = room.players.get(currentPresenterId(room));
  if (presenter) {
    const totals = [...presenter.votes.values()].map((v) => v.total);
    const avg = totals.length ? totals.reduce((a, b) => a + b, 0) / totals.length : 0;
    // 平均(0〜10) を 0〜40 点に換算
    presenter.bonusScore = Math.min(BONUS_MAX, Math.round((avg / 10) * BONUS_MAX));
    presenter.totalScore = presenter.baseScore + presenter.bonusScore;
    presenter.title = titleFor(presenter.totalScore);
  }
  advancePresenter(room);
}

// 次の接続中の発表者へ進む。もういなければランキングへ。
function advancePresenter(room) {
  let idx = room.presentIndex + 1;
  while (idx < room.presentOrder.length) {
    const p = room.players.get(room.presentOrder[idx]);
    if (p && p.connected) {
      room.presentIndex = idx;
      broadcastState(room);
      checkVotingComplete(room);
      return;
    }
    idx += 1;
  }
  // 全員終了 → ランキング
  finishToRanking(room);
}

function finishToRanking(room) {
  room.phase = 'ranking';
  broadcastState(room);
}

function startPresenting(room) {
  // 1マス以上書いた接続者だけが発表対象
  const order = connectedPlayers(room)
    .filter(([, p]) => filledCount(p) > 0)
    .map(([id]) => id);
  // 基本点を確定
  for (const [, p] of room.players) {
    p.baseScore = Math.round((filledCount(p) / CELL_COUNT) * BASE_MAX);
    p.bonusScore = 0;
    p.totalScore = p.baseScore;
    p.title = titleFor(p.totalScore);
    p.votes = new Map();
  }
  if (order.length === 0) {
    // 誰も書いていない → そのままランキング（全員0点）
    room.presentOrder = [];
    room.presentIndex = 0;
    finishToRanking(room);
    return;
  }
  room.presentOrder = shuffle(order);
  room.presentIndex = 0;
  room.phase = 'presenting';
  broadcastState(room);
  checkVotingComplete(room);
}

function onConnection(socket) {
  socket.on('createRoom', ({ name }) => {
    const cleanName = (name || '').trim().slice(0, 20) || 'ファシリテーター';
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
      socket.emit('errorMsg', 'このワークショップはすでに始まっています。');
      return;
    }
    const cleanName = (name || '').trim().slice(0, 20) || 'プレイヤー';
    room.players.set(socket.id, newPlayer(cleanName));
    socket.join(room.code);
    socket.data.roomCode = room.code;
    socket.emit('joined', { code: room.code, selfId: socket.id });
    broadcastState(room);
  });

  // ファシリテーターが記入タイムを開始（テーマ・質問セット指定は任意）
  socket.on('startWriting', ({ theme, questionSet } = {}) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.id || room.phase !== 'lobby') return;
    if (connectedPlayers(room).length < 1) return;
    // 切断されたままのプレイヤーは外す
    for (const [id, p] of room.players) {
      if (!p.connected) room.players.delete(id);
    }
    const custom = (theme || '').trim().slice(0, 40);
    let themeText;
    let setKey;
    if (custom) {
      themeText = custom;
      // 明示指定があればそれ、なければ既定セット
      setKey = QUESTION_SETS[questionSet] ? questionSet : DEFAULT_SET;
    } else {
      // テーマ空欄 → ランダムに1つ選び、そのおすすめセットを使う
      const picked = THEMES[Math.floor(Math.random() * THEMES.length)];
      themeText = picked.text;
      setKey = QUESTION_SETS[questionSet] ? questionSet : picked.set;
    }
    room.theme = themeText;
    room.questionSet = setKey;
    for (const [, p] of room.players) {
      p.cells = Array(CELL_COUNT).fill('');
      p.template = null;
      p.finalText = '';
      p.submitted = false;
    }
    room.phase = 'writing';
    broadcastState(room);
  });

  // プレイヤーが1マス更新（本文は他プレイヤーに送らない）
  socket.on('updateCell', ({ index, text }) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.phase !== 'writing') return;
    const p = room.players.get(socket.id);
    if (!p) return;
    const i = Number(index);
    if (!Number.isInteger(i) || i < 0 || i >= CELL_COUNT) return;
    p.cells[i] = String(text || '').slice(0, 300);
    if (p.submitted) p.submitted = false; // 編集し直したら未完了に戻す
    broadcastState(room);
  });

  socket.on('setTemplate', ({ template }) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.phase !== 'writing') return;
    const p = room.players.get(socket.id);
    if (!p || !TEMPLATES[template]) return;
    p.template = template;
    broadcastState(room);
  });

  socket.on('setFinalText', ({ text }) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.phase !== 'writing') return;
    const p = room.players.get(socket.id);
    if (!p) return;
    p.finalText = String(text || '').slice(0, 4000);
  });

  socket.on('submitFinal', ({ text }) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.phase !== 'writing') return;
    const p = room.players.get(socket.id);
    if (!p) return;
    if (typeof text === 'string') p.finalText = text.slice(0, 4000);
    p.submitted = true;
    broadcastState(room);
  });

  // ファシリテーターが「終了」→ 全員一斉に発表フェーズへ
  socket.on('endWriting', () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.id || room.phase !== 'writing') return;
    startPresenting(room);
  });

  // 発表中の投票（採点）
  socket.on('castVote', ({ breakdown }) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.phase !== 'presenting') return;
    if (!voterIds(room).includes(socket.id)) return;
    if (!Array.isArray(breakdown) || breakdown.length !== VOTE_CATEGORIES.length) return;
    const clean = breakdown.map((n) => Math.max(0, Math.min(2, Math.round(Number(n) || 0))));
    const total = clean.reduce((a, b) => a + b, 0);
    const presenter = room.players.get(currentPresenterId(room));
    if (!presenter) return;
    presenter.votes.set(socket.id, { breakdown: clean, total });
    broadcastState(room);
    checkVotingComplete(room);
  });

  // ファシリテーターが投票を締めて次の発表者へ
  socket.on('nextPresenter', () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.id || room.phase !== 'presenting') return;
    closeCurrentPresenter(room);
  });

  // もう一度あそぶ（ロビーへ戻す）
  socket.on('backToLobby', () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.id) return;
    for (const [id, p] of room.players) {
      if (!p.connected) {
        room.players.delete(id);
        continue;
      }
      Object.assign(p, {
        cells: Array(CELL_COUNT).fill(''),
        template: null,
        finalText: '',
        submitted: false,
        baseScore: 0,
        bonusScore: 0,
        totalScore: 0,
        title: '',
        votes: new Map(),
      });
    }
    room.phase = 'lobby';
    room.theme = '';
    room.presentOrder = [];
    room.presentIndex = 0;
    broadcastState(room);
  });

  socket.on('disconnect', () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    const player = room.players.get(socket.id);
    if (player) player.connected = false;

    // ホスト（ファシリテーター）が抜けたら別の接続者に引き継ぐ
    if (room.hostId === socket.id) {
      const nextHost = connectedPlayers(room).find(([id]) => id !== socket.id);
      if (nextHost) room.hostId = nextHost[0];
    }

    const remaining = connectedPlayers(room);
    if (remaining.length === 0) {
      rooms.delete(room.code);
      return;
    }

    // 発表者が抜けたら次の発表者へ
    if (room.phase === 'presenting' && socket.id === currentPresenterId(room)) {
      advancePresenter(room);
      return;
    }

    broadcastState(room);
    checkVotingComplete(room);
  });
}

// 共通サーバーから呼ばれる登録関数
module.exports = function register({ nsp }) {
  io = nsp;
  io.on("connection", onConnection);
};
