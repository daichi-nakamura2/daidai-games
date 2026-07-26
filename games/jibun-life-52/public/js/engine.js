/* ==========================================================
 * ゲームエンジン
 * ターン進行・パラメータ計算・イベント抽選・エンディング判定。
 * DOM には一切触らない（描画は ui.js）。
 * ========================================================== */

const TOTAL_TURNS = 52;
const EVENT_REPEAT_COOLDOWN = 10; // 同じイベントを再抽選しない週数

/* ---------- 週ラベル（ゲームは4月スタート） ---------- */

const MONTH_NAMES = ["4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月", "1月", "2月", "3月"];

function weekToLabel(turn) {
  const monthIndex = Math.min(11, Math.floor(((turn - 1) * 12) / TOTAL_TURNS));
  const monthStartTurn = Math.ceil((monthIndex * TOTAL_TURNS) / 12) + 1;
  const weekInMonth = turn - monthStartTurn + 1;
  return `${MONTH_NAMES[monthIndex]} 第${weekInMonth}週`;
}

/* ---------- 給料計算 ---------- */

/** 仕事1週間の収入（万円）＝ 基本給 + スキル + 役職手当 */
function calcSalary(state) {
  return 12 + Math.floor(state.skill / 10) + state.jobLevel * 5;
}

/* ---------- 効果適用 ---------- */

/**
 * effects を state に適用し、実際の変化量を返す。
 * 返り値例: { money: +6, stress: +12 }（UI の表示に使う）
 */
function applyEffects(state, effects) {
  const diffs = {};
  for (const [key, value] of Object.entries(effects)) {
    if (value === 0) continue;
    if (key === "skill") {
      state.skill = Math.max(0, Math.min(100, state.skill + value));
      diffs.skill = value;
    } else if (key === "jobLevel") {
      state.jobLevel = Math.min(3, state.jobLevel + value);
      diffs.jobLevel = value;
    } else if (key in state.stats) {
      state.stats[key] += value;
      diffs[key] = value;
    }
  }
  clampStats(state.stats);
  return diffs;
}

/* ---------- イベント抽選 ---------- */

/** イベントの発生条件を満たしているか */
function meetsCond(ev, state) {
  const c = ev.cond;
  if (!c) return true;
  if (c.minTurn && state.turn < c.minTurn) return false;
  if (c.maxTurn && state.turn > c.maxTurn) return false;
  if (c.minSkill && state.skill < c.minSkill) return false;
  if (c.minJobLevel !== undefined && state.jobLevel < c.minJobLevel) return false;
  if (c.maxJobLevel !== undefined && state.jobLevel > c.maxJobLevel) return false;
  if (c.minWorkCount && state.counts.work < c.minWorkCount) return false;
  if (c.stats) {
    for (const [key, range] of Object.entries(c.stats)) {
      const v = state.stats[key];
      if (range.min !== undefined && v < range.min) return false;
      if (range.max !== undefined && v > range.max) return false;
    }
  }
  if (c.flags) {
    for (const [key, expected] of Object.entries(c.flags)) {
      if (state.flags[key] !== expected) return false;
    }
  }
  return true;
}

/** 最近発生したイベントか（連発防止） */
function firedRecently(state, id) {
  return state.firedEvents.some(
    (f) => f.id === id && state.turn - f.turn < EVENT_REPEAT_COOLDOWN
  );
}

/** 今週のランダムイベントを抽選する（発生しない週は null） */
function pickEvent(state) {
  if (Math.random() > EVENT_CHANCE) return null;

  const candidates = EVENTS.filter(
    (ev) => meetsCond(ev, state) && !firedRecently(state, ev.id)
  );
  if (candidates.length === 0) return null;

  const totalWeight = candidates.reduce((sum, ev) => sum + (ev.weight || 1), 0);
  let roll = Math.random() * totalWeight;
  for (const ev of candidates) {
    roll -= ev.weight || 1;
    if (roll <= 0) return ev;
  }
  return candidates[candidates.length - 1];
}

/* ---------- 強制イベント（限界突破時のペナルティ） ---------- */

/** ストレス・健康・お金の限界チェック。該当すれば疑似イベントを返す */
function checkForcedEvent(state) {
  if (state.stats.stress >= 100) {
    return {
      id: "_burnout",
      emoji: "💥",
      title: "燃え尽きてしまった…",
      text: "ストレスが限界を超えてダウン。何もする気が起きない…。強制的に休養したが、大きな代償を払った。休む勇気も実力のうち。",
      effects: { happiness: -15, health: -10, stress: -40 },
    };
  }
  if (state.stats.health <= 0) {
    return {
      id: "_hospital",
      emoji: "🏥",
      title: "入院してしまった…",
      text: "体を酷使しすぎて倒れ、入院することに。治療費もかさんだ…。健康はすべての土台だと痛感した。",
      effects: { health: 40, money: -15, stress: -20, happiness: -10 },
    };
  }
  if (state.stats.money < 0) {
    return {
      id: "_debt",
      emoji: "💸",
      title: "お金が底をついた！",
      text: "生活費が払えず借金生活に…。不安で夜も眠れない。まずは働いて立て直そう。",
      effects: { stress: 6, happiness: -3 },
    };
  }
  return null;
}

/* ---------- 1ターンの処理 ---------- */

/**
 * 1週間を進める。
 * 返り値: {
 *   action: 選んだ行動, actionDiffs: 行動による変化,
 *   event: 発生イベント（null あり）, eventDiffs: イベントによる変化,
 *   ended: 52週終了したか
 * }
 */
function processTurn(state, actionId) {
  const action = ACTIONS.find((a) => a.id === actionId);
  if (!action || state.gameOver) return null;

  // 1) 行動の効果を適用（仕事は給料を動的計算）
  const effects = { ...action.effects };
  if (action.salary) effects.money = calcSalary(state);
  effects.money = (effects.money || 0) - WEEKLY_LIVING_COST; // 生活費を差し引く
  const actionDiffs = applyEffects(state, effects);
  state.counts[actionId]++;
  addLog(state, `${action.emoji} 「${action.name}」で1週間を過ごした`);

  // 2) イベント処理（限界超過の強制イベントが最優先）
  let event = checkForcedEvent(state);
  let eventDiffs = null;
  if (!event) event = pickEvent(state);

  if (event) {
    eventDiffs = applyEffects(state, event.effects);
    if (event.set) Object.assign(state.flags, event.set);
    state.firedEvents.push({ id: event.id, turn: state.turn });
    const isWarn = event.id.startsWith("_");
    addLog(state, `${event.emoji} ${event.title}`, isWarn ? "warn" : "event");
  }

  // 3) ターンを進める
  const ended = state.turn >= TOTAL_TURNS;
  if (ended) {
    state.gameOver = true;
  } else {
    state.turn++;
  }

  return { action, actionDiffs, event, eventDiffs, ended };
}

/* ---------- エンディング判定 ---------- */

/**
 * 最終結果を計算する。
 * スコア = 幸福度 + 健康 + 人間関係 + (100 - ストレス) + お金(最大100) … 最大500点
 */
function evaluateEnding(state) {
  const s = state.stats;
  const score =
    s.happiness +
    s.health +
    s.relationship +
    (100 - s.stress) +
    Math.max(0, Math.min(100, s.money));

  const ending = ENDINGS.find((e) => e.cond(state));
  const gradeInfo = GRADE_TABLE.find((g) => score >= g.min);

  return { ending, score, grade: gradeInfo.grade, gradeComment: gradeInfo.comment };
}
