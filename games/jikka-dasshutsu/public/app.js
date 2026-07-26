/* =========================================================================
 * app.js
 * -------------------------------------------------------------------------
 * ゲームエンジン本体。
 *   - シーンの表示（テキスト送り・選択肢）
 *   - ステータス管理と変動アニメーション
 *   - セーブ / ロード（localStorage）
 *   - エンディング分岐の判定
 *
 * シナリオそのものは game-data.js にある。ここは「動かす」役割に徹する。
 * ========================================================================= */

"use strict";

/* セーブデータを保存する localStorage のキー */
const SAVE_KEY = "jikka_case1_save";

/* -------------------------------------------------------------------------
 * ゲーム状態（実行中に変化するもの）
 * ----------------------------------------------------------------------- */
const state = {
  sceneId: START_SCENE, // 今いるシーンのID
  page: 0,              // シーン内テキストの何ページ目か
  status: {},           // 現在のステータス（INITIAL_STATUS のコピー）
};

/* -------------------------------------------------------------------------
 * DOM要素の参照（index.html の id と対応）
 * ----------------------------------------------------------------------- */
const el = {
  screen: document.getElementById("screen"),
  scene: document.getElementById("scene"),
  dayLabel: document.getElementById("day-label"),
  speaker: document.getElementById("speaker"),
  text: document.getElementById("text-body"),
  choices: document.getElementById("choices"),
  nextHint: document.getElementById("next-hint"),
  statusPanel: document.getElementById("status-panel"),
  // タイトル画面
  titleScreen: document.getElementById("title-screen"),
  btnStart: document.getElementById("btn-start"),
  btnContinue: document.getElementById("btn-continue"),
  // ゲーム中のメニューボタン
  btnSave: document.getElementById("btn-save"),
  btnTitle: document.getElementById("btn-title"),
  toast: document.getElementById("toast"),
};

/* =========================================================================
 * 初期化
 * ======================================================================= */
function init() {
  // タイトル画面のボタン
  el.btnStart.addEventListener("click", startNewGame);
  el.btnContinue.addEventListener("click", continueGame);

  // ゲーム中メニュー
  el.btnSave.addEventListener("click", () => {
    saveGame();
    showToast("セーブしました");
  });
  el.btnTitle.addEventListener("click", goToTitle);

  // 本文クリック / スペース・Enter キーで次へ送る
  el.scene.addEventListener("click", onScreenTapped);
  document.addEventListener("keydown", (e) => {
    if (el.scene.classList.contains("hidden")) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onScreenTapped();
    }
  });

  refreshTitleButtons();
}

/* セーブデータの有無で「つづきから」ボタンの活性を切り替える */
function refreshTitleButtons() {
  const hasSave = localStorage.getItem(SAVE_KEY) !== null;
  el.btnContinue.disabled = !hasSave;
  el.btnContinue.classList.toggle("is-disabled", !hasSave);
}

/* =========================================================================
 * ゲーム開始・再開・タイトルへ戻る
 * ======================================================================= */
function startNewGame() {
  state.sceneId = START_SCENE;
  state.page = 0;
  state.status = { ...INITIAL_STATUS }; // 初期値をコピー
  enterGameScreen();
  renderScene();
}

function continueGame() {
  const saved = loadGame();
  if (!saved) {
    showToast("セーブデータがありません");
    return;
  }
  state.sceneId = saved.sceneId;
  state.page = saved.page;
  state.status = saved.status;
  enterGameScreen();
  renderScene();
}

function goToTitle() {
  el.scene.classList.add("hidden");
  el.titleScreen.classList.remove("hidden");
  refreshTitleButtons();
}

/* タイトル画面 → ゲーム画面の切り替え */
function enterGameScreen() {
  el.titleScreen.classList.add("hidden");
  el.scene.classList.remove("hidden");
}

/* =========================================================================
 * シーン描画
 * ======================================================================= */
function renderScene() {
  const scene = SCENES[state.sceneId];
  if (!scene) {
    console.error("未知のシーンID:", state.sceneId);
    return;
  }

  // エンディング判定用のダミーシーンなら、実エンディングに差し替える
  if (scene.resolveEnding) {
    state.sceneId = decideEnding();
    state.page = 0;
    renderScene();
    return;
  }

  // 背景
  el.screen.className = "screen " + (scene.bg || "bg-home");

  // 章ラベル
  el.dayLabel.textContent = scene.day || "";
  el.dayLabel.style.visibility = scene.day ? "visible" : "hidden";

  // 話者名（無ければ枠ごと隠す）
  if (scene.name) {
    el.speaker.textContent = scene.name;
    el.speaker.classList.remove("hidden");
  } else {
    el.speaker.classList.add("hidden");
  }

  // 本文（text は文字列でも配列でもOK。配列なら page 番目を出す）
  const pages = Array.isArray(scene.text) ? scene.text : [scene.text];
  el.text.textContent = pages[state.page] || "";

  // ステータス表示を更新
  renderStatus();

  // 最終ページかどうかで、選択肢 or 「つぎへ」表示を切り替える
  const isLastPage = state.page >= pages.length - 1;
  if (isLastPage && scene.choices) {
    renderChoices(scene.choices);
    el.nextHint.classList.add("hidden");
  } else if (isLastPage && scene.ending) {
    // エンディング：選択肢の代わりに「タイトルへ」を出す
    renderEndingButtons();
    el.nextHint.classList.add("hidden");
  } else {
    el.choices.innerHTML = "";
    el.nextHint.classList.remove("hidden");
  }
}

