/* ==========================================================
 * エントリーポイント
 * 画面遷移とユーザー操作をエンジン・UIに橋渡しする。
 * ========================================================== */

(function () {
  let state = null;
  let busy = false; // モーダル表示中の多重クリック防止

  function startNewGame() {
    clearSave();
    state = createInitialState();
    UI.showGame();
    UI.render(state);
  }

  function continueGame(saved) {
    state = saved;
    UI.showGame();
    UI.render(state);
  }

  /** 行動選択 → 1ターン進行 */
  function handleAction(actionId) {
    if (busy || !state || state.gameOver && state.turn < TOTAL_TURNS) return;
    busy = true;

    const result = processTurn(state, actionId);
    if (!result) {
      busy = false;
      return;
    }

    saveGame(state);
    UI.render(state);

    const finish = () => {
      busy = false;
      if (result.ended) {
        clearSave();
        UI.showEnding(state, evaluateEnding(state));
      }
    };

    // イベントがあればモーダルで見せてから次へ
    if (result.event) {
      UI.showEventModal(result.event, result.eventDiffs, finish);
    } else {
      finish();
    }
  }

  function init() {
    UI.init();

    // タイトル画面
    UI.el["btn-start"].addEventListener("click", startNewGame);
    const saved = loadGame();
    UI.el["btn-continue"].addEventListener("click", () => {
      const current = loadGame();
      if (current) continueGame(current);
      else startNewGame();
    });
    UI.showTitle(!!saved);

    // 行動カード（イベント委譲）
    UI.el["actions-grid"].addEventListener("click", (e) => {
      const card = e.target.closest(".action-card");
      if (card) handleAction(card.dataset.actionId);
    });

    // エンディング → もう一度
    UI.el["btn-restart"].addEventListener("click", () => {
      UI.hideEnding();
      startNewGame();
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
