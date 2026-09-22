// ============================================================
// ゲームデータとロジック(ミッションカード・レベル・称号)
// ============================================================
window.DQ = window.DQ || {};

// 公開URL(シェア機能で使う)
DQ.APP_URL = "https://daidai-games.onrender.com/games/dokusho-quest-2/";

// 選べる読書時間(分)
DQ.SESSION_OPTIONS = [15, 20, 25, 60];

// ---------- ミッションカード ----------
// rarity: "normal"(出やすい) / "rare"(ときどき) / "epic"(めったに出ない)
DQ.MISSIONS = [
  // ノーマル
  {
    id: "find-line",
    title: "気になる一文をさがせ!",
    description: "読みながら「おっ」と思った一文をひとつ見つけよう。",
    icon: "📜",
    rarity: "normal",
    bonusXp: 10,
    hints: ["心に残った一文は「", "この一文が気になったのは、", "この一文を読んで思い出したのは、"],
  },
  {
    id: "three-keywords",
    title: "キーワードを3つ拾え!",
    description: "この本のカギになりそうな言葉を3つメモしよう。",
    icon: "🔑",
    rarity: "normal",
    bonusXp: 10,
    hints: ["キーワード①", "3つに共通しているのは、", "いちばん大事そうなのは「"],
  },
  {
    id: "treasure-map",
    title: "目次から宝をさがせ!",
    description: "目次を眺めて、いちばん気になる章から読んでみよう。",
    icon: "🗺️",
    rarity: "normal",
    bonusXp: 10,
    hints: ["この章を選んだのは、", "読んでみたら、", "次に読みたい章は、"],
  },
  {
    id: "past-self",
    title: "昨日の自分に教えよ!",
    description: "昨日の自分に教えてあげたいことをひとつ見つけよう。",
    icon: "🕰️",
    rarity: "normal",
    bonusXp: 10,
    hints: ["昨日の自分へ。", "知っていたら助かったのは、", "もし昨日知っていたら、"],
  },
  {
    id: "one-scene",
    title: "情景を思いうかべよ!",
    description: "書かれている内容を頭の中で映像にしながら読もう。",
    icon: "🎬",
    rarity: "normal",
    bonusXp: 10,
    hints: ["頭に浮かんだのは、", "いちばん鮮やかだった場面は、", "その場にいたら、"],
  },
  // レア
  {
    id: "ask-author",
    title: "著者に質問せよ!",
    description: "著者に聞いてみたい質問をひとつ考えながら読もう。",
    icon: "❓",
    rarity: "rare",
    bonusXp: 25,
    hints: ["著者に聞きたいのは、", "なぜなら、", "自分なりの予想は、"],
  },
  {
    id: "tomorrow-wisdom",
    title: "明日つかえる知恵を持ち帰れ!",
    description: "明日さっそく試せることをひとつ持ち帰ろう。",
    icon: "💡",
    rarity: "rare",
    bonusXp: 25,
    hints: ["明日ためすのは、", "うまくいきそうな理由は、", "続けるコツは、"],
  },
  {
    id: "counter-attack",
    title: "ツッコミを入れよ!",
    description: "「本当かな?」と思うところを探して、自分の意見を持とう。",
    icon: "⚔️",
    rarity: "rare",
    bonusXp: 25,
    hints: ["「本当かな?」と思ったのは、", "自分の考えは、", "それでも納得したのは、"],
  },
  {
    id: "one-word",
    title: "一言でまとめよ!",
    description: "今日読んだ範囲を一言でまとめるとしたら?",
    icon: "🎯",
    rarity: "rare",
    bonusXp: 25,
    hints: ["一言でいうと「", "そう思った理由は、", "この一言をだれかに伝えるなら、"],
  },
  // ＋版で追加したアウトプット系カード
  {
    id: "before-after",
    title: "読む前と後をくらべよ!",
    description: "読む前に思っていたことと、読んだあとの考えの変化を書こう。",
    icon: "🔄",
    rarity: "normal",
    bonusXp: 10,
    hints: ["読む前は、", "読んだあとは、", "変わったきっかけは、"],
  },
  {
    id: "my-experience",
    title: "自分の体験とつなげよ!",
    description: "書かれていることに似た、自分の体験をひとつ思い出そう。",
    icon: "🧩",
    rarity: "normal",
    bonusXp: 10,
    hints: ["似ている体験は、", "そのとき自分は、", "今ならこうする。"],
  },
  {
    id: "teach-kid",
    title: "小学生に説明せよ!",
    description: "今日読んだ内容を、小学生にもわかる言葉で説明してみよう。",
    icon: "🎒",
    rarity: "rare",
    bonusXp: 25,
    hints: ["かんたんに言うと、", "たとえば、", "だから、"],
  },
  {
    id: "recommend",
    title: "この本をすすめよ!",
    description: "この本を読んでほしい人を思いうかべて、おすすめの一言を書こう。",
    icon: "📣",
    rarity: "rare",
    bonusXp: 25,
    hints: ["読んでほしいのは、", "おすすめポイントは、", "特に読んでほしいところは、"],
  },
  // エピック
  {
    id: "three-lines",
    title: "三行で要約せよ!",
    description: "今日読んだ範囲を、きっちり三行にまとめよう。",
    icon: "📝",
    rarity: "epic",
    bonusXp: 50,
    hints: ["1行目:", "2行目:", "3行目:"],
  },
  {
    id: "life-changing",
    title: "人生を変える一文を発掘せよ!",
    description: "これからの自分を変えてくれそうな一文を発掘しよう。",
    icon: "💎",
    rarity: "epic",
    bonusXp: 50,
    hints: ["人生を変えそうな一文は「", "これからの自分は、", "まず変えたいのは、"],
  },
  {
    id: "tell-someone",
    title: "誰かに話したくなる話を仕入れよ!",
    description: "家族や友だちに話したくなるネタをひとつ仕入れよう。",
    icon: "🔥",
    rarity: "epic",
    bonusXp: 50,
    hints: ["話したいのは、", "話す相手は、", "きっと驚くのは、"],
  },
];

