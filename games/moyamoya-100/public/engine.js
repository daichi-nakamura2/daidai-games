/* ============================================================
 * モヤモヤ退治100 — ゲームのルール本体（画面に依存しない）
 * ブラウザでも tools/moyamoya-sim.js（Node）でも同じコードが動く。
 * ============================================================ */
(function (root) {
  const DATA = typeof module !== "undefined" && module.exports ? require("./cards.js") : root.MOYA_DATA;
  const { CARDS, JUNK } = DATA;
  const byNo = {};
  CARDS.forEach((c) => (byNo[c.no] = c));
  byNo[0] = JUNK;

  /* ---------- 調整用の数値 ---------- */
  const TUNE = {
    startHp: 44,
    handSize: 5,
    handMax: 9,
    energyStart: 3,
    weakMul: 2,         // 特効の倍率
    restAfterWin: 0.12, // 勝利ごとの回復（最大ココロに対する割合）
    restHeal: 0.4,      // ひと休みの回復
    flees: 2,           // 冒険ごとの「にげる」回数
    hpPerStage: 0.36,
    atkPerStage: 0.55,
    doneBonus: 1,       // 現実で「やってみた」カードの強化
    foeHp: 1.7,         // 敵HPの全体倍率
    enrageFrom: 4,      // このターンを超えると、1ターンごとに敵の攻撃+1（長引くほど濃くなる）
    foeAtk: 2,          // 敵の攻撃の全体加算
    bossHp: 110,         // ボス1段階あたりのHP
  };

  // 分類ごとの基本効果 [cost 1, cost 2, cost 3]
  const BASE = {
    想像: [{ dmg: 3, draw: 1 }, { dmg: 6, draw: 1 }, { dmg: 10, draw: 2 }],
    没頭: [{ dmg: 4, zone: 2 }, { dmg: 8, zone: 2 }, { dmg: 13, zone: 3 }],
    創作: [{ dmg: 2, dot: 1 }, { dmg: 3, dot: 2 }, { dmg: 5, dot: 4 }],
    運動: [{ dmg: 6, self: 1 }, { dmg: 12, self: 2 }, { dmg: 20, self: 3 }],
    癒し: [{ dmg: 1, heal: 3, guard: 2 }, { dmg: 2, heal: 5, guard: 4 }, { dmg: 3, heal: 9, guard: 7 }],
    社会: [{ dmg: 3, guard: 2, perCat: 2 }, { dmg: 6, guard: 3, perCat: 3 }, { dmg: 9, guard: 6, perCat: 5 }],
  };

  function costOf(c) {
    if (c.junk) return 1;
    if (c.mod && c.mod.fx && typeof c.mod.fx.cost === "number") return c.mod.fx.cost;
    if (c.ease <= 1) return 1;
    if (c.ease <= 3) return 2;
    return 3;
  }

  function fxOf(c) {
    if (c.junk) return { exhaust: true, txt: "何も起きない。使うと手放せる" };
    if (c.mod && c.mod.fx) return c.mod.fx;
    const base = Object.assign({}, BASE[c.cat][costOf(c) - 1]);
    // お手軽度3はコスト2の中でちょっと強い
    if (c.ease === 3 && base.dmg) base.dmg += 1;
    if (c.ease === 5 && base.dmg) base.dmg += 2;
    if (c.mod && c.mod.plus) {
      for (const k in c.mod.plus) base[k] = c.mod.plus[k];
    }
    return base;
  }

  /* ---------- 敵 ---------- */
  const a = (n, hits) => ({ t: "atk", n, hits: hits || 1 });
  const FOES = {
    taikutsu: { key: "taikutsu", name: "タイクツン", label: "退屈・マンネリ", hp: 26, say: "ふわぁ……なーんにも、おもしろくないねぇ", pattern: [a(4), { t: "grow", n: 5 }, a(5)] },
    guruguru: { key: "guruguru", name: "グルグル", label: "考えすぎ・反すう", hp: 22, say: "あのとき、ああ言えばよかったよね？ ね？", pattern: [a(2, 2), { t: "buff", n: 1 }, a(2, 3)] },
    fuan:     { key: "fuan", name: "ザワザワ", label: "不安・落ち着かない", hp: 22, say: "このまま、だいじょうぶなのかな……？", hidden: true, pattern: [a(7), { t: "drain", n: 1 }, a(3, 2)] },
    jihi:     { key: "jihi", name: "ダメダシ", label: "自己否定・自信がない", hp: 24, say: "どうせ、また失敗するんじゃない？", pattern: [a(4), { t: "junk", n: 2 }, a(5)] },
    kodoku:   { key: "kodoku", name: "ポツン", label: "孤独", hp: 20, say: "だれも、わかってくれない……", pattern: [{ t: "shield", n: 9 }, a(6), a(4)] },
    tsukare:  { key: "tsukare", name: "クタクタ", label: "疲れ・限界", hp: 26, say: "もう、なにもしたくない……", pattern: [{ t: "drain", n: 1 }, a(6), a(4)] },
    ikari:    { key: "ikari", name: "ドッカン", label: "イライラ・感情の高ぶり", hp: 24, say: "ゆるせない！ ゆるせない！！", pattern: [a(2), { t: "charge", n: 0 }, a(14)] },
    muki:     { key: "muki", name: "ドンヨリ", label: "無気力・落ち込み", hp: 26, say: "やっても、意味ないよ……", pattern: [{ t: "dampen", n: 2 }, a(5), a(4)] },
    nige:     { key: "nige", name: "カベッチ", label: "逃げ出したい現実", hp: 34, say: "ここからは、通さないぞ", pattern: [a(6), a(5), { t: "shield", n: 8 }] },
  };
  const FOE_KEYS = Object.keys(FOES);

  const BOSS = { key: "boss", name: "オオモヤ", label: "からまった生きづらさ" };

  // 冒険の7つの舞台（本の章立て＝想像→没頭→創作→運動→癒し→社会 の順に外へ出ていく）
  const STAGES = [
    { name: "ふとんの中", sub: "想像の章", cat: "想像", sky: 0 },
    { name: "自分の部屋", sub: "没頭の章", cat: "没頭", sky: 1 },
    { name: "作業机のそば", sub: "創作の章", cat: "創作", sky: 2 },
    { name: "外の道", sub: "運動の章", cat: "運動", sky: 3, rest: true },
    { name: "湯けむりの里", sub: "癒しの章", cat: "癒し", sky: 4 },
    { name: "人の輪", sub: "社会の章", cat: "社会", sky: 5, rest: true },
    { name: "夜明け前", sub: "最後のモヤモヤ", cat: null, sky: 6, boss: true },
  ];

  /* ---------- 小道具 ---------- */
  function shuffle(arr, rng) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  const pick = (arr, rng) => arr[Math.floor(rng() * arr.length)];
  let uid = 1;
  const inst = (no) => ({ id: uid++, no });

  /* ---------- 冒険の開始 ---------- */
  function newRun(mood, opts) {
    opts = opts || {};
    const rng = opts.rng || Math.random;
    const done = opts.done || {};
    const moodCards = CARDS.filter((c) => c.tags.includes(mood) && costOf(c) === 1 && !(c.mod && c.mod.fx && c.mod.fx.endTurn));
    shuffle(moodCards, rng);
    const starter = [1, 5, 25, 84, 76, 61];
    const nos = starter.slice();
    for (const c of moodCards) {
      if (nos.length >= 9) break;
      if (!nos.includes(c.no)) nos.push(c.no);
    }
    const run = {
      mood, rng, done,
      hp: TUNE.startHp, maxHp: TUNE.startHp,
      energyMax: TUNE.energyStart,
      deck: nos.map(inst),
      stage: 0,
      flees: TUNE.flees,
      grow: {},
      used: {},
      won: false,
      log: [],
    };
    return run;
  }

  function makeFoe(run) {
    const st = STAGES[run.stage];
    const hpMul = 1 + run.stage * TUNE.hpPerStage;
    const atkAdd = Math.floor(run.stage * TUNE.atkPerStage) + TUNE.foeAtk;
    let key;
    if (st.boss) {
      const others = shuffle(FOE_KEYS.filter((k) => k !== run.mood), run.rng).slice(0, 2);
      const phases = [others[0], others[1], run.mood]; // 最後は「きょうのモヤモヤ」
      return {
        boss: true, phases, phase: 0,
        key: "boss", name: BOSS.name, label: FOES[phases[0]].label, tags: [phases[0]],
        hp: TUNE.bossHp, maxHp: TUNE.bossHp, shield: 0, atkBuff: 0, weakPerm: 0, weakNext: 0, stun: 0,
        pattern: FOES[phases[0]].pattern, hidden: false, step: 0, charged: false, atkAdd: 4 + TUNE.foeAtk,
        say: "ぜんぶ、からまって、ほどけないでしょ？",
      };
    }
    if (run.stage === 0) key = run.mood;
    else {
      const used = run.foesSeen || [];
      key = pick(FOE_KEYS.filter((k) => !used.includes(k)), run.rng) || pick(FOE_KEYS, run.rng);
    }
    run.foesSeen = (run.foesSeen || []).concat(key);
    const f = FOES[key];
    const hp = Math.round(f.hp * hpMul * TUNE.foeHp);
    return {
      key, name: f.name, label: f.label, tags: [key], hp, maxHp: hp, shield: 0,
      atkBuff: 0, weakPerm: 0, weakNext: 0, stun: 0, pattern: f.pattern, hidden: !!f.hidden,
      step: run.rng() < 0.5 && f.hidden ? 1 : 0, charged: false, atkAdd, say: f.say,
    };
  }

  function startBattle(run) {
    const b = {
      foe: makeFoe(run),
      draw: shuffle(run.deck.map((x) => x), run.rng),
      hand: [], discard: [], gone: [],
      energy: 0, guard: 0, ward: 0, fullGuard: false,
      regenGuard: 0, dot: 0, dotGrow: 0, delays: [],
      zoneCount: 0, catsUsed: {}, nextBoost: 0, allWeak: false,
      gainNext: 0, drainNext: 0, dampen: 0, dampenNext: 0, healNext: 0,
      turn: 0, over: null, ev: [],
    };
    run.b = b;
    beginTurn(run);
    return b;
  }

  function drawCards(run, n) {
    const b = run.b;
    for (let i = 0; i < n; i++) {
      if (b.hand.length >= TUNE.handMax) return;
      if (!b.draw.length) {
        if (!b.discard.length) return;
        b.draw = shuffle(b.discard, run.rng);
        b.discard = [];
      }
      b.hand.push(b.draw.pop());
    }
  }

  function beginTurn(run) {
    const b = run.b;
    b.turn++;
    b.guard = b.regenGuard;
    b.fullGuard = false;
    b.zoneCount = 0;
    b.catsUsed = {};
    b.energy = Math.max(0, run.energyMax + b.gainNext - b.drainNext);
    b.gainNext = 0;
    b.drainNext = 0;
    b.dampen = b.dampenNext;
    b.dampenNext = 0;
    if (b.healNext) {
      heal(run, b.healNext);
      b.healNext = 0;
    }
    drawCards(run, TUNE.handSize);
    prepareIntent(run);
  }

  function heal(run, n) {
    const before = run.hp;
    run.hp = Math.min(run.maxHp, run.hp + n);
    if (run.hp > before) run.b.ev.push({ type: "heal", n: run.hp - before });
  }

  /* ---------- 敵の次の行動 ---------- */
  function currentMove(foe) {
    return foe.pattern[foe.step % foe.pattern.length];
  }

  function prepareIntent(run) {
    const foe = run.b.foe;
    foe.intent = currentMove(foe);
  }

  // 長引いて濃くなった分。ボスは段階が変わるとリセットされる
  function enrageOf(b) {
    return Math.max(0, b.turn - (b.turnBase || 0) - TUNE.enrageFrom);
  }

  function atkValue(run, m) {
    const b = run.b, foe = b.foe;
    return Math.max(0, m.n + foe.atkBuff + foe.atkAdd + enrageOf(b) - foe.weakPerm);
  }

  // 画面に出す「次の行動」
  function intentText(run) {
    const foe = run.b.foe;
    if (foe.stun > 0) return { icon: "💫", text: "固まっている", hidden: false };
    if (foe.hidden) return { icon: "❓", text: "なにをするか分からない", hidden: true };
    const m = foe.intent;
    if (m.t === "atk") {
      const n = Math.max(0, atkValue(run, m) - foe.weakNext);
      return { icon: "🗯️", text: m.hits > 1 ? `攻撃 ${n}×${m.hits}` : `攻撃 ${n}`, dmg: n * m.hits };
    }
    return {
      grow: { icon: "🎈", text: "ふくらむ" },
      buff: { icon: "💢", text: "強くなる" },
      junk: { icon: "🗯️", text: `ダメ出しを${m.n}枚入れてくる` },
      drain: { icon: "🪫", text: "次のターンの元気を奪う" },
      shield: { icon: "🧱", text: "殻にこもる" },
      dampen: { icon: "🌫️", text: "次のターンの力を弱める" },
      charge: { icon: "🌋", text: "力をためている…" },
    }[m.t];
  }

  /* ---------- カードの効果計算 ---------- */
  function isWeak(run, c) {
    const b = run.b;
    if (c.junk) return false;
    if (c.no === 100) return true;
    return b.allWeak || c.tags.some((t) => b.foe.tags.includes(t));
  }

  function distinctDeckCats(run) {
    const set = {};
    run.deck.forEach((x) => { const c = byNo[x.no]; if (c.cat) set[c.cat] = 1; });
    return Object.keys(set).length;
  }

  // 使ったらどうなるかを、今の状況で計算する（手札の表示にもそのまま使う）
  function preview(run, card) {
    const b = run.b;
    const c = byNo[card.no];
    const fx = fxOf(c);
    const weak = isWeak(run, c);
    const doneBonus = run.done[c.no] ? TUNE.doneBonus : 0;
    const grown = run.grow[c.no] || 0;

    let dmg = fx.dmg || 0;
    let healN = fx.heal || 0;
    let guard = fx.guard || 0;
    let dot = fx.dot || 0;

    if (fx.zone) dmg += fx.zone * b.zoneCount;
    if (fx.perCat) {
      const others = Object.keys(b.catsUsed).filter((k) => k !== c.cat).length;
      dmg += fx.perCat * others;
    }
    if (fx.lowHpDouble && run.hp * 2 <= run.maxHp) dmg *= 2;
    if (fx.lostHpDiv) dmg += Math.floor((run.maxHp - run.hp) / fx.lostHpDiv);
    if (fx.deckDiv) dmg += Math.floor(run.deck.length / fx.deckDiv);
    if (fx.catDeck) dmg += fx.catDeck * distinctDeckCats(run);
    if (fx.junkDmg) {
      const hasJunk = b.hand.concat(b.draw, b.discard).some((x) => x.no === 0);
      if (hasJunk) dmg += fx.junkDmg;
    }
    if (fx.pct) dmg += Math.ceil((b.foe.hp * fx.pct) / 100);

    if (c.no === 88) healN += grown;
    else if (fx.dmg !== undefined || fx.zone) dmg += grown;

    if (doneBonus) {
      if (dmg > 0) dmg += doneBonus;
      else if (healN > 0) healN += doneBonus;
      else if (guard > 0) guard += doneBonus;
    }

    if (dmg > 0) dmg = Math.max(0, dmg - b.dampen);

    const applyMul = (m) => {
      dmg = Math.ceil(dmg * m);
      healN = Math.ceil(healN * m);
      guard = Math.ceil(guard * m);
      dot = Math.ceil(dot * m);
    };
    if (weak) applyMul(TUNE.weakMul);
    if (b.nextBoost > 0 && !c.junk && !fx.nextBoost) applyMul(2);

    return { card, c, fx, weak, dmg, heal: healN, guard, dot, cost: costOf(c), done: !!doneBonus };
  }

  function canPlay(run, card) {
    return !run.b.over && run.b.energy >= costOf(byNo[card.no]);
  }

  /* ---------- カードを使う ---------- */
  function hitFoe(run, n, kind) {
    const b = run.b, foe = b.foe;
    if (n <= 0) return 0;
    let left = n;
    if (foe.shield > 0) {
      const s = Math.min(foe.shield, left);
      foe.shield -= s;
      left -= s;
    }
    foe.hp = Math.max(0, foe.hp - left);
    b.ev.push({ type: "foeHit", n, kind: kind || "card" });
    checkFoe(run);
    return n;
  }

  function checkFoe(run) {
    const b = run.b, foe = b.foe;
    if (foe.hp > 0) return;
    if (foe.boss && foe.phase < foe.phases.length - 1) {
      foe.phase++;
      const key = foe.phases[foe.phase];
      const def = FOES[key];
      foe.hp = foe.maxHp = TUNE.bossHp + foe.phase * 10;
      foe.tags = [key];
      foe.label = def.label;
      foe.pattern = def.pattern;
      foe.step = 0;
      foe.shield = 0;
      foe.charged = false;
      foe.atkBuff = 0;
      foe.hidden = false;
      foe.intent = currentMove(foe);
      b.turnBase = b.turn;
      b.ev.push({ type: "phase", name: def.name, label: def.label, key });
      return;
    }
    b.over = "win";
  }

  function cleanseJunk(b, limit) {
    let removed = 0;
    for (const pile of ["hand", "draw", "discard"]) {
      b[pile] = b[pile].filter((x) => {
        if (x.no === 0 && removed < limit) { removed++; b.gone.push(x); return false; }
        return true;
      });
    }
    return removed;
  }

  function play(run, cardId) {
    const b = run.b;
    const idx = b.hand.findIndex((x) => x.id === cardId);
    if (idx < 0 || b.over) return false;
    const card = b.hand[idx];
    if (!canPlay(run, card)) return false;
    const p = preview(run, card);
    const { c, fx } = p;

    b.energy -= p.cost;
    b.hand.splice(idx, 1);
    b.ev.push({ type: "play", no: c.no, weak: p.weak });
    if (!c.junk) run.used[c.no] = (run.used[c.no] || 0) + 1;

    // 効果
    if (fx.self) {
      run.hp = Math.max(1, run.hp - fx.self); // 自分の疲れでは倒れない
      b.ev.push({ type: "self", n: fx.self });
    }
    if (fx.randDmg) {
      const [lo, hi] = fx.randDmg;
      let n = lo + Math.floor(run.rng() * (hi - lo + 1));
      if (p.weak) n = Math.ceil(n * TUNE.weakMul);
      if (b.nextBoost > 0) n *= 2;
      b.ev.push({ type: "note", text: n >= hi ? "大成功！" : n <= lo + 4 ? "失敗も、経験！" : "なかなかの味！" });
      hitFoe(run, n);
    }
    if (fx.gamble) {
      const win = run.rng() < 0.55;
      const mul = (p.weak ? TUNE.weakMul : 1) * (b.nextBoost > 0 ? 2 : 1);
      if (win) {
        b.ev.push({ type: "note", text: "ウケた！" });
        hitFoe(run, Math.ceil(fx.gamble.win * mul));
      } else {
        b.ev.push({ type: "note", text: "スベった…でも笑える" });
        hitFoe(run, fx.gamble.lose);
        heal(run, Math.ceil(fx.gamble.heal * mul));
      }
    }
    if (p.dmg > 0) hitFoe(run, p.dmg);
    if (fx.junkDmg && p.dmg > 0) cleanseJunk(b, 1);
    if (p.heal > 0) heal(run, p.heal);
    if (p.guard > 0) { b.guard += p.guard; b.ev.push({ type: "guard", n: p.guard }); }
    if (p.dot > 0) { b.dot += p.dot; b.ev.push({ type: "dot", n: p.dot }); }
    if (fx.dotGrow) b.dotGrow += fx.dotGrow;
    if (fx.regenGuard) { b.regenGuard += fx.regenGuard; b.ev.push({ type: "note", text: "聖地ができた" }); }
    if (fx.ward) { b.ward += fx.ward; b.ev.push({ type: "note", text: "守られている気がする" }); }
    if (fx.weakNext) b.foe.weakNext += fx.weakNext;
    if (fx.weakPerm) b.foe.weakPerm += fx.weakPerm;
    if (fx.rename) {
      if (!b.foe.renamed) { b.foe.nick = NICK[b.foe.key] || "モヤちゃん"; b.foe.renamed = true; }
      b.ev.push({ type: "note", text: `名前は「${b.foe.nick}」に決めた` });
    }
    if (fx.stun) b.foe.stun = fx.stun;
    if (fx.gainNow) b.energy += fx.gainNow;
    if (fx.gainNext) b.gainNext += fx.gainNext;
    if (fx.healNext) b.healNext += fx.healNext;
    if (fx.allWeak) { b.allWeak = true; b.ev.push({ type: "note", text: "弱点、見つけた！" }); }
    if (fx.fullGuard) b.fullGuard = true;
    if (fx.delay) b.delays.push({ turns: fx.delay.turns, dmg: Math.ceil(fx.delay.dmg * (p.weak ? TUNE.weakMul : 1)) });
    if (fx.purge) { b.foe.atkBuff = 0; b.foe.shield = 0; b.foe.charged = false; b.ev.push({ type: "note", text: "スマホ、置いた" }); }
    if (fx.cleanseJunk) cleanseJunk(b, 99);
    if (fx.cleanseOne) cleanseJunk(b, 1);
    if (fx.grow) run.grow[c.no] = (run.grow[c.no] || 0) + fx.grow;
    if (fx.draw) drawCards(run, fx.draw);
    if (fx.recall && b.discard.length) {
      const best = b.discard.filter((x) => x.no !== 0).sort((x, y) => costOf(byNo[y.no]) - costOf(byNo[x.no]))[0];
      if (best) { b.discard.splice(b.discard.indexOf(best), 1); b.hand.push(best); }
    }
    if (fx.rerollHand) {
      const n = b.hand.length;
      b.discard.push(...b.hand);
      b.hand = [];
      drawCards(run, Math.max(n, 4));
    }

    // 連鎖まわりの状態更新
    if (c.cat === "没頭") b.zoneCount++;
    if (c.cat) b.catsUsed[c.cat] = 1;
    if (b.nextBoost > 0 && !fx.nextBoost && !c.junk) b.nextBoost--;
    if (fx.nextBoost) b.nextBoost += fx.nextBoost;

    if (fx.exhaust) b.gone.push(card);
    else b.discard.push(card);

    if (fx.endTurn && !b.over) endTurn(run);
    return true;
  }

  const NICK = {
    taikutsu: "ヒマ太郎", guruguru: "ぐるみん", fuan: "ざわ美", jihi: "ダメ山さん", kodoku: "ぽつ子",
    tsukare: "くた吉", ikari: "イカリ山", muki: "どん兵衛門", nige: "壁ちゃん", boss: "モヤ五郎",
  };

  /* ---------- 相手のターン ---------- */
  function damagePlayer(run, n) {
    const b = run.b;
    if (b.fullGuard) { b.ev.push({ type: "blocked" }); return; }
    if (b.ward > 0) { b.ward--; b.ev.push({ type: "warded" }); return; }
    const absorbed = Math.min(b.guard, n);
    b.guard -= absorbed;
    const left = n - absorbed;
    if (left > 0) run.hp = Math.max(0, run.hp - left);
    b.ev.push({ type: "playerHit", n: left, blocked: absorbed });
    if (run.hp <= 0) b.over = "lose";
  }

  function foeAct(run) {
    const b = run.b, foe = b.foe;
    if (foe.stun > 0) {
      foe.stun--;
      b.ev.push({ type: "note", text: `${foe.name}は固まっている` });
      return;
    }
    const m = foe.intent;
    b.ev.push({ type: "foeAct", t: m.t });
    if (m.t === "atk") {
      let n = atkValue(run, m);
      n = Math.max(0, n - foe.weakNext);
      foe.weakNext = 0;
      for (let i = 0; i < m.hits && !b.over; i++) damagePlayer(run, n);
    } else if (m.t === "grow") {
      foe.hp += m.n + foe.atkAdd;
      foe.maxHp = Math.max(foe.maxHp, foe.hp);
      b.ev.push({ type: "note", text: "モヤモヤがふくらんだ" });
    } else if (m.t === "buff") {
      foe.atkBuff += m.n;
      b.ev.push({ type: "note", text: "考えるほど強くなる…" });
    } else if (m.t === "junk") {
      for (let i = 0; i < m.n; i++) b.discard.push(inst(0));
      b.ev.push({ type: "note", text: `ダメ出しが${m.n}枚まざった` });
    } else if (m.t === "drain") {
      b.drainNext += m.n;
      b.ev.push({ type: "note", text: "元気を奪われた" });
    } else if (m.t === "shield") {
      foe.shield += m.n + foe.atkAdd * 2;
      b.ev.push({ type: "note", text: "殻にこもった" });
    } else if (m.t === "dampen") {
      b.dampenNext = m.n;
      b.ev.push({ type: "note", text: "力が入らない…" });
    } else if (m.t === "charge") {
      b.ev.push({ type: "note", text: "爆発しそうだ！" });
    }
    foe.step++;
  }

  function endTurn(run) {
    const b = run.b;
    if (b.over) return;
    // 手札は捨て札へ（ダメ出しも循環する）
    b.discard.push(...b.hand);
    b.hand = [];

    // 作品の効果
    if (b.dot > 0) {
      hitFoe(run, b.dot, "dot");
      b.dot += b.dotGrow;
    }
    // 仕込み
    for (const d of b.delays) d.turns--;
    const ready = b.delays.filter((d) => d.turns <= 0);
    b.delays = b.delays.filter((d) => d.turns > 0);
    for (const d of ready) {
      if (!b.over) {
        b.ev.push({ type: "note", text: "待ったかいがあった！" });
        hitFoe(run, d.dmg, "delay");
      }
    }
    if (b.over) return;
    foeAct(run);
    if (b.over) return;
    beginTurn(run);
  }

  /* ---------- バトルの後 ---------- */
  function flee(run) {
    if (run.flees <= 0 || STAGES[run.stage].boss || run.b.over) return false;
    run.flees--;
    run.b.over = "flee";
    run.hp = Math.min(run.maxHp, run.hp + 6);
    return true;
  }

  function afterWin(run) {
    run.hp = Math.min(run.maxHp, run.hp + Math.round(run.maxHp * TUNE.restAfterWin));
  }

  // 次のステージへ。章が進むと元気の上限が増える＝「動けるようになっていく」
  function advance(run) {
    run.stage++;
    if (run.stage === 2 || run.stage === 4) run.energyMax++;
    if (run.stage >= STAGES.length) run.won = true;
  }

  function offers(run, seen, n) {
    n = n || 3;
    const st = STAGES[run.stage];
    const owned = {};
    run.deck.forEach((x) => (owned[x.no] = 1));
    const pool = CARDS.filter((c) => !owned[c.no]);
    const weight = (c) => (seen[c.no] ? 1 : 4); // まだ出会っていないカードを出やすく
    const drawOne = (list) => {
      const total = list.reduce((s, c) => s + weight(c), 0);
      let r = run.rng() * total;
      for (const c of list) { r -= weight(c); if (r <= 0) return c; }
      return list[list.length - 1];
    };
    const res = [];
    const takeFrom = (list) => {
      const rest = list.filter((c) => !res.includes(c));
      if (rest.length) res.push(drawOne(rest));
    };
    if (st && st.cat) {
      takeFrom(pool.filter((c) => c.cat === st.cat));
      takeFrom(pool.filter((c) => c.cat === st.cat));
    }
    takeFrom(pool.filter((c) => c.tags.includes(run.mood)));
    while (res.length < n) takeFrom(pool);
    return res.slice(0, n);
  }

  function addCard(run, no) {
    run.deck.push(inst(no));
  }
  function removeCard(run, id) {
    run.deck = run.deck.filter((x) => x.id !== id);
  }
  function restHeal(run) {
    run.hp = Math.min(run.maxHp, run.hp + Math.round(run.maxHp * TUNE.restHeal));
  }

  // いちばん使ったカード
  function mvp(run) {
    let best = null, n = 0;
    // 元気0で毎回使えるカードは「頼りにした」の順位から外す（他に何も使っていなければ採用）
    for (const k in run.used) if (costOf(byNo[k]) > 0 && run.used[k] > n) { n = run.used[k]; best = +k; }
    if (!best) for (const k in run.used) if (run.used[k] > n) { n = run.used[k]; best = +k; }
    return best ? { c: byNo[best], n } : null;
  }

  // カードの効果を日本語1行で（図鑑・手札詳細用）
  function describe(c, p) {
    const fx = fxOf(c);
    const parts = [];
    const dmg = p ? p.dmg : fx.dmg;
    const heal = p ? p.heal : fx.heal;
    const guard = p ? p.guard : fx.guard;
    const dot = p ? p.dot : fx.dot;
    if (dmg) parts.push(`💥${dmg}`);
    if (fx.self) parts.push(`疲れ${fx.self}`);
    if (heal) parts.push(`💚${heal}`);
    if (guard) parts.push(`🛡${guard}`);
    if (dot) parts.push(`毎ターン🎨${dot}`);
    if (fx.draw) parts.push(`${fx.draw}枚引く`);
    if (fx.zone) parts.push(`連続で💥+${fx.zone}`);
    if (fx.perCat) parts.push(`他の分類1つにつき💥+${fx.perCat}`);
    if (fx.txt) parts.push(fx.txt);
    return parts.join("　");
  }

  const api = {
    TUNE, FOES, FOE_KEYS, BOSS, STAGES, byNo, costOf, fxOf,
    newRun, startBattle, preview, canPlay, play, endTurn, intentText, flee,
    afterWin, advance, offers, addCard, removeCard, restHeal, mvp, describe, isWeak, enrageOf,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.MoyaEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
