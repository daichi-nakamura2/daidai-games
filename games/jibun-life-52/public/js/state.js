/* ==========================================================
 * ゲーム状態の管理
 * 状態の生成・更新・セーブ/ロードのみを担当する。
 * ルール計算は engine.js、描画は ui.js に分離。
 * ========================================================== */

const SAVE_KEY = "jibun-life-52-save-v1";

/** 新規ゲームの初期状態を返す */
function createInitialState() {
  return {
    turn: 1, // 現在の週（1〜52）
    stats: {
      happiness: 50,
      stress: 30,
      health: 60,
      money: 30, // 万円
      relationship: 50,
    },
    skill: 0, // 隠しパラメータ：勉強で上がり、給料・イベントに影響
    jobLevel: 0, // 役職レベル（昇進イベントで上がる）0〜3
    flags: {
      hasPartner: false, // 恋人がいるか
      hasPet: false, // ペットを飼っているか
      hasMoved: false, // 引っ越し済みか
    },
    counts: { work: 0, rest: 0, exercise: 0, hobby: 0, study: 0, social: 0 },
    firedEvents: [], // 発生済みイベントID（同じイベントの連発を抑える）
    log: [], // { week, text, type } の配列（新しい順）
    gameOver: false,
  };
}

/** 0〜100 の範囲に丸める（money は下限なし・上限なし） */
function clampStats(stats) {
  stats.happiness = Math.max(0, Math.min(100, stats.happiness));
  stats.stress = Math.max(0, Math.min(100, stats.stress));
  stats.health = Math.max(0, Math.min(100, stats.health));
  stats.relationship = Math.max(0, Math.min(100, stats.relationship));
  stats.money = Math.round(stats.money);
}

/** ログを追加（先頭に挿入・最大50件） */
function addLog(state, text, type = "normal") {
  state.log.unshift({ week: state.turn, text, type });
  if (state.log.length > 50) state.log.pop();
}

/* ---------- セーブ / ロード ---------- */

function saveGame(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) {
    /* プライベートモード等で保存できない場合は無視 */
  }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw);
    if (!state || typeof state.turn !== "number" || state.gameOver) return null;
    return state;
  } catch (e) {
    return null;
  }
}

function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (e) {
    /* 無視 */
  }
}