DQ.RARITY_LABELS = {
  normal: "ノーマル",
  rare: "レア",
  epic: "エピック",
};

// レア度ごとの抽選の重み(合計100)
const DQ_RARITY_WEIGHTS = { normal: 60, rare: 30, epic: 10 };

/** レア度の重みに従ってミッションカードを1枚引く */
DQ.drawMission = function drawMission() {
  const countByRarity = (rarity) =>
    DQ.MISSIONS.filter((m) => m.rarity === rarity).length;
  const weightOf = (m) => DQ_RARITY_WEIGHTS[m.rarity] / countByRarity(m.rarity);

  const totalWeight = DQ.MISSIONS.reduce((sum, m) => sum + weightOf(m), 0);
  let roll = Math.random() * totalWeight;
  for (const mission of DQ.MISSIONS) {
    roll -= weightOf(mission);
    if (roll <= 0) return mission;
  }
  return DQ.MISSIONS[0];
};

// ---------- レベルと称号 ----------

/** そのレベルから次のレベルに上がるのに必要なXP */
DQ.xpForNextLevel = function xpForNextLevel(level) {
  return 100 + (level - 1) * 50;
};

/** 累計XPから現在のレベルを計算する */
DQ.levelFromXp = function levelFromXp(totalXp) {
  let level = 1;
  let remaining = totalXp;
  while (remaining >= DQ.xpForNextLevel(level)) {
    remaining -= DQ.xpForNextLevel(level);
    level += 1;
  }
  return level;
};

/** 現在レベル・レベル内の進捗(0〜1)・必要XPをまとめて返す */
DQ.levelProgress = function levelProgress(totalXp) {
  let level = 1;
  let remaining = totalXp;
  while (remaining >= DQ.xpForNextLevel(level)) {
    remaining -= DQ.xpForNextLevel(level);
    level += 1;
  }
  const required = DQ.xpForNextLevel(level);
  return { level, current: remaining, required, ratio: remaining / required };
};