/* 選択肢ボタンを並べる */
function renderChoices(choices) {
  el.choices.innerHTML = "";
  choices.forEach((choice) => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = choice.label;
    btn.addEventListener("click", (e) => {
      e.stopPropagation(); // 画面タップ（次へ送り）と二重発火させない
      applyChoice(choice);
    });
    el.choices.appendChild(btn);
  });
}

/* エンディング後のボタン（タイトルへ戻る） */
function renderEndingButtons() {
  el.choices.innerHTML = "";
  const btn = document.createElement("button");
  btn.className = "choice-btn";
  btn.textContent = "タイトルへ戻る";
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    clearSave(); // クリア済みなのでセーブは消す
    goToTitle();
  });
  el.choices.appendChild(btn);
}

/* =========================================================================
 * 入力処理
 * ======================================================================= */
/* 画面タップ／キー押下で「次のページ or 次のシーン」へ進める */
function onScreenTapped() {
  const scene = SCENES[state.sceneId];
  if (!scene) return;

  const pages = Array.isArray(scene.text) ? scene.text : [scene.text];
  const isLastPage = state.page >= pages.length - 1;

  // まだページが残っていれば、次のページへ
  if (!isLastPage) {
    state.page++;
    renderScene();
    return;
  }

  // 最終ページ。選択肢やエンディングがあるなら、タップでは進めない
  if (scene.choices || scene.ending) return;

  // それ以外は next へ自動遷移
  if (scene.next) {
    goToScene(scene.next);
  }
}

/* 選択肢を選んだとき：ステータス変動を適用してから次シーンへ */
function applyChoice(choice) {
  if (choice.effects) {
    for (const key in choice.effects) {
      updateStatus(key, choice.effects[key]);
    }
  }
  goToScene(choice.next);
}

/* シーン遷移の共通処理 */
function goToScene(nextId) {
  state.sceneId = nextId;
  state.page = 0;
  renderScene();
}

/* =========================================================================
 * ステータス
 * ======================================================================= */
/* 1項目を変動させる。0〜100にクランプ。 */
function updateStatus(key, delta) {
  if (!(key in state.status)) return;
  let v = state.status[key] + delta;
  v = Math.max(0, Math.min(100, v)); // 範囲外に出ないよう丸める
  state.status[key] = v;
}

/* ステータスパネルを描画（バー表示） */
function renderStatus() {
  el.statusPanel.innerHTML = "";
  for (const key in STATUS_LABELS) {
    const value = state.status[key] ?? 0;

    const row = document.createElement("div");
    row.className = "status-row";

    const label = document.createElement("span");
    label.className = "status-label";
    label.textContent = STATUS_LABELS[key];

    const barWrap = document.createElement("div");
    barWrap.className = "status-bar-wrap";

    const bar = document.createElement("div");
    // 財産リスク・孤独・疲労は「高いと悪い」ので警告色にする
    const isRisk = key === "loneliness" || key === "money" || key === "fatigue";
    bar.className = "status-bar " + (isRisk ? "bar-risk" : "bar-good");
    bar.style.width = value + "%";

    const num = document.createElement("span");
    num.className = "status-num";
    num.textContent = value;

    barWrap.appendChild(bar);
    row.appendChild(label);
    row.appendChild(barWrap);
    row.appendChild(num);
    el.statusPanel.appendChild(row);
  }
}

/* =========================================================================
 * エンディング分岐
 * -------------------------------------------------------------------------
 * 仕様書の条件をベースに判定する。
 *   BAD (孤独)   … 父孤独度 >= 80
 *   BAD (財産)   … 財産リスク >= 70
 *   TRUE         … 父孤独度 <= 30 かつ 家族信頼度 >= 70
 *   NORMAL       … 上のどれにも当てはまらない
 * ======================================================================= */
function decideEnding() {
  const s = state.status;
  if (s.loneliness >= 80) return "ending_bad_lonely";
  if (s.money >= 70) return "ending_bad_money";
  if (s.loneliness <= 30 && s.trust >= 70) return "ending_true";
  return "ending_normal";
}

/* =========================================================================
 * セーブ / ロード（localStorage）
 * ======================================================================= */
function saveGame() {
  const data = {
    sceneId: state.sceneId,
    page: state.page,
    status: state.status,
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("セーブデータの読み込みに失敗:", e);
    return null;
  }
}

function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}

/* =========================================================================
 * トースト通知（「セーブしました」など、一瞬出て消える表示）
 * ======================================================================= */
let toastTimer = null;
function showToast(message) {
  el.toast.textContent = message;
  el.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.toast.classList.remove("show");
  }, 1600);
}

/* 画面の準備ができたら起動 */
window.addEventListener("DOMContentLoaded", init);
