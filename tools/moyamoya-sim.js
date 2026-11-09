/* ============================================================
 * モヤモヤ退治100 — バランス確認用シミュレーター（開発用）
 *
 *   使い方:  node tools/moyamoya-sim.js [試行回数]
 *
 *   本物の engine.js を画面なしで回して、到達ステージと踏破率を出す。
 *     careful … 特効と守りを考えて打つ人
 *     casual  … いちばん数字が大きいカードから打つ人
 *     random  … ルールが分からずに適当に打つ人
 *   カードの数値や敵を変えたら必ず回す。
 *   目安: careful 80%前後 / casual 50%前後（読者向けにやさしめ。途中で詰まらず、負けるならボス）
 * ============================================================ */
const path = require("path");
const E = require(path.join(__dirname, "..", "games", "moyamoya-100", "public", "engine.js"));
const { CARDS } = require(path.join(__dirname, "..", "games", "moyamoya-100", "public", "cards.js"));

const N = +process.argv[2] || 1000;
// 調整用: node tools/moyamoya-sim.js 500 foeHp=1.4,foeAtk=2
if (process.argv[3]) process.argv[3].split(",").forEach((kv) => { const [k, v] = kv.split("="); E.TUNE[k] = +v; });
const MOODS = E.FOE_KEYS;

function incoming(run) {
  const foe = run.b.foe;
  const m = foe.intent;
  if (foe.stun > 0 || m.t !== "atk") return 0;
  return Math.max(0, m.n + foe.atkBuff + foe.atkAdd + E.enrageOf(run.b) - foe.weakPerm - foe.weakNext) * m.hits;
}

const scorers = {
  careful(run, p) {
    const b = run.b;
    const inc = incoming(run);
    const lost = run.maxHp - run.hp;
    let s = 0;
    s += p.dmg * 1.2 + p.dot * 3;
    s += Math.min(p.heal, lost) * (run.hp < run.maxHp * 0.5 ? 1.6 : 0.5);
    s += Math.min(p.guard, Math.max(0, inc - b.guard)) * 1.2;
    const fx = p.fx;
    if (fx.draw) s += fx.draw * 3;
    if (fx.nextBoost) s += b.hand.length > 2 ? 10 : 0;
    if (fx.gainNow) s += 12;
    if (fx.ward) s += inc * 0.8;
    if (fx.weakPerm) s += 8;
    if (fx.allWeak) s += 25;
    if (fx.stun) s += inc;
    if (fx.delay) s += fx.delay.dmg * 0.8;
    if (fx.randDmg) s += (fx.randDmg[0] + fx.randDmg[1]) / 2;
    if (fx.gamble) s += 9;
    if (fx.regenGuard) s += 12;
    if (p.c.junk) s = b.energy > 1 ? 0.5 : 0;
    if (fx.endTurn) s = run.hp < run.maxHp * 0.4 ? 40 : -1;
    return s / Math.max(0.6, p.cost);
  },
  casual(run, p) {
    if (p.c.junk) return 0; // 他に打てるものが無ければ手放す
    if (p.fx.endTurn) return -1;
    return p.dmg + p.heal * 0.3 + p.guard * 0.3 + p.dot * 2 + (p.fx.draw ? 2 : 0) + 0.5;
  },
  random(run) {
    return run.rng();
  },
};

function playBattle(run, kind) {
  E.startBattle(run);
  const b = run.b;
  let guard = 0;
  while (!b.over && guard++ < 500) {
    let safety = 0;
    while (!b.over && safety++ < 40) {
      const opts = b.hand.filter((x) => E.canPlay(run, x)).map((x) => E.preview(run, x))
        .map((p) => ({ p, s: scorers[kind](run, p) })).filter((o) => o.s >= 0);
      if (!opts.length) break;
      opts.sort((x, y) => y.s - x.s);
      if (!E.play(run, opts[0].p.card.id)) break;
      if (b.turn > 200) break;
    }
    if (!b.over) E.endTurn(run);
  }
  return b.over;
}

function draftValue(c) {
  const fx = E.fxOf(c);
  const cost = E.costOf(c);
  return ((fx.dmg || 0) + (fx.heal || 0) * 0.6 + (fx.guard || 0) * 0.5 + (fx.dot || 0) * 3 + (fx.draw || 0) * 3 + (fx.txt ? 4 : 0)) / Math.max(1, cost);
}

function simRun(kind, mood) {
  const run = E.newRun(mood, {});
  const stats = { turns: 0 };
  while (run.stage < E.STAGES.length) {
    const r = playBattle(run, kind);
    stats.turns += run.b.turn;
    if (r !== "win") return { reached: run.stage, won: false, turns: stats.turns, hp: run.hp };
    E.afterWin(run);
    if (E.STAGES[run.stage].rest) E.restHeal(run);
    if (!E.STAGES[run.stage].boss) {
      const of = E.offers(run, {}, 3);
      const pickC = kind === "random" ? of[Math.floor(Math.random() * of.length)] : of.slice().sort((x, y) => draftValue(y) - draftValue(x))[0];
      E.addCard(run, pickC.no);
    }
    E.advance(run);
  }
  return { reached: E.STAGES.length, won: true, turns: stats.turns, hp: run.hp };
}

for (const kind of ["careful", "casual", "random"]) {
  let wins = 0, turns = 0, winHp = 0;
  const reach = new Array(E.STAGES.length + 1).fill(0);
  for (let i = 0; i < N; i++) {
    const r = simRun(kind, MOODS[i % MOODS.length]);
    if (r.won) { wins++; winHp += r.hp; }
    turns += r.turns;
    reach[r.reached]++;
  }
  console.log(`${kind.padEnd(8)} 踏破 ${(wins / N * 100).toFixed(1)}%  平均ターン ${(turns / N).toFixed(1)}  勝利時ココロ ${(winHp / Math.max(1, wins)).toFixed(1)}  止まった場所 ${reach.map((n) => Math.round(n / N * 100)).join(" / ")}`);
}

// 気分ごとの踏破率
const perMood = MOODS.map((m) => {
  let w = 0;
  const K = Math.ceil(N / 3);
  for (let i = 0; i < K; i++) if (simRun("casual", m).won) w++;
  return `${E.FOES[m].name} ${Math.round(w / K * 100)}%`;
});
console.log("casual 気分別:", perMood.join("  "));

// データの健全性
const tagCount = {};
CARDS.forEach((c) => c.tags.forEach((t) => (tagCount[t] = (tagCount[t] || 0) + 1)));
const costCount = { 0: 0, 1: 0, 2: 0, 3: 0 };
CARDS.forEach((c) => costCount[E.costOf(c)]++);
console.log("カード枚数", CARDS.length, "/ 特効タグ", JSON.stringify(tagCount), "/ コスト", JSON.stringify(costCount));
