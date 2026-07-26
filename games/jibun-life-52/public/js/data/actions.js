/* ==========================================================
 * 行動データ定義
 * 各行動が1週間でパラメータをどう変化させるかを定義する。
 * effects のキー: happiness / stress / health / money / relationship / skill
 * money の単位は「万円」。
 * salary: true の行動は、給料がスキル・役職で変動する（engine.js が計算）。
 * ========================================================== */

const ACTIONS = [
  {
    id: "work",
    name: "仕事",
    emoji: "💼",
    desc: "お金を稼ぐ。ただしストレスが溜まる",
    salary: true, // 給料は engine.js の calcSalary() で決まる
    effects: { money: 0, stress: 12, health: -3, happiness: -2 },
  },
  {
    id: "rest",
    name: "休息",
    emoji: "🛌",
    desc: "しっかり休んでストレス回復",
    effects: { stress: -18, health: 6, happiness: 3 },
  },
  {
    id: "exercise",
    name: "運動",
    emoji: "🏃",
    desc: "体を動かして健康アップ",
    effects: { health: 10, stress: -6, happiness: 4, money: -1 },
  },
  {
    id: "hobby",
    name: "趣味",
    emoji: "🎨",
    desc: "好きなことに没頭して幸福度アップ",
    effects: { happiness: 12, stress: -10, money: -3 },
  },
  {
    id: "study",
    name: "勉強",
    emoji: "📚",
    desc: "スキルを磨いて将来の収入アップ",
    effects: { skill: 6, stress: 4, money: -1, happiness: 1 },
  },
  {
    id: "social",
    name: "交流",
    emoji: "🗣",
    desc: "人と会って人間関係を深める",
    effects: { relationship: 9, happiness: 6, stress: -4, money: -2 },
  },
];

/* パラメータの表示定義（UI用） */
const STAT_DEFS = [
  { key: "happiness", name: "幸福度", emoji: "😊", color: "var(--c-happiness)" },
  { key: "stress", name: "ストレス", emoji: "🌀", color: "var(--c-stress)", isBad: true },
  { key: "health", name: "健康", emoji: "💪", color: "var(--c-health)" },
  { key: "relationship", name: "人間関係", emoji: "🤝", color: "var(--c-relationship)" },
];

/* 毎週の固定支出（生活費・万円） */
const WEEKLY_LIVING_COST = 2;
