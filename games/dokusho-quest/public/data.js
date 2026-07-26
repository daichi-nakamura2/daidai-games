// ============================================================
// ゲームデータとロジック(ミッションカード・レベル・称号)
// ============================================================
window.DQ = window.DQ || {};

// 公開URL(シェア機能で使う)
DQ.APP_URL = "https://daichi-nakamura2.github.io/dokusho-quest/";

// 選べる読書時間(分)
DQ.SESSION_OPTIONS = [15, 25, 60, 90];

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
  },
  {
    id: "three-keywords",
    title: "キーワードを3つ拾え!",
    description: "この本のカギになりそうな言葉を3つメモしよう。",
    icon: "🔑",
    rarity: "normal",
    bonusXp: 10,
  },
  {
    id: "treasure-map",
    title: "目次から宝をさがせ!",
    description: "目次を眺めて、いちばん気になる章から読んでみよう。",
    icon: "🗺️",
    rarity: "normal",
    bonusXp: 10,
  },
  {
    id: "past-self",
    title: "昨日の自分に教えよ!",
    description: "昨日の自分に教えてあげたいことをひとつ見つけよう。",
    icon: "🕰️",
    rarity: "normal",
    bonusXp: 10,
  },
  {
    id: "one-scene",
    title: "情景を思いうかべよ!",
    description: "書かれている内容を頭の中で映像にしながら読もう。",
    icon: "🎬",
    rarity: "normal",
    bonusXp: 10,
  },
  // レア
  {
    id: "ask-author",
    title: "著者に質問せよ!",
    description: "著者に聞いてみたい質問をひとつ考えながら読もう。",
    icon: "❓",
    rarity: "rare",
    bonusXp: 25,
  },
  {
    id: "tomorrow-wisdom",
    title: "明日つかえる知恵を持ち帰れ!",
    description: "明日さっそく試せることをひとつ持ち帰ろう。",
    icon: "💡",
    rarity: "rare",
    bonusXp: 25,
  },
  {
    id: "counter-attack",
    title: "ツッコミを入れよ!",
    description: "「本当かな?」と思うところを探して、自分の意見を持とう。",
    icon: "⚔️",
    rarity: "rare",
    bonusXp: 25,
  },
  {
    id: "one-word",
    title: "一言でまとめよ!",
    description: "今日読んだ範囲を一言でまとめるとしたら?",
    icon: "🎯",
    rarity: "rare",
    bonusXp: 25,
  },
  // エピック
  {
    id: "life-changing",
    title: "人生を変える一文を発掘せよ!",
    description: "これからの自分を変えてくれそうな一文を発掘しよう。",
    icon: "💎",
    rarity: "epic",
    bonusXp: 50,
  },
  {
    id: "tell-someone",
    title: "誰かに話したくなる話を仕入れよ!",
    description: "家族や友だちに話したくなるネタをひとつ仕入れよう。",
    icon: "🔥",
    rarity: "epic",
    bonusXp: 50,
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
DQ.calcSessionXp = function calcSessionXp({ mission, memo, minutes }) {
  const breakdown = [
    { label: "クエストクリア", xp: 20 },
    { label: `読書 ${minutes}分`, xp: minutes * 2 },
    { label: `ミッション: ${mission.title}`, xp: mission.bonusXp },
  ];
  if (memo.trim().length > 0) {
    breakdown.push({ label: "冒険の記録(メモ)", xp: 20 });
  }
  const xpGained = breakdown.reduce((sum, b) => sum + b.xp, 0);
  return { breakdown, xpGained };
};
