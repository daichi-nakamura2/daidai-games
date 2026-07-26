/* ==========================================================
 * UI 描画
 * DOM の描画・更新のみを担当する（ゲームルールは engine.js）。
 * ========================================================== */

const UI = {
  el: {}, // 主要DOM要素のキャッシュ

  init() {
    const ids = [
      "title-screen", "game-screen",
      "btn-start", "btn-continue",
      "week-label", "turn-label", "turn-progress-fill",
      "stats-panel", "badges-row", "log-list", "actions-grid",
      "event-modal", "event-emoji", "event-title", "event-text", "event-effects", "btn-event-ok",
      "ending-modal", "ending-emoji", "ending-grade", "ending-title", "ending-text", "ending-stats", "btn-restart",
    ];
    for (const id of ids) {
      this.el[id] = document.getElementById(id);
    }
  },

  /* ---------- 画面切り替え ---------- */

  showTitle(hasSave) {
    this.el["title-screen"].classList.remove("hidden");
    this.el["game-screen"].classList.add("hidden");
    this.el["btn-continue"].classList.toggle("hidden", !hasSave);
  },

  showGame() {
    this.el["title-screen"].classList.add("hidden");
    this.el["game-screen"].classList.remove("hidden");
  },

  /* ---------- 描画（毎ターン） ---------- */

  render(state) {
    this.renderHeader(state);
    this.renderStats(state);
    this.renderBadges(state);
    this.renderLog(state);
    this.renderActions(state);
  },

  renderHeader(state) {
    this.el["week-label"].textContent = weekToLabel(state.turn);
    this.el["turn-label"].textContent = `WEEK ${state.turn} / ${TOTAL_TURNS}`;
    const pct = ((state.turn - 1) / TOTAL_TURNS) * 100;
    this.el["turn-progress-fill"].style.width = `${pct}%`;
  },

  renderStats(state) {
    const panel = this.el["stats-panel"];
    panel.innerHTML = "";

    for (const def of STAT_DEFS) {
      const value = state.stats[def.key];
      // ストレスは高いほど危険、それ以外は低いほど危険な色にする
      const dangerous = def.isBad ? value >= 70 : value <= 25;
      const item = document.createElement("div");
      item.className = "stat-item";
      item.innerHTML = `
        <div class="stat-head">
          <span>${def.emoji} ${def.name}</span>
          <span class="stat-value">${value}</span>
        </div>
        <div class="stat-bar">
          <div class="stat-bar-fill" style="width:${value}%; background:${dangerous ? "var(--danger)" : def.color}"></div>
        </div>`;
      panel.appendChild(item);
    }

    // お金は上限がないので数値表示
    const money = state.stats.money;
    const moneyItem = document.createElement("div");
    moneyItem.className = "stat-item money-item";
    moneyItem.innerHTML = `
      <div class="stat-head"><span>💰 お金</span></div>
      <div class="money-value ${money < 0 ? "debt" : ""}">${money} 万円</div>`;
    panel.appendChild(moneyItem);
  },

  renderBadges(state) {
    const row = this.el["badges-row"];
    row.innerHTML = "";
    const badges = [];

    const jobTitles = ["", "🎖 主任", "🎖 課長", "🎖 部長"];
    if (state.jobLevel > 0) badges.push(jobTitles[state.jobLevel]);
    if (state.flags.hasPartner) badges.push("💕 恋人あり");
    if (state.flags.hasPet) badges.push("🐈 ペット");
    if (state.skill >= 20) badges.push(`📚 スキル ${state.skill}`);

    for (const text of badges) {
      const span = document.createElement("span");
      span.className = "badge";
      span.textContent = text;
      row.appendChild(span);
    }
  },

  renderLog(state) {
    const list = this.el["log-list"];
    list.innerHTML = "";
    if (state.log.length === 0) {
      const empty = document.createElement("div");
      empty.className = "log-entry";
      empty.textContent = "新しい1年が始まった。今週から行動を選ぼう！";
      list.appendChild(empty);
      return;
    }
    for (const entry of state.log) {
      const div = document.createElement("div");
      div.className = "log-entry" + (entry.type === "event" ? " log-event" : entry.type === "warn" ? " log-warn" : "");
      div.innerHTML = `<span class="log-week">W${entry.week}</span>${escapeHtml(entry.text)}`;
      list.appendChild(div);
    }
  },

  renderActions(state) {
    const grid = this.el["actions-grid"];
    grid.innerHTML = "";
    for (const action of ACTIONS) {
      const btn = document.createElement("button");
      btn.className = "action-card";
      btn.dataset.actionId = action.id;
      const salaryNote = action.salary ? `（今の給料: +${calcSalary(state)}万円）` : "";
      btn.innerHTML = `
        <div class="action-emoji">${action.emoji}</div>
        <div class="action-name">${action.name}</div>
        <div class="action-desc">${action.desc}${salaryNote}</div>`;
      grid.appendChild(btn);
    }
  },

  /* ---------- 効果チップ ---------- */

  effectChips(diffs) {
    if (!diffs) return "";
    const labels = {
      happiness: "😊幸福度", stress: "🌀ストレス", health: "💪健康",
      money: "💰お金", relationship: "🤝人間関係", skill: "📚スキル", jobLevel: "🎖役職",
    };
    return Object.entries(diffs)
      .map(([key, v]) => {
        // ストレスは増えると悪いので色を反転
        const isGood = key === "stress" ? v < 0 : v > 0;
        const sign = v > 0 ? "+" : "";
        return `<span class="effect-chip ${isGood ? "up" : "down"}">${labels[key]} ${sign}${v}</span>`;
      })
      .join("");
  },

  /* ---------- モーダル ---------- */

  showEventModal(event, diffs, onClose) {
    this.el["event-emoji"].textContent = event.emoji;
    this.el["event-title"].textContent = event.title;
    this.el["event-text"].textContent = event.text;
    this.el["event-effects"].innerHTML = this.effectChips(diffs);
    this.el["event-modal"].classList.remove("hidden");
    this.el["btn-event-ok"].onclick = () => {
      this.el["event-modal"].classList.add("hidden");
      onClose();
    };
  },

  showEnding(state, result) {
    const { ending, score, grade, gradeComment } = result;
    this.el["ending-emoji"].textContent = ending.emoji;
    this.el["ending-grade"].textContent = grade;
    this.el["ending-title"].textContent = ending.title;
    this.el["ending-text"].textContent = ending.text;

    const s = state.stats;
    const rows = [
      ["😊 幸福度", s.happiness],
      ["🌀 ストレス", s.stress],
      ["💪 健康", s.health],
      ["🤝 人間関係", s.relationship],
      ["💰 お金", `${s.money} 万円`],
      ["📚 スキル", state.skill],
      ["🏆 総合スコア", `${score} / 500（${gradeComment}）`],
    ];
    this.el["ending-stats"].innerHTML = rows
      .map(([label, value]) => `<div class="row"><span>${label}</span><strong>${value}</strong></div>`)
      .join("");

    this.el["ending-modal"].classList.remove("hidden");
  },

  hideEnding() {
    this.el["ending-modal"].classList.add("hidden");
  },
};

/** XSS対策：ログ文字列のエスケープ */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