// レベルに応じた称号(minLevel 以上で解放)
const DQ_TITLES = [
  { minLevel: 1, title: "見習い読書家" },
  { minLevel: 3, title: "ページの旅人" },
  { minLevel: 5, title: "物語の探検家" },
  { minLevel: 8, title: "知恵の収集家" },
  { minLevel: 12, title: "書架の騎士" },
  { minLevel: 16, title: "賢者の弟子" },
  { minLevel: 20, title: "本の大賢者" },
  { minLevel: 30, title: "伝説の読書王" },
];

/** レベルに応じた称号を返す */
DQ.titleForLevel = function titleForLevel(level) {
  let result = DQ_TITLES[0].title;
  for (const t of DQ_TITLES) {
    if (level >= t.minLevel) result = t.title;
  }
  return result;
};

// ---------- XP計算 ----------

/**
 * セッション完了時のXP内訳を計算する。
 * @returns {{ breakdown: {label: string, xp: number}[], xpGained: number }}
 */
DQ.calcSessionXp = function calcSessionXp({ mission, memo, action, minutes }) {
  const m = memo.trim();
  const breakdown = [
    { label: "クエストクリア", xp: 20 },
    { label: `読書 ${minutes}分`, xp: minutes * 2 },
    { label: `ミッション: ${mission.title}`, xp: mission.bonusXp },
  ];
  if (m.length > 0) {
    breakdown.push({ label: "冒険の記録(メモ)", xp: 20 });
  }
  const deep = DQ.deepWritingBonus(m.length);
  if (deep > 0) {
    breakdown.push({ label: `じっくり書いたボーナス(${m.length}字)`, xp: deep });
  }
  if ((action || "").trim().length > 0) {
    breakdown.push({ label: "明日の一歩", xp: DQ.ACTION_BONUS_XP });
  }
  const xpGained = breakdown.reduce((sum, b) => sum + b.xp, 0);
  return { breakdown, xpGained };
};

// ---------- アウトプット強化(＋版) ----------
// ※ server.js の baseXpFor と同じ数字にそろえること

/** メモの文字数に応じた「じっくり書いた」ボーナス */
DQ.DEEP_TIERS = [
  { chars: 200, xp: 20 },
  { chars: 100, xp: 10 },
];
DQ.deepWritingBonus = function deepWritingBonus(len) {
  const tier = DQ.DEEP_TIERS.find((t) => len >= t.chars);
  return tier ? tier.xp : 0;
};

/** 「明日の一歩」を書いたときのボーナス */
DQ.ACTION_BONUS_XP = 10;

/** カードに書き出しヒントが無いときの共通ヒント */
DQ.DEFAULT_HINTS = ["いちばん心に残ったのは、", "なぜなら、", "これから、"];

// ---------- 応援コメント(＋版) ----------
DQ.GIFT_XP_TO_AUTHOR = 20;
DQ.GIFT_XP_TO_GIFTER = 5;
DQ.GIFT_COMMENT_BONUS = 5; // コメントを添えて贈ると、贈った人に上乗せ
DQ.MAX_CHEER = 60;

/** ワンタップで選べるポジティブな応援コメント */
DQ.CHEER_STAMPS = [
  { icon: "✨", text: "その視点、すてき!" },
  { icon: "📖", text: "その本、読みたくなった!" },
  { icon: "💡", text: "なるほど、勉強になった!" },
  { icon: "🙌", text: "明日の一歩、応援してる!" },
  { icon: "🔥", text: "熱い感想、伝わってきた!" },
  { icon: "🌱", text: "わたしも真似してみたい!" },
  { icon: "🎯", text: "まとめ方がわかりやすい!" },
  { icon: "🤝", text: "すごく共感した!" },
];

// 応援にふさわしくない言葉(見つけたら、言いかえをお願いする)
// ※ server.js の NG_WORDS と同じ内容にそろえること
DQ.NG_WORDS = [
  "つまらな", "くだらな", "意味不明", "意味ない", "ばか", "バカ", "馬鹿",
  "アホ", "きもい", "キモい", "うざい", "ウザい", "下手",
  "ダサ", "だっさ", "死ね", "消えろ", "最悪", "微妙", "浅い", "薄っぺら",
];

/** 応援コメントに含まれる NG ワードを返す(無ければ null) */
DQ.findNgWord = function findNgWord(text) {
  const t = String(text || "");
  return DQ.NG_WORDS.find((w) => t.includes(w)) || null;
};

