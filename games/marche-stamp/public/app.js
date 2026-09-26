(() => {
  const R = window.RALLY;
  const booths = R.booths;
  const $ = (id) => document.getElementById(id);

  // 合言葉はハッシュで照合する（ページのソースを見ても答えが分からないように）
  const cyrb53 = (str, seed = 0) => {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
  };
  const checkCode = (id, code) => cyrb53(`${id}:${String(code).trim()}`) === booths.find((b) => b.id === id)?.hash;

  /* ---------- 保存 ---------- */
  const blank = () => ({ name: "", stamps: {}, redeemed: {} });
  let state;
  try {
    state = Object.assign(blank(), JSON.parse(localStorage.getItem(R.storageKey)) || {});
  } catch {
    state = blank();
  }
  const save = () => {
    try { localStorage.setItem(R.storageKey, JSON.stringify(state)); } catch {}
  };
  const count = () => booths.filter((b) => state.stamps[b.id]).length;

  /* ---------- 描画 ---------- */
  const KANJI = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十"];
  const kan = (id) => { const i = booths.findIndex((b) => b.id === id); return KANJI[i] || String(i + 1); };
  const sealInner = (b) => `<div><div class="n">其の${kan(b.id)}</div><div class="t">${esc(short(b.shop))}</div></div>`;
  const hankoHTML = (b) => `<div class="hanko" style="--r:${rot(b.id)}deg">${sealInner(b)}</div>`;
  const rot = (id) => (parseInt(id.slice(1), 10) * 37) % 30 - 18;
  const short = (s) => s.replace(/（.*?）|\(.*?\)/g, "").split(/\s+/).slice(-1)[0].slice(0, 12);
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const fmtTime = (t) => new Date(t).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });

  function render(fresh) {
    document.title = `${R.eventName} スタンプ帖`;
    $("fName").textContent = R.eventName;
    $("fDate").textContent = R.eventDate || "";
    $("fPlace").textContent = R.eventPlace || "";
    const n = count();
    $("got").textContent = n;
    $("total").textContent = booths.length;
    $("fill").style.width = `${(n / booths.length) * 100}%`;
    $("marks").innerHTML = R.rewards
      .filter((r) => r.count < booths.length)
      .map((r) => `<div class="mark" style="left:${(r.count / booths.length) * 100}%" data-l="${esc(r.label)}"></div>`)
      .join("");
    const nextR = R.rewards.find((r) => n < r.count);
    $("next").textContent = nextR ? `あと${nextR.count - n}印で「${nextR.label}」` : "全ブース満願。おめでとうございます";
    $("howto").hidden = n >= 2;

    $("rewards").innerHTML = R.rewards
      .filter((r) => n >= r.count)
      .map((r, i) => {
        const done = state.redeemed[r.label];
        return `<button class="reward-btn ${done ? "done" : ""}" data-reward="${R.rewards.indexOf(r)}">
          <span>${esc(r.label)}${done ? "（受け取り済み）" : "を受け取る"}<small>${done ? fmtTime(done) + " にお受け取りいただきました" : "受付でこの画面をお見せください"}</small></span>
          <span class="ar">${done ? "✓" : "→"}</span>
        </button>`;
      })
      .reverse()
      .join("");

    $("grid").innerHTML = booths
      .map((b, i) => {
        const got = state.stamps[b.id];
        return `<button class="slot ${got ? "got" : ""} ${fresh === b.id ? "fresh" : ""}" data-id="${b.id}">
          <div class="circle">${got ? hankoHTML(b) : `<span class="ghost">${KANJI[i] || i + 1}</span>`}</div>
          <div class="slot-name">${esc(b.shop)}</div>
        </button>`;
      })
      .join("");
  }

  /* ---------- スタンプを押す ---------- */
  function stamp(id) {
    const b = booths.find((x) => x.id === id);
    const already = Boolean(state.stamps[id]);
    const before = count();
    if (!already) {
      state.stamps[id] = Date.now();
      save();
    }
    render(already ? null : id);
    $("fxHanko").innerHTML = sealInner(b);
    $("fxHanko").style.setProperty("--r", `${rot(b.id)}deg`);
    // アニメーションを毎回やり直す
    $("fxHanko").style.animation = "none";
    void $("fxHanko").offsetWidth;
    $("fxHanko").style.animation = "";
    $("fxShop").textContent = b.shop;
    const after = count();
    const hit = R.rewards.find((r) => before < r.count && after >= r.count);
    $("fxMsg").textContent = already
      ? "こちらの朱印は、すでに押してあります"
      : hit
        ? `「${hit.label}」達成。受付で特典をお受け取りください`
        : `朱印をいただきました（${after}／${booths.length}）`;
    $("stampfx").hidden = false;
    if (!already) {
      thud();
      navigator.vibrate?.(60);
      if (hit) setTimeout(confetti, 350);
    }
  }
  $("fxOk").onclick = () => ($("stampfx").hidden = true);

  function thud() {
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(180, ac.currentTime);
      o.frequency.exponentialRampToValueAtTime(50, ac.currentTime + 0.18);
      g.gain.setValueAtTime(0.6, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.25);
      o.connect(g).connect(ac.destination);
      o.start();
      o.stop(ac.currentTime + 0.26);
    } catch {}
  }

  function confetti() {
    const colors = ["#b07a2c", "#e7c27a", "#a8302c", "#d24a40", "#f4ead2"];
    for (let i = 0; i < 70; i++) {
      const c = document.createElement("div");
      c.className = "confetti";
      c.style.left = `${Math.random() * 100}vw`;
      c.style.background = colors[i % colors.length];
      c.style.animationDuration = `${2 + Math.random() * 2}s`;
      c.style.animationDelay = `${Math.random() * 0.6}s`;
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 5000);
    }
  }

  /* ---------- ブース詳細（合言葉入力） ---------- */
  let openId = null;
  function openSheet(id) {
    openId = id;
    const i = booths.findIndex((b) => b.id === id);
    const b = booths[i];
    $("sEmoji").textContent = KANJI[i] || i + 1;
    $("sNo").textContent = `其の${KANJI[i] || i + 1}`;
    $("sShop").textContent = b.shop;
    $("sOwner").textContent = b.owner;
    $("sMenu").textContent = b.menu;
    const got = state.stamps[id];
    $("sAction").innerHTML = got
      ? `<p class="gotline">${fmtTime(got)} 朱印済み</p>`
      : `<p class="hint">ブースに掲示の <b>四桁の合言葉</b> をご入力ください</p>
         <form class="codebox" id="codeForm"><input id="codeIn" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" /><button class="btn">押印</button></form>
         <p class="err" id="codeErr"></p>`;
    $("sheet").hidden = false;
    const f = $("codeForm");
    if (f) {
      f.onsubmit = (e) => {
        e.preventDefault();
        const v = $("codeIn").value;
        if (checkCode(id, v)) {
          closeSheet();
          stamp(id);
        } else {
          $("codeErr").textContent = "合言葉が違うようです。もう一度お確かめください";
          f.classList.remove("shake");
          void f.offsetWidth;
          f.classList.add("shake");
        }
      };
    }
  }
  const closeSheet = () => { $("sheet").hidden = true; openId = null; };
  $("sheet").addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeSheet(); });
  $("grid").addEventListener("click", (e) => {
    const s = e.target.closest(".slot");
    if (s) openSheet(s.dataset.id);
  });

  /* ---------- 特典画面 ---------- */
  let clockTimer = null;
  function openCert(idx) {
    const r = R.rewards[idx];
    $("cEvent").textContent = R.eventName;
    $("cTitle").textContent = r.label;
    $("cCount").textContent = count();
    $("cName").value = state.name || "";
    $("cNote").textContent = r.note;
    const renderStatus = () => {
      const done = state.redeemed[r.label];
      $("cStatus").innerHTML = done
        ? `<div class="redeemed">受け取り済み<small>${new Date(done).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</small></div>`
        : `<div class="staff" id="staffBox"><button class="btn ghost" id="staffOpen">スタッフ確認（スタッフが操作します）</button></div>`;
      const so = $("staffOpen");
      if (so) so.onclick = () => {
        $("staffBox").innerHTML = `<p class="hint">スタッフ用PINを入力</p>
          <form class="codebox" id="pinForm"><input id="pinIn" type="password" inputmode="numeric" maxlength="4" autocomplete="off" /><button class="btn">OK</button></form>
          <p class="err" id="pinErr"></p>`;
        $("pinIn").focus();
        $("pinForm").onsubmit = (e) => {
          e.preventDefault();
          if (cyrb53(`staff:${$("pinIn").value.trim()}`) === R.staffPinHash) {
            state.redeemed[r.label] = Date.now();
            save();
            renderStatus();
            render();
            navigator.vibrate?.(80);
          } else {
            $("pinErr").textContent = "PINがちがいます";
          }
        };
      };
    };
    renderStatus();
    // 動く時計＝スクリーンショットではなく本物の画面だとスタッフが見分けられる
    const tick = () => {
      $("clock").innerHTML = `${new Date().toLocaleTimeString("ja-JP")}<small>現在時刻 ― 秒が進んでいれば本物の画面です</small>`;
    };
    tick();
    clockTimer = setInterval(tick, 1000);
    $("cert").hidden = false;
    if (!state.redeemed[r.label]) confetti();
  }
  $("cName").oninput = (e) => { state.name = e.target.value; save(); };
  $("cClose").onclick = () => { $("cert").hidden = true; clearInterval(clockTimer); };
  $("rewards").addEventListener("click", (e) => {
    const b = e.target.closest("[data-reward]");
    if (b) openCert(Number(b.dataset.reward));
  });

  $("resetBtn").onclick = () => {
    if (confirm("スタンプの記録をすべて消します。よろしいですか？")) {
      state = blank();
      save();
      render();
    }
  };

  function toast(msg) {
    $("toast").textContent = msg;
    $("toast").hidden = false;
    setTimeout(() => ($("toast").hidden = true), 3200);
  }

  /* ---------- QRから来たとき (?b=b01&c=1234) ---------- */
  render();
  const q = new URLSearchParams(location.search);
  if (q.has("b")) {
    const id = q.get("b");
    history.replaceState(null, "", location.pathname);
    if (booths.some((b) => b.id === id) && checkCode(id, q.get("c") || "")) {
      stamp(id);
    } else {
      toast("このQRコードは読み取れませんでした。ブースの合言葉をご入力ください");
    }
  }
})();
