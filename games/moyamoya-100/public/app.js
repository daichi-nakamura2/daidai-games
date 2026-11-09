/* ============================================================
 * モヤモヤ退治100 — 画面
 * ============================================================ */
(function () {
  const { CATS, CARDS } = window.MOYA_DATA;
  const E = window.MoyaEngine;
  const { foeSVG } = window.MoyaArt;

  const $app = document.getElementById("app");
  const $sky = document.getElementById("sky");
  const $modal = document.getElementById("modal-root");
  const esc = (s) => String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  const BOOK_TITLE = "生きづらさを解消する方法を100通り試してみた";
  const BOOK_URL = "https://www.amazon.co.jp/s?k=" + encodeURIComponent(BOOK_TITLE);
  const HELP_URL = "https://www.mhlw.go.jp/mamorouyokokoro/";
  const HASHTAG = "100通り解消法チャレンジ";

  /* ---------- 保存 ---------- */
  const KEY = "moyamoya100:v1";
  const blank = () => ({ seen: {}, done: {}, memo: {}, plays: 0, clears: 0, sound: true, howSeen: false, usedTotal: {}, openAll: false });
  let save = blank();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) save = Object.assign(blank(), JSON.parse(raw));
  } catch (e) { /* 保存できない環境でも遊べる */ }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* noop */ }
  }
  function markSeen(no) {
    if (no && !save.seen[no]) { save.seen[no] = 1; persist(); return true; }
    return false;
  }
  const seenCount = () => Object.keys(save.seen).length;
  const doneCount = () => Object.values(save.done).filter(Boolean).length;

  /* ---------- 音 ---------- */
  let ac = null;
  function tone(freq, dur, type, vol, delay) {
    if (!save.sound) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const t = ac.currentTime + (delay || 0);
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = type || "sine";
      o.frequency.value = freq;
      g.gain.setValueAtTime(vol || 0.05, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(ac.destination);
      o.start(t);
      o.stop(t + dur);
    } catch (e) { /* noop */ }
  }
  const sfx = {
    tap: () => tone(620, 0.05, "triangle", 0.03),
    hit: () => tone(230, 0.13, "square", 0.04),
    weak: () => { tone(520, 0.1, "square", 0.05); tone(780, 0.16, "square", 0.05, 0.08); },
    heal: () => { tone(660, 0.14); tone(880, 0.2, "sine", 0.05, 0.1); },
    hurt: () => tone(130, 0.2, "sawtooth", 0.05),
    win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, "triangle", 0.06, i * 0.12)),
  };

  /* ---------- 状態 ---------- */
  let run = null;
  let selected = null;
  let busy = false;

  function setSky(v) { $sky.dataset.sky = v; }

  /* ---------- タイトル ---------- */
  function showTitle() {
    run = null;
    setSky(0);
    $app.innerHTML = `
      <section class="title">
        <div class="logo">
          <div class="kicker">生きづらさ解消カードバトル</div>
          <h1>モヤモヤ<br>退治<em>100</em></h1>
          <p>100通りの解消法が、<br>あなたの手札になる。</p>
        </div>
        <div class="title-foes">${foeSVG("guruguru")}${foeSVG("taikutsu")}${foeSVG("ikari")}</div>
        <div class="stack">
          <button class="btn" data-a="start">ふとんの中から はじめる</button>
          <button class="btn sub" data-a="zukan">解消法ずかん（${seenCount()} / 100）</button>
          <button class="btn sub" data-a="how">あそびかた</button>
        </div>
        <div class="count-line">${save.clears ? `夜明けを見た回数 ${save.clears}回` : ""}${doneCount() ? `　現実でやってみた ${doneCount()}個` : ""}</div>
        <div class="back-portal"><button data-a="about" style="text-decoration:underline;color:rgba(255,255,255,.72);font-size:13px">この本について</button>　<a href="/">ゲーム一覧へ</a></div>
      </section>`;
    bind({ start: showMood, zukan: () => showZukan(showTitle), how: () => showHow(), about: showAbout });
  }

  function bind(map, root) {
    (root || $app).querySelectorAll("[data-a]").forEach((el) => {
      const fn = map[el.dataset.a];
      if (fn) el.addEventListener("click", (ev) => { sfx.tap(); fn(el, ev); });
    });
  }

  /* ---------- 気分をえらぶ ---------- */
  function showMood() {
    setSky(0);
    const items = E.FOE_KEYS.map((k) => {
      const f = E.FOES[k];
      return `<button class="mood" data-a="pick" data-k="${k}">${foeSVG(k)}<b>${f.name}</b><span>${f.label}</span></button>`;
    }).join("");
    $app.innerHTML = `
      <div class="head"><button class="icon-btn" data-a="back" aria-label="もどる">←</button><h2></h2></div>
      <p class="mood-lead">きょうのあなたに<br>いちばん近いモヤモヤは？</p>
      <p class="muted" style="margin:4px">最初の相手になります。合わせて、手札の解消法も変わります。</p>
      <div class="mood-grid">${items}</div>`;
    bind({
      back: showTitle,
      pick: (el) => {
        run = E.newRun(el.dataset.k, { done: save.done });
        save.plays++;
        run.deck.forEach((x) => (save.seen[x.no] = 1));
        persist();
        if (!save.howSeen) {
          save.howSeen = true;
          persist();
          showHow(showStageIntro);
        } else showStageIntro();
      },
    });
  }

  /* ---------- ステージ紹介 ---------- */
  function showStageIntro() {
    const st = E.STAGES[run.stage];
    setSky(st.sky);
    E.startBattle(run);
    selected = null;
    const foe = run.b.foe;
    $app.innerHTML = `
      <button class="intro" data-a="go">
        <div class="step">${run.stage + 1} / ${E.STAGES.length}</div>
        <h2>${st.name}</h2>
        <div class="sub">${st.sub}</div>
        ${run.stage === 2 || run.stage === 4 ? `<div class="sub" style="margin-top:8px">⚡ 少し動けるようになってきた（元気 +1）</div>` : ""}
        ${foeArt(foe)}
        <div class="say">${foe.name}「${esc(foe.say)}」</div>
        <div class="tap">タップで はじめる</div>
      </button>`;
    bind({ go: renderBattle });
  }

  function foeArt(foe) {
    return foe.boss ? foeSVG("boss", foe.phases) : foeSVG(foe.key);
  }

  /* ---------- バトル ---------- */
  function statLine(p) {
    if (p.c.junk) return "捨てる";
    const fx = p.fx;
    if (p.dmg) return `💥${p.dmg}`;
    if (fx.randDmg) return `💥${fx.randDmg[0]}〜${fx.randDmg[1]}`;
    if (fx.gamble) return "💥？";
    if (p.dot) return `🎨${p.dot}`;
    if (p.heal) return `💚${p.heal}`;
    if (p.guard) return `🛡${p.guard}`;
    if (fx.fullGuard) return "完全防御";
    if (fx.ward) return "お守り";
    if (fx.nextBoost) return "次2倍";
    if (fx.gainNow) return `⚡+${fx.gainNow}`;
    return "特殊";
  }

  function battleHTML() {
    const b = run.b, foe = b.foe, st = E.STAGES[run.stage];
    const intent = E.intentText(run);
    const dots = E.STAGES.map((_, i) => `<i class="${i < run.stage ? "done" : i === run.stage ? "now" : ""}"></i>`).join("");
    const foeHpPct = Math.max(0, Math.min(100, (foe.hp / foe.maxHp) * 100));
    const myPct = Math.max(0, (run.hp / run.maxHp) * 100);

    const fs = [];
    if (foe.shield > 0) fs.push(`🧱 殻 ${foe.shield}`);
    if (foe.atkBuff > 0) fs.push(`💢 攻撃+${foe.atkBuff}`);
    if (foe.weakPerm > 0) fs.push(`🏷️ 攻撃-${foe.weakPerm}`);
    if (foe.weakNext > 0) fs.push(`次の攻撃-${foe.weakNext}`);
    if (E.enrageOf(b) > 0) fs.push(`🌫️ 濃くなっている +${E.enrageOf(b)}`);

    const ms = [];
    if (b.guard > 0) ms.push(`<span class="chip">🛡 ${b.guard}</span>`);
    if (b.ward > 0) ms.push(`<span class="chip">🧿 お守り</span>`);
    if (b.fullGuard) ms.push(`<span class="chip">⏸️ 完全防御</span>`);
    if (b.dot > 0) ms.push(`<span class="chip">🎨 毎ターン ${b.dot}</span>`);
    b.delays.forEach((d) => ms.push(`<span class="chip">⏳ あと${d.turns}で💥${d.dmg}</span>`));
    if (b.zoneCount > 0) ms.push(`<span class="chip">🌀 没頭 ${b.zoneCount}連続</span>`);
    if (b.nextBoost > 0) ms.push(`<span class="chip">✨ 次の${b.nextBoost}枚 2倍</span>`);
    if (b.allWeak) ms.push(`<span class="chip">🃏 全カード特効</span>`);
    if (b.dampen > 0) ms.push(`<span class="chip">🌫️ 力-${b.dampen}</span>`);

    const pips = Array.from({ length: Math.max(run.energyMax, b.energy) }, (_, i) => `<i class="${i < b.energy ? "on" : ""}"></i>`).join("");

    const hand = b.hand.map((x) => {
      const p = E.preview(run, x);
      const off = !E.canPlay(run, x);
      const color = p.c.junk ? "#55506b" : CATS[p.c.cat].color;
      return `<button class="card ${off ? "off" : ""} ${p.weak ? "weak" : ""} ${p.c.junk ? "junk" : ""} ${selected === x.id ? "sel" : ""}" style="--cat:${color}" data-a="card" data-id="${x.id}" aria-label="${esc(p.c.name)}">
        <span class="cost">${p.cost}</span>
        ${p.weak ? '<span class="ribbon">特効</span>' : ""}
        <span class="pic">${p.c.emoji}</span>
        <span class="nm">${esc(p.c.name)}</span>
        <span class="st">${statLine(p)}</span>
        ${p.done ? '<span class="ok">✅</span>' : ""}
      </button>`;
    }).join("");

    const anyPlayable = b.hand.some((x) => E.canPlay(run, x) && x.no !== 0);
    const foeName = foe.nick ? `${foe.nick}<span style="font-size:12px;opacity:.75">（${foe.name}）</span>` : foe.name;

    return `
      <div class="battle">
        <div class="bar-top">
          <div class="where">${st.name}</div>
          <div class="dots">${dots}</div>
          <button class="icon-btn" style="width:34px;height:34px" data-a="sound" aria-label="音の切り替え">${save.sound ? "🔊" : "🔇"}</button>
          <button class="icon-btn" style="width:34px;height:34px" data-a="deck" aria-label="手持ちカード">🃏</button>
        </div>
        <div class="foe-area" id="foe-area">
          <div class="center">
            <div class="foe-name">${foeName}</div>
            <div class="foe-label">弱点：${esc(foe.label)}のときの解消法</div>
          </div>
          <div class="foe-box" id="foe-box">
            ${foeArt(foe)}
            <div class="intent">${intent.icon} ${esc(intent.text)}</div>
          </div>
          <div class="hpbar"><i style="width:${foeHpPct}%"></i></div>
          <div class="hp-num">モヤモヤ ${foe.hp} / ${foe.maxHp}${foe.boss ? `　（${foe.phase + 1} / ${foe.phases.length} 段階）` : ""}</div>
          <div class="foe-status">${fs.map((s) => `<span class="chip">${s}</span>`).join("")}</div>
        </div>
        <div class="me" id="me">
          <div class="me-row">
            <span>ココロ ${run.hp}/${run.maxHp}</span>
            <div class="heart"><i style="width:${myPct}%"></i></div>
            <div class="energy" aria-label="元気 ${b.energy}">${pips}</div>
          </div>
          ${ms.length ? `<div class="me-status">${ms.join("")}</div>` : ""}
        </div>
        ${detailHTML()}
        <div class="hand" id="hand">${hand}</div>
        <div class="actions">
          <button class="flee" data-a="flee" ${run.flees <= 0 || st.boss ? "disabled" : ""}>にげる（${run.flees}）</button>
          <button class="end ${anyPlayable ? "" : "ready"}" data-a="end">ターン終了</button>
        </div>
      </div>`;
  }

  function detailHTML() {
    const b = run.b;
    const sel = b.hand.find((x) => x.id === selected);
    if (!sel) {
      const msg = b.turn === 1 && run.stage === 0
        ? "カードをタップすると、くわしく見られます。<br><b style='color:#d9700f'>オレンジに光るカード</b>は「いまのモヤモヤに効く」特効です"
        : "カードをタップして えらぶ<br>もう一度タップで 使う";
      return `<div class="detail hint"><div>${msg}</div></div>`;
    }
    const p = E.preview(run, sel);
    const can = E.canPlay(run, sel);
    let why = "";
    if (p.c.junk) why = `<div class="why">${esc(p.c.one)}</div>`;
    else if (b.allWeak && !p.c.tags.some((t) => b.foe.tags.includes(t))) why = `<div class="why weak">🃏 弱点、見つけた！ 効果2倍</div>`;
    else if (p.weak) why = `<div class="why weak">🎯 効果2倍！ こんなときに：${esc(p.c.rec[0])}</div>`;
    else why = `<div class="why">${esc(p.c.one)}</div>`;
    return `<div class="detail">
      <div class="txt">
        <h4>${p.c.emoji} ${esc(p.c.name)}</h4>
        <div class="fx">${esc(E.describe(p.c, p)) || "—"}</div>
        ${why}
      </div>
      <button class="use" data-a="use" ${can ? "" : "disabled"}>${can ? "使う" : "元気<br>不足"}</button>
    </div>`;
  }

  function renderBattle() {
    $app.innerHTML = battleHTML();
    bind({
      card: (el) => {
        if (busy) return;
        const id = +el.dataset.id;
        if (selected === id) useCard(id);
        else { selected = id; renderBattle(); }
      },
      use: () => { if (!busy && selected != null) useCard(selected); },
      end: endTurnAction,
      flee: fleeAction,
      deck: () => showDeckModal(),
      sound: () => { save.sound = !save.sound; persist(); renderBattle(); },
    });
    const h = document.getElementById("hand");
    if (h && selected != null) {
      const el = h.querySelector(".sel");
      if (el) el.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }

  function float(text, cls, parent) {
    const host = parent || document.getElementById("foe-area");
    if (!host) return;
    const el = document.createElement("div");
    el.className = "float " + cls;
    el.textContent = text;
    host.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  function flash(id, cls) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  // エンジンがためたイベントを、順番に演出する
  async function playEvents() {
    const b = run.b;
    const list = b.ev.splice(0);
    let lastWeak = false;
    for (const e of list) {
      switch (e.type) {
        case "play":
          lastWeak = e.weak;
          if (e.weak) { float("特効！", "note"); await wait(160); }
          break;
        case "foeHit":
          float(`${e.kind === "dot" ? "🎨" : ""}${e.n}`, lastWeak && e.kind === "card" ? "weak" : "dmg");
          flash("foe-box", "hit");
          (lastWeak ? sfx.weak : sfx.hit)();
          updateFoeBar();
          await wait(e.kind === "card" ? 240 : 420);
          break;
        case "heal":
          float(`+${e.n}`, "heal", document.getElementById("me"));
          sfx.heal();
          await wait(130);
          break;
        case "self":
          float(`疲れ -${e.n}`, "hurt", document.getElementById("me"));
          await wait(100);
          break;
        case "guard":
          float(`🛡${e.n}`, "note", document.getElementById("me"));
          await wait(90);
          break;
        case "dot":
          float(`🎨+${e.n}`, "note");
          await wait(100);
          break;
        case "note":
          float(e.text, "note");
          await wait(520);
          break;
        case "foeAct":
          flash("foe-box", "act");
          await wait(240);
          break;
        case "playerHit":
          if (e.n > 0) { float(`-${e.n}`, "hurt", document.getElementById("me")); flash("me", "hurt"); sfx.hurt(); }
          else float(`🛡 防いだ`, "note", document.getElementById("me"));
          await wait(320);
          break;
        case "blocked":
          float("じっとして、やり過ごした", "note", document.getElementById("me"));
          await wait(500);
          break;
        case "warded":
          float("お守りが守ってくれた", "note", document.getElementById("me"));
          await wait(500);
          break;
        case "phase":
          sfx.weak();
          float(`ほどけた！ 次は${e.name}の糸`, "note");
          await wait(1100);
          break;
      }
    }
  }

  function updateFoeBar() {
    const foe = run.b.foe;
    const bar = document.querySelector(".hpbar > i");
    const num = document.querySelector(".hp-num");
    if (bar) bar.style.width = Math.max(0, (foe.hp / foe.maxHp) * 100) + "%";
    if (num) num.firstChild.textContent = `モヤモヤ ${foe.hp} / ${foe.maxHp}`;
  }

  async function useCard(id) {
    if (busy) return;
    const card = run.b.hand.find((x) => x.id === id);
    if (!card || !E.canPlay(run, card)) return;
    busy = true;
    selected = null;
    E.play(run, id);
    await afterAction();
  }

  async function afterAction() {
    // 手札やバーを先に反映しつつ、演出は敵側エリアに重ねる
    const events = run.b.ev.slice();
    renderBattle();
    run.b.ev = events;
    await playEvents();
    busy = false;
    if (run.b.over) return finishBattle();
    renderBattle();
  }

  async function endTurnAction() {
    if (busy) return;
    busy = true;
    selected = null;
    E.endTurn(run);
    // 敵の行動中は古い手札を消して見せる
    const events = run.b.ev.slice();
    const hand = document.getElementById("hand");
    if (hand) hand.style.opacity = ".35";
    run.b.ev = events;
    await playEvents();
    busy = false;
    if (run.b.over) return finishBattle();
    renderBattle();
  }

  function fleeAction() {
    if (busy) return;
    openModal(`
      <h2>にげますか？</h2>
      <p style="margin-top:8px">「逃げる」も立派な解消法です。ココロが少し回復して、次へ進みます（カードはもらえません）。</p>
      <p class="meta" style="margin-top:6px">あと ${run.flees} 回 使えます。</p>
      <div class="stack" style="margin-top:14px">
        <button class="btn" data-m="yes">にげる</button>
        <button class="btn sub" data-m="no">もう少しがんばる</button>
      </div>`, {
      yes: () => {
        closeModal();
        E.flee(run);
        E.advance(run);
        showStageIntro();
      },
      no: closeModal,
    });
  }

  async function finishBattle() {
    const b = run.b;
    if (b.over === "lose") return showResult(false);
    flash("foe-box", "dead");
    sfx.win();
    await wait(760);
    const st = E.STAGES[run.stage];
    E.afterWin(run);
    if (st.boss) {
      E.advance(run);
      return showResult(true);
    }
    showReward();
  }

  /* ---------- 報酬 ---------- */
  function bigCardHTML(c, isNew, action) {
    const color = CATS[c.cat].color;
    return `<button class="big-card" style="--cat:${color}" data-a="${action}" data-no="${c.no}">
      <div class="side"><b>${c.emoji}</b>${c.cat}</div>
      <div class="body">
        <h3>${esc(c.name)}${isNew ? '<span class="new">NEW</span>' : ""}</h3>
        <div class="fx">⚡${E.costOf(c)}　${esc(E.describe(c)) }</div>
        <div class="one">${esc(c.one)}</div>
      </div>
    </button>`;
  }

  function showReward() {
    const foe = run.b.foe;
    const offers = E.offers(run, save.seen, 3);
    const news = offers.map((c) => markSeen(c.no));
    $app.innerHTML = `
      <section class="reward">
        <h2>${foe.name}が 晴れた！</h2>
        <p class="muted center" style="margin:0">ココロが少し回復した。<br>新しい解消法を、ひとつ手札に加えよう。</p>
        ${offers.map((c, i) => bigCardHTML(c, news[i], "take")).join("")}
        <button class="btn sub" data-a="skip" style="margin-top:4px">今回はもらわない</button>
      </section>`;
    bind({
      take: (el) => { E.addCard(run, +el.dataset.no); nextAfterReward(); },
      skip: nextAfterReward,
    });
  }

  function nextAfterReward() {
    const st = E.STAGES[run.stage];
    if (st.rest) return showRest();
    E.advance(run);
    showStageIntro();
  }

  function showRest() {
    $app.innerHTML = `
      <section class="reward">
        <h2>ひと休みの場所</h2>
        <p class="muted center" style="margin:0">合わなかった解消法は、手放してもいい。<br>どうする？（ココロ ${run.hp} / ${run.maxHp}）</p>
        <div class="stack" style="margin-top:8px">
          <button class="btn" data-a="heal">🍵 ゆっくり休む（ココロを${Math.round(run.maxHp * E.TUNE.restHeal)}回復）</button>
          <button class="btn sub" data-a="drop">🍃 カードを1枚 手放す（もう出なくなる）</button>
        </div>
      </section>`;
    bind({
      heal: () => { E.restHeal(run); E.advance(run); showStageIntro(); },
      drop: showDropList,
    });
  }

  function showDropList() {
    const items = run.deck.map((x) => ({ x, c: E.byNo[x.no] }));
    $app.innerHTML = `
      <div class="head"><button class="icon-btn" data-a="back" aria-label="もどる">←</button><h2>手放すカードをえらぶ</h2></div>
      <div class="deck-list">${items.map(({ x, c }) => `<button class="big-card" style="--cat:${CATS[c.cat].color}" data-a="pick" data-id="${x.id}">
        <div class="side"><b>${c.emoji}</b>${c.cat}</div>
        <div class="body"><h3>${esc(c.name)}</h3><div class="fx">⚡${E.costOf(c)}　${esc(E.describe(c))}</div></div>
      </button>`).join("")}</div>`;
    bind({
      back: showRest,
      pick: (el) => { E.removeCard(run, +el.dataset.id); E.advance(run); showStageIntro(); },
    });
    window.scrollTo(0, 0);
  }

  function showDeckModal() {
    const items = run.deck.map((x) => E.byNo[x.no]).sort((a, b) => a.no - b.no);
    openModal(`
      <h2>手持ちのカード（${items.length}枚）</h2>
      <p class="meta" style="margin-top:6px">山札 ${run.b.draw.length}枚 ／ 使ったカード ${run.b.discard.length}枚</p>
      <ul style="margin-top:10px;list-style:none;padding:0">
        ${items.map((c) => `<li style="padding:5px 0;border-bottom:1px solid var(--line)"><b>${c.emoji} ${esc(c.name)}</b><br><span class="meta">⚡${E.costOf(c)}　${esc(E.describe(c))}</span></li>`).join("")}
      </ul>
      <button class="btn sub close" data-m="close">とじる</button>`, { close: closeModal });
  }

  /* ---------- 結果 ---------- */
  function showResult(won) {
    const mvp = E.mvp(run);
    if (won) { save.clears++; }
    if (mvp) save.usedTotal[mvp.c.no] = (save.usedTotal[mvp.c.no] || 0) + 1;
    persist();
    setSky(won ? "dawn" : E.STAGES[run.stage].sky);

    const reached = E.STAGES[run.stage] ? E.STAGES[run.stage].name : "";
    const mvpHTML = mvp ? `
      <div class="mvp">
        <small>今回いちばん頼りにした解消法</small>
        <h3>${mvp.c.emoji} ${esc(mvp.c.name)}（${mvp.n}回）</h3>
        <p>${esc(mvp.c.one)}</p>
        <p style="margin-top:6px;color:var(--ink-soft)">こんなときに：${esc(mvp.c.rec[0])}</p>
        <button class="btn paper" data-a="open-mvp" style="margin-top:9px;font-size:14px;padding:10px">現実でも やってみる</button>
      </div>` : "";

    const shareText = won
      ? `モヤモヤ退治100で、ふとんの中から夜明けまでたどり着いた！${mvp ? `\n頼りにした解消法は「${mvp.c.name}」` : ""}\n#${HASHTAG}`
      : `モヤモヤ退治100で「${reached}」まで進んだ。${mvp ? `\n頼りにした解消法は「${mvp.c.name}」` : ""}\n#${HASHTAG}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(location.href.split("#")[0])}`;

    $app.innerHTML = `
      <section class="result">
        ${won ? `
          <h2>夜が、明けた。</h2>
          <p>からまったモヤモヤが、ほどけました。<br>現実の朝も、こんなふうに<br>一枚ずつカードを切っていけば大丈夫。</p>
        ` : `
          <h2>きょうは、<br>ここまで。</h2>
          <p>負けたわけじゃありません。<br>「${esc(reached)}」まで来られました。<br>出会った解消法は、ずかんに残っています。</p>
        `}
        ${mvpHTML}
        <div class="book">
          <b>この100枚は、ぜんぶ実在の解消法です。</b><br>
          やり方と効能は、書籍『${BOOK_TITLE}』に載っています。
          <a class="btn" href="${BOOK_URL}" target="_blank" rel="noopener">本を見てみる</a>
        </div>
        <div class="stack">
          <button class="btn" data-a="again">もう一度 冒険する</button>
          <button class="btn sub" data-a="zukan">ずかんを見る（${seenCount()} / 100）</button>
          <a class="btn sub" href="${url}" target="_blank" rel="noopener">Xで シェアする</a>
          <button class="btn sub" data-a="title">タイトルへ</button>
        </div>
      </section>`;
    bind({
      again: showMood, title: showTitle,
      zukan: () => showZukan(showTitle),
      "open-mvp": () => mvp && showCardDetail(mvp.c),
    });
    window.scrollTo(0, 0);
  }

  /* ---------- 図鑑 ---------- */
  let zukanTab = "すべて";
  function showZukan(back) {
    setSky(run ? E.STAGES[Math.min(run.stage, 6)].sky : 0);
    const tabs = ["すべて", ...Object.keys(CATS), "やってみた"];
    const list = CARDS.filter((c) => (zukanTab === "すべて" ? true : zukanTab === "やってみた" ? save.done[c.no] : c.cat === zukanTab));
    const tiles = list.map((c) => {
      const open = save.seen[c.no] || save.openAll;
      const color = CATS[c.cat].color;
      if (!open) return `<div class="tile lock" style="--cat:${color}"><span class="num">No.${c.no}</span><span class="pic">？</span><span class="nm">${c.cat}</span></div>`;
      return `<button class="tile" style="--cat:${color}" data-a="tile" data-no="${c.no}">
        <span class="num">No.${c.no}</span><span class="pic">${c.emoji}</span><span class="nm">${esc(c.name)}</span>
        ${save.done[c.no] ? '<span class="ck">✅</span>' : ""}
      </button>`;
    }).join("");
    $app.innerHTML = `
      <div class="head"><button class="icon-btn" data-a="back" aria-label="もどる">←</button><h2>解消法ずかん</h2></div>
      <div class="progress"><span>出会った ${seenCount()} / 100</span><span>現実でやってみた ${doneCount()} / 100</span></div>
      <div class="tabs">${tabs.map((t) => `<button class="tab ${t === zukanTab ? "on" : ""}" data-a="tab" data-t="${t}">${t}</button>`).join("")}</div>
      <div class="grid">${tiles || '<p class="muted" style="grid-column:1/-1">まだありません。現実で試した解消法に、チェックをつけてみましょう。</p>'}</div>
      ${save.openAll ? "" : '<button class="linkish" data-a="open-all">本を読んだので、全カードを先に見る</button>'}`;
    bind({
      back,
      tab: (el) => { zukanTab = el.dataset.t; showZukan(back); },
      tile: (el) => showCardDetail(E.byNo[+el.dataset.no], () => showZukan(back)),
      "open-all": () => { save.openAll = true; persist(); showZukan(back); },
    });
  }

  function showCardDetail(c, onClose) {
    const color = CATS[c.cat].color;
    const draw = () => {
      const on = !!save.done[c.no];
      openModal(`
        <div class="meta" style="color:${color};font-weight:900">No.${c.no}　${CATS[c.cat].emoji} ${c.cat}</div>
        <h2>${c.emoji} ${esc(c.name)}</h2>
        <div class="fxbox">⚡${E.costOf(c)}　${esc(E.describe(c))}</div>
        <h3>やること</h3><p>${esc(c.one)}</p>
        <h3>こんなときに</h3><ul>${c.rec.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>
        <h3>効能</h3><ul>${c.eff.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>
        <button class="check ${on ? "on" : ""}" data-m="toggle"><span class="box">${on ? "✓" : ""}</span><span>現実でやってみた<br><span class="meta">チェックすると、ゲームでもこのカードが少し強くなります</span></span></button>
        <h3>メモ（どうだった？）</h3>
        <textarea id="memo" maxlength="400" placeholder="やってみて感じたこと">${esc(save.memo[c.no] || "")}</textarea>
        <p class="note">くわしいやり方は、書籍『${BOOK_TITLE}』の No.${c.no} へ。</p>
        <button class="btn sub close" data-m="close">とじる</button>`, {
        toggle: () => { saveMemo(c); save.done[c.no] = !on; persist(); draw(); },
        close: () => { saveMemo(c); closeModal(); if (onClose) onClose(); },
      });
    };
    draw();
  }

  function saveMemo(c) {
    const t = document.getElementById("memo");
    if (!t) return;
    const v = t.value.trim();
    if (v) save.memo[c.no] = v; else delete save.memo[c.no];
    persist();
  }

  /* ---------- あそびかた ---------- */
  function showHow(next) {
    openModal(`
      <h2>あそびかた</h2>
      <div class="how-row"><b class="ic">⚡</b><p><b>元気</b>を使ってカードを出し、モヤモヤを晴らします。カードをタップして、もう一度タップで使います。</p></div>
      <div class="how-row"><b class="ic">🎯</b><p>オレンジに光る<b>特効カード</b>は、効果2倍。「こんなときに使う」が、いまのモヤモヤに合っているカードです。</p></div>
      <div class="how-row"><b class="ic">🗯️</b><p>モヤモヤの頭の上に<b>次の行動</b>が出ます。攻撃が来るなら守る、来ないなら攻める。長引くほど濃くなります。</p></div>
      <div class="how-row"><b class="ic">🌅</b><p>カードの<b>分類ごとに持ち味</b>が違います。ふとんの中から始めて、章を進むごとに動ける元気が増えていきます。</p></div>
      <div class="how-row"><b class="ic">🏃</b><p>きびしいときは<b>にげて</b>OK。逃げるのも立派な解消法です。</p></div>
      <div class="how-row"><b class="ic">✅</b><p>ずかんで<b>「現実でやってみた」</b>にチェックすると、そのカードが強くなります。</p></div>
      <h3>カードの分類</h3>
      <ul>${Object.entries(CATS).map(([k, v]) => `<li><b style="color:${v.color}">${v.emoji} ${k}</b>：${v.style}</li>`).join("")}</ul>
      <button class="btn close" data-m="ok">${next ? "はじめる" : "とじる"}</button>`, {
      ok: () => { closeModal(); if (next) next(); },
    });
  }

  function showAbout() {
    openModal(`
      <h2>この本について</h2>
      <p style="margin-top:8px">このゲームのカードは、書籍『${BOOK_TITLE}』で紹介されている100の解消法から作りました。本の No.53 では「生きづらさをカードゲームにして、弱点を考える」という解消法も紹介しています。このゲームは、それを本当にやってみたものです。</p>
      <a class="btn" style="margin-top:12px" href="${BOOK_URL}" target="_blank" rel="noopener">本を見てみる</a>
      <p class="note">このゲームは医療行為や診断の代わりになるものではありません。つらさが強いときや長く続くときは、医療機関や<a href="${HELP_URL}" target="_blank" rel="noopener">公的な相談窓口（まもろうよ こころ）</a>も頼ってください。</p>
      <button class="btn sub close" data-m="close">とじる</button>`, { close: closeModal });
  }

  /* ---------- モーダル ---------- */
  function openModal(html, handlers) {
    $modal.innerHTML = `<div class="modal"><div class="sheet" role="dialog" aria-modal="true">${html}</div></div>`;
    $modal.querySelectorAll("[data-m]").forEach((el) => {
      el.addEventListener("click", () => { sfx.tap(); handlers[el.dataset.m](); });
    });
  }
  function closeModal() { $modal.innerHTML = ""; }

  showTitle();
})();