// ============================================================
// 2.0: 読書会の進行(STEP)
//   「本を読むゲーム」から
//   「本の学びを、仲間との対話を通して行動に変えるゲーム」へ。
// ============================================================

// チュートリアルと進行バーに出す7つのSTEP。
// phase は server.js の PHASES と対応する(共有とフィードバックは同じ phase)。
DQ.STEPS = [
  {
    no: 1,
    phase: "mission",
    icon: "🎴",
    short: "ミッション",
    title: "ミッションを決める",
    lead: "今日読む本を決めて、ミッションカードを1枚引きます。",
  },
  {
    no: 2,
    phase: "reading",
    icon: "📖",
    short: "読書",
    title: "20分読む",
    lead: "全員で同じタイマーを見ながら、いっしょに集中して読みます。",
  },
  {
    no: 3,
    phase: "draft",
    icon: "✍️",
    short: "仮アクション",
    title: "仮アクションを書く",
    lead: "読んで気づいたことを整理して、「やってみたいこと」を先に書きます。",
  },
  {
    no: 4,
    phase: "share",
    icon: "🎤",
    short: "共有",
    title: "1人ずつ共有",
    lead: "1人2分で、読んだ内容と仮アクションをみんなに話します。",
  },
  {
    no: 5,
    phase: "share",
    icon: "💌",
    short: "フィードバック",
    title: "みんなからフィードバック",
    lead: "発表者以外が、ひとことずつ自由に感想を贈ります。ここが一番の山場。",
  },
  {
    no: 6,
    phase: "final",
    icon: "🎯",
    short: "最終アクション",
    title: "最終アクションを決める",
    lead: "もらった言葉をふまえて、仮アクションを書きかえます。",
  },
  {
    no: 7,
    phase: "done",
    icon: "🚀",
    short: "実行",
    title: "24時間以内に実行する",
    lead: "10分以内で1回だけ試して、オープンチャットで報告します。",
  },
];

/**
 * 各STEPの画面に出す「いまやること」と、ホストだけに見える進行台本。
 * 主催者がプレゼン資料を別に用意しなくても、ここを読むだけで進められるようにしている。
 */
DQ.PHASE_INFO = {
  lobby: {
    badge: "はじめに",
    icon: "🏁",
    title: "あつまる",
    lead: "全員がそろうまで待ちます。下の「今日の流れ」に目を通しておいてください。",
    waiting: "ホストが始めるのを待っています…",
    script:
      "「読書クエストへようこそ。今日は本を読むだけでなく、読んだことを話して、もらった言葉で自分の次の一歩を決めるところまでやります。画面に今日の流れが出ているので、ざっと見てください」",
    next: { phase: "mission", label: "STEP1 ミッションを決める へ" },
  },
  mission: {
    badge: "STEP 1",
    icon: "🎴",
    title: "ミッションを決める",
    lead: "今日読む本を入れて、ミッションカードを1枚引こう。カードが「読み方」になります。",
    waiting: "ほかの人がカードを引き終わるのを待っています…",
    script:
      "「まず今日読む本を入力して、ミッションカードを1枚引いてください。引き直しもできます。カードは“どんなふうに読むか”のお題です。全員そろったら読書に入ります」",
    next: { phase: "reading", label: "STEP2 読書タイムへ" },
  },
  reading: {
    badge: "STEP 2",
    icon: "📖",
    title: "みんなで読書",
    lead: "同じタイマーを見ながら、いっしょに読もう。終わると自動で次のSTEPに進みます。",
    waiting: "ホストが読書タイムを始めるのを待っています…",
    script:
      "「それでは読書タイムです。時間になったら自動で次の画面に変わるので、タイマーは気にせず読んでください。では、スタート!」",
    next: { phase: "draft", label: "STEP3 仮アクションへ(手動で進む)" },
  },
  draft: {
    badge: "STEP 3・4",
    icon: "✍️",
    title: "整理して「仮アクション」を書く",
    lead: "印象に残ったこと・気づいたことを書いて、そのあと「やってみたいこと」を1つ決めよう。",
    waiting: "ほかの人が書き終わるのを待っています…",
    script:
      "「読んだ内容を書き出して、最後に“これをやってみたい”という仮アクションを1つ書いてください。まだ大きな目標のままで大丈夫です。あとでみんなの意見をもらって書きかえます」",
    next: { phase: "share", label: "STEP4 共有をはじめる" },
  },
  share: {
    badge: "STEP 4・5",
    icon: "🎤",
    title: "共有とフィードバック",
    lead: "発表者の内容がこの画面に出ます。発表者以外は、ひとことフィードバックを贈ろう。",
    waiting: "ホストが共有をはじめるのを待っています…",
    script:
      "「1人ずつ、読んだ内容と仮アクションを話してください。話し終わったら、ほかの人はひとことずつ感想をどうぞ。『それいいですね』『自分だったらこうします』など、自由で大丈夫です」",
    next: { phase: "final", label: "STEP6 最終アクションへ" },
  },
  final: {
    badge: "STEP 6",
    icon: "🎯",
    title: "最終アクションを決める",
    lead: "もらった言葉を読み返して、仮アクションを「24時間以内・10分以内・1回だけ」に書きかえよう。",
    waiting: "ほかの人が書き終わるのを待っています…",
    script:
      "「もらったフィードバックを見ながら、仮アクションを小さく具体的に書きかえてください。ルールは3つ。24時間以内に、10分以内で、1回だけ試せること。『毎日30分運動する』なら『明日の朝、10分だけ散歩する』くらいまで小さくします」",
    next: { phase: "done", label: "しめくくりへ" },
  },
  done: {
    badge: "しめくくり",
    icon: "🚀",
    title: "24時間以内に、1回だけ試す",
    lead: "今日決めた最終アクションを、24時間以内に1回やってみよう。",
    waiting: "",
    script:
      "「今日はおつかれさまでした。最後に一つだけお願いです。今決めた最終アクションを、24時間以内に1回だけ試してみてください。やってみたらオープンチャットで報告してください。写真でもスクショでも大歓迎です」",
    next: null,
  },
};

