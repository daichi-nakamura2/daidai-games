// ============================================================
// localStorage への保存・読み込み
// ============================================================
window.DQ = window.DQ || {};

const DQ_STORAGE_KEY = "dokusho-quest-2-data-v1";
const DQ_THEME_KEY = "dokusho-quest-2-theme";
const DQ_PLAYER_ID_KEY = "dokusho-quest-2-player-id";
const DQ_CIRCLE_KEY = "dokusho-quest-2-circle";
// 読書会に自動で戻る有効期限(これを過ぎたら普通の入室フォームから始める)
const DQ_CIRCLE_MAX_AGE = 3 * 60 * 60 * 1000;

// localStorage が使えない環境のための代役(そのタブのあいだだけ有効)
let dqFallbackPlayerId = null;

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

/**
 * この端末の固定プレイヤーID。
 * 読書会では socket.id ではなくこのIDで人を識別するので、
 * 再読み込み・画面ロック・電波切れでつなぎ直しても同じ自分として戻れる。
 */
DQ.getPlayerId = function getPlayerId() {
  try {
    let id = localStorage.getItem(DQ_PLAYER_ID_KEY);
    if (!id) {
      id = DQ.generateId();
      localStorage.setItem(DQ_PLAYER_ID_KEY, id);
    }
    return id;
  } catch {
    if (!dqFallbackPlayerId) dqFallbackPlayerId = DQ.generateId();
    return dqFallbackPlayerId;
  }
};

/** 参加中の読書会(部屋コードと名前)を覚えておく */
DQ.saveCircleSession = function saveCircleSession(code, name) {
  try {
    localStorage.setItem(
      DQ_CIRCLE_KEY,
      JSON.stringify({ code, name, at: Date.now() }),
    );
  } catch {
    // 保存できなくても、そのタブのあいだは再接続で復帰できる
  }
};

/** 直前に参加していた読書会を読み込む(古すぎる場合は null) */
DQ.loadCircleSession = function loadCircleSession() {
  try {
    const raw = localStorage.getItem(DQ_CIRCLE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || !s.code || !s.name) return null;
    if (Date.now() - (s.at || 0) > DQ_CIRCLE_MAX_AGE) return null;
    return { code: s.code, name: s.name };
  } catch {
    return null;
  }
};

/** 読書会から意図的に退出したときに忘れる */
DQ.clearCircleSession = function clearCircleSession() {
  try {
    localStorage.removeItem(DQ_CIRCLE_KEY);
  } catch {
    // 消せなくても実害はない
  }
};

const DQ_LETTERS_KEY = "dokusho-quest-2-letters";
const DQ_MAX_LETTERS = 300;

/** もらった応援コメント(応援レター)を読み込む(新しい順) */
DQ.loadLetters = function loadLetters() {
  try {
    const list = JSON.parse(localStorage.getItem(DQ_LETTERS_KEY) || "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

/**
 * 応援レターを追加する。同じ key のものは重複して保存しない。
 * @returns 新しく増えたレターの配列
 */
DQ.addLetters = function addLetters(incoming) {
  const list = DQ.loadLetters();
  const known = new Set(list.map((l) => l.key));
  const fresh = incoming.filter((l) => !known.has(l.key));
  if (fresh.length === 0) return [];
  const next = [...fresh.sort((a, b) => b.at - a.at), ...list].slice(0, DQ_MAX_LETTERS);
  try {
    localStorage.setItem(DQ_LETTERS_KEY, JSON.stringify(next));
  } catch {
    // 保存できなくても読書会の画面には表示される
  }
  return fresh;
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
