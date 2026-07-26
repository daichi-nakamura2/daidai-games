/* ==========================================================
 * エンディングデータ定義
 * 52週終了時の状態から「どんな1年だったか」を判定する。
 * 上から順に cond を評価し、最初に合致したものが採用される。
 * cond には最終ステータス (stats), jobLevel, skill, flags が渡る。
 * ========================================================== */

const ENDINGS = [
  {
    id: "burnout",
    emoji: "🔥",
    title: "燃え尽きエンド",
    text: "頑張りすぎた1年だった…。お金や成果は残ったかもしれないが、心と体はボロボロ。来年は「休む勇気」を大切にしよう。",
    cond: (s) => s.stats.stress >= 80 || s.stats.health <= 20,
  },
  {
    id: "balanced",
    emoji: "🌈",
    title: "バランス達人エンド",
    text: "仕事も遊びも健康も人間関係も、すべてをほどよく育てた理想の1年！「自分らしい人生」のお手本のような生き方だ。",
    cond: (s) =>
      s.stats.happiness >= 65 &&
      s.stats.health >= 60 &&
      s.stats.relationship >= 60 &&
      s.stats.stress <= 40 &&
      s.stats.money >= 30,
  },
  {
    id: "career",
    emoji: "👑",
    title: "キャリアの星エンド",
    text: "仕事に打ち込み、スキルと地位を手に入れた1年。ここぞという時に休息も忘れなかったのはさすが。次はプライベートも育てよう。",
    cond: (s) => s.jobLevel >= 2 && s.stats.money >= 60 && s.stats.stress < 80,
  },
  {
    id: "rich",
    emoji: "💎",
    title: "しっかり貯蓄エンド",
    text: "堅実にお金を貯めた1年。経済的な安心はこころの土台になる。そのお金で、来年は新しい体験に投資してみては？",
    cond: (s) => s.stats.money >= 80,
  },
  {
    id: "social_butterfly",
    emoji: "🦋",
    title: "人望の人エンド",
    text: "たくさんの人と繋がり、支え合った1年。あなたの周りにはいつも笑顔がある。人間関係こそ人生最大の財産だ。",
    cond: (s) => s.stats.relationship >= 80 && s.stats.happiness >= 55,
  },
  {
    id: "healthy",
    emoji: "🌿",
    title: "健康マスターエンド",
    text: "体を大切にした1年。よく動き、よく休み、心身ともに絶好調！健康はすべての活動の資本。この調子で続けよう。",
    cond: (s) => s.stats.health >= 80 && s.stats.stress <= 40,
  },
  {
    id: "hobbyist",
    emoji: "🎨",
    title: "遊びの達人エンド",
    text: "好きなことにとことん打ち込んだ1年。幸福度は高いが、お財布はちょっと寂しいかも？好きを続ける工夫を考えよう。",
    cond: (s) => s.stats.happiness >= 70 && s.stats.money < 30,
  },
  {
    id: "scholar",
    emoji: "🎓",
    title: "学びの探究者エンド",
    text: "知識とスキルをぐんぐん伸ばした1年。積み上げた学びは、これからの人生で必ず花開く。未来が楽しみだ！",
    cond: (s) => s.skill >= 60,
  },
  {
    id: "poor",
    emoji: "🍂",
    title: "金欠エンド",
    text: "お金に苦労した1年だった…。楽しさや休息も大事だが、生活の土台も大切。来年は働き方と支出のバランスを見直そう。",
    cond: (s) => s.stats.money <= 5,
  },
  {
    id: "ordinary",
    emoji: "🌤",
    title: "マイペースエンド",
    text: "山もあり谷もあり、自分なりに歩んだ1年。劇的ではないけれど、こういう日々の積み重ねこそが人生。来年はどんな年にする？",
    cond: () => true, // フォールバック
  },
];

/* 総合スコアからグレードを算出する境界値 */
const GRADE_TABLE = [
  { min: 400, grade: "S", comment: "パーフェクトな1年！" },
  { min: 330, grade: "A", comment: "とても充実した1年！" },
  { min: 260, grade: "B", comment: "なかなか良い1年！" },
  { min: 180, grade: "C", comment: "おつかれさまの1年" },
  { min: 0, grade: "D", comment: "来年こそリベンジ！" },
];