/** 最終アクションのルール(画面に出す3か条) */
DQ.ACTION_RULES = [
  { icon: "⏰", text: "24時間以内にできる" },
  { icon: "⏳", text: "10分以内で終わる" },
  { icon: "1️⃣", text: "1回だけ試せばいい" },
];

/** 仮アクション → 最終アクション の書きかえ例 */
DQ.ACTION_EXAMPLE = {
  before: "毎日30分運動する",
  after: "明日の朝、10分だけ散歩する",
};

/** 最終アクションの書き出しヒント(タップで入る) */
DQ.FINAL_HINTS = [
  "明日の朝、10分だけ",
  "今日の夜、1回だけ",
  "明日の昼休みに5分だけ",
  "家に帰ったらすぐ、1つだけ",
];

/** 仮アクションの書き出しヒント */
DQ.DRAFT_HINTS = ["この読書をもとに、", "やってみたいのは、", "まず試すなら、"];

// ---------- 最終アクションのEXP(server.js と同じ数字にそろえること) ----------
DQ.FINAL_XP_CHANGED = 30; // フィードバックを受けて書きかえた
DQ.FINAL_XP_KEPT = 15; // 仮アクションのまま貫いた

// ---------- フィードバック(STEP5) ----------
// 細かいルールは設けず、自由に書いてもらう。下は「選ぶだけ」で贈れる入り口。
DQ.FEEDBACK_STAMPS = [
  { icon: "✨", text: "それ、いいですね!" },
  { icon: "🔄", text: "自分だったらこうします" },
  { icon: "💡", text: "こういう方法もありそう" },
  { icon: "🙌", text: "そのアクション、応援してます!" },
  { icon: "📖", text: "その本、読みたくなった!" },
  { icon: "🎯", text: "もっと小さくしてもいいかも" },
  { icon: "🤝", text: "すごく共感しました" },
  { icon: "🌱", text: "わたしも真似してみたい" },
];

// ---------- イベント後の報告先 ----------
// LINEオープンチャットのURLが決まったら、ここに入れるとボタンとして出る。
DQ.OPENCHAT_URL = "";
DQ.OPENCHAT_NAME = "読書クエストのオープンチャット";
