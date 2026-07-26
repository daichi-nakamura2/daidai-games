// ============================================================
// localStorage への保存・読み込み
// ============================================================
window.DQ = window.DQ || {};

const DQ_STORAGE_KEY = "dokusho-quest-v2-data-v1";
const DQ_THEME_KEY = "dokusho-quest-v2-theme";

/** ゲームデータ(本・ログ・累計XP)を読み込む */
DQ.loadGameData = function loadGameData() {
  const empty = { books: [], logs: [], totalXp: 0 };
  try {
    const raw = localStorage.getItem(DQ_STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw);
    return {
      books: parsed.books || [],
      logs: parsed.logs || [],
      totalXp: parsed.totalXp || 0,
    };
  } catch {
    return empty;
  }
};

/** ゲームデータを保存する */
DQ.saveGameData = function saveGameData(data) {
  try {
    localStorage.setItem(DQ_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ストレージが使えない環境では保存をあきらめる(アプリは動き続ける)
  }
};

/** 保存されたテーマ("light" / "dark")を読み込む。未保存ならOS設定に従う */
DQ.loadTheme = function loadTheme() {
  const saved = localStorage.getItem(DQ_THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

/** テーマを保存する */
DQ.saveTheme = function saveTheme(theme) {
  try {
    localStorage.setItem(DQ_THEME_KEY, theme);
  } catch {
    // 保存できなくても動作は継続する
  }
};

/** ユニークIDを生成する */
DQ.generateId = function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};
