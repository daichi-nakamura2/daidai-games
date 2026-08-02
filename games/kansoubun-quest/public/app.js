/* =========================================================================
 * 感想文クエスト — 画面まわり
 *   状態は state ひとつにまとめ、変えたら render する、という作りにしている。
 *   保存は localStorage（途中の状態＋完成した感想文の書だな）。
 * ========================================================================= */

(() => {
  const STATE_KEY = "kansoubun-quest-state-v1";
  const LIB_KEY = "kansoubun-quest-library-v1";
  const MAX_FOLLOWUPS = 2;

  const $ = (id) => document.getElementById(id);
  const esc = (s) =>
    String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* =======================================================================
   * 状態
   * ==================================================================== */

  function newState() {
    return {
      phase: "start",
      book: { title: "", author: "", date: "", reader: "" },
      order: QUESTIONS.map((q) => ({ kind: "base", qid: q.id })),
      index: 0,
      answers: {},
      followupAnswers: [],
      usedFollowups: [],
      stats: { discover: 0, dig: 0, connect: 0, act: 0 },
      titles: [],
      essayTitle: "",
      audience: "teen",
      length: 800,
      edits: {},
      added: {},
      dropped: [],
      editingId: null,
      naviText: "こんにちは。ぼくは感想文ナビ。いっしょに感想文をつくろう。",
      startedAt: Date.now(),
    };
  }

  let state = newState();
  let essay = null; // 直近に組み立てた感想文
  let viewingSaved = null; // 書だなから開いているとき

  function save() {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch (e) {
      /* 保存できなくてもゲームは続けられる */
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      return s && s.phase ? s : null;
    } catch (e) {
      return null;
    }
  }

  function library() {
    try {
      return JSON.parse(localStorage.getItem(LIB_KEY) || "[]");
    } catch (e) {
      return [];
    }
  }

  function saveToLibrary(entry) {
    const list = library();
    const i = list.findIndex((x) => x.id === entry.id);
    if (i >= 0) list[i] = entry;
    else list.unshift(entry);
    localStorage.setItem(LIB_KEY, JSON.stringify(list.slice(0, 30)));
  }

  /* =======================================================================
   * 画面の切りかえ
   * ==================================================================== */

  const SCREENS = ["start", "book", "quest", "forge", "edit", "final"];

  function show(phase) {
    state.phase = phase;
    SCREENS.forEach((s) => {
      $("screen-" + s).hidden = s !== phase;
    });
    $("btn-reset").hidden = phase === "start";
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    // スタート画面では保存しない（起動しただけで前回の続きを消さないため）
    if (phase !== "start") save();
  }

  /* =======================================================================
   * 進行の便利関数
   * ==================================================================== */

  const currentItem = () => state.order[state.index];

  function questionOf(item) {
    if (!item) return null;
    if (item.kind === "base") return QUESTIONS.find((q) => q.id === item.qid);
    return item.def;
  }

  function answerOf(item) {
    if (!item) return "";
    if (item.kind === "base") return state.answers[item.qid] || "";
    const f = state.followupAnswers.find((x) => x.id === item.def.id);
    return f ? f.text : "";
  }

  function setAnswer(item, text) {
    if (item.kind === "base") {
      state.answers[item.qid] = text;
    } else {
      const d = item.def;
      const i = state.followupAnswers.findIndex((x) => x.id === d.id);
      const rec = { id: d.id, parentId: d.parentId, block: d.block, stat: d.stat, text };
      if (i >= 0) state.followupAnswers[i] = rec;
      else state.followupAnswers.push(rec);
    }
  }

  const answeredBaseCount = () =>
    QUESTIONS.filter((q) => (state.answers[q.id] || "").trim().length > 0).length;

  const totalAnswerChars = () =>
    Object.values(state.answers).reduce((n, t) => n + Engine.countChars(t), 0) +
    state.followupAnswers.reduce((n, f) => n + Engine.countChars(f.text), 0);

  /* =======================================================================
   * 称号
   * ==================================================================== */

  function checkTitles(extra) {
    const snap = {
      answeredCount: answeredBaseCount(),
      answers: state.answers,
      stats: state.stats,
      totalChars: totalAnswerChars(),
      ownRatio: (extra && extra.ownRatio) || 0,
    };
    const got = [];
    TITLES.forEach((t) => {
      if (state.titles.includes(t.id)) return;
      if (t.check(snap)) {
        state.titles.push(t.id);
        got.push(t);
      }
    });
    return got;
  }

  /* =======================================================================
   * ①スタート画面
   * ==================================================================== */

  function renderStart() {
    $("start-stats").innerHTML = STAT_ORDER.map(
      (k) =>
        `<div class="legend-item"><b>${STATS[k].emoji} ${STATS[k].label}</b>${STATS[k].desc}</div>`
    ).join("");

    const saved = load();
    $("btn-continue").hidden = !(saved && saved.phase !== "start");

    const lib = library();
    $("library-card").hidden = lib.length === 0;
    $("library-list").innerHTML = lib
      .map(
        (w, i) => `
        <div class="lib-item">
          <div class="lib-main">
            <b>${esc(w.essayTitle || w.book.title)}</b>
            <small>『${esc(w.book.title)}』 ${w.chars}字 ・ ${new Date(w.savedAt).toLocaleDateString("ja-JP")}</small>
          </div>
          <button class="ghost small" data-lib-open="${i}">開く</button>
          <button class="ghost small" data-lib-del="${i}">削除</button>
        </div>`
      )
      .join("");
  }

  $("library-list").addEventListener("click", (e) => {
    const open = e.target.getAttribute("data-lib-open");
    const del = e.target.getAttribute("data-lib-del");
    const lib = library();
    if (open !== null) {
      viewingSaved = lib[Number(open)];
      renderSavedFinal(viewingSaved);
      show("final");
    } else if (del !== null) {
      if (!confirm("この感想文を消しますか？")) return;
      lib.splice(Number(del), 1);
      localStorage.setItem(LIB_KEY, JSON.stringify(lib));
      renderStart();
    }
  });

  $("btn-start").addEventListener("click", () => {
    state = newState();
    viewingSaved = null;
    show("book");
  });

  $("btn-continue").addEventListener("click", () => {
    const s = load();
    if (!s) return;
    state = Object.assign(newState(), s);
    viewingSaved = null;

    if (state.phase === "edit" || state.phase === "final") {
      rebuildEssay();
      renderEdit();
      show("edit");
      return;
    }
    if (state.phase === "quest" || state.phase === "forge") {
      if (!currentItem()) {
        startForge(); // 全問答え終わった直後に閉じた場合
      } else {
        show("quest");
        renderQuest();
      }
      return;
    }
    fillBookForm();
    show("book");
  });

  $("btn-reset").addEventListener("click", () => {
    if (!confirm("最初からやり直しますか？（書きかけの答えは消えます）")) return;
    state = newState();
    viewingSaved = null;
    localStorage.removeItem(STATE_KEY);
    renderStart();
    show("start");
  });

  /* =======================================================================
   * ②本の情報
   * ==================================================================== */

  $("btn-book-next").addEventListener("click", () => {
    const title = $("in-title").value.trim();
    if (!title) {
      $("book-error").textContent = "本のタイトルだけは教えてください。";
      $("in-title").focus();
      return;
    }
    $("book-error").textContent = "";
    state.book = {
      title,
      author: $("in-author").value.trim(),
      date: $("in-date").value,
      reader: $("in-reader").value.trim(),
    };
    state.naviText = `『${title}』だね。読んだばかりの気持ちが残っているうちに、10個だけ質問させて。`;
    renderQuest();
    show("quest");
  });

  function fillBookForm() {
    $("in-title").value = state.book.title;
    $("in-author").value = state.book.author;
    $("in-date").value = state.book.date;
    $("in-reader").value = state.book.reader;
  }

  /* =======================================================================
   * ③クエスト（質問）
   * ==================================================================== */

  function renderStatRow(el, big) {
    el.innerHTML = STAT_ORDER.map(
      (k) =>
        `<div class="stat-chip" data-stat="${k}"><b>${state.stats[k]}</b>${STATS[k].emoji} ${STATS[k].label}</div>`
    ).join("");
  }

  function questionText(q) {
    let t = q.text;
    if (t.includes("{prev3}")) {
      const a3 = (state.answers[3] || "").trim();
      const short = a3 ? (a3.length > 24 ? a3.slice(0, 24) + "…" : a3) : "さっきの感想";
      t = t.replace(/\{prev3\}/g, short);
    }
    return t;
  }

  function renderQuest() {
    const item = currentItem();
    if (!item) return startForge();
    const q = questionOf(item);
    const isFollow = item.kind === "follow";

    const done = answeredBaseCount();
    $("quest-bar").style.width = Math.round((done / QUESTIONS.length) * 100) + "%";
    $("quest-count").textContent = `${done} / ${QUESTIONS.length}`;
    $("quest-step").textContent = isFollow ? "+α" : q.step;
    $("quest-step").className = "step-badge" + (isFollow ? " follow" : "");
    renderStatRow($("quest-stats"));

    $("navi-text").textContent = state.naviText;
    $("navi-text").style.animation = "none";
    void $("navi-text").offsetWidth;
    $("navi-text").style.animation = "";

    $("q-kind").textContent = isFollow ? "追加クエスト" : "クエスト";
    $("q-kind").className = "q-kind" + (isFollow ? " follow" : "");
    $("q-title").textContent = q.title;
    $("q-text").textContent = questionText(q);

    $("q-hints").hidden = true;
    $("btn-hint").textContent = "💡 ヒントを見る";
    $("q-hints").innerHTML = (q.hints || []).map((h) => `<li>${esc(h)}</li>`).join("");

    const input = $("q-input");
    input.value = answerOf(item);
    input.placeholder = q.placeholder || "";
    input.rows = q.rows || 5;
    updateCount();

    $("btn-prev").disabled = state.index === 0;
    save();
  }

  function updateCount() {
    const item = currentItem();
    const q = questionOf(item);
    const n = Engine.countChars($("q-input").value);
    const min = (q && q.minChars) || 20;
    $("q-count").textContent = n + "字";
    $("q-count").className = "chars" + (n >= min ? " enough" : "");
    $("q-guide").textContent =
      n >= min ? "じゅうぶん書けています" : `あと${min - n}字くらい書けると、感想文がラクになる`;
  }

  $("q-input").addEventListener("input", updateCount);

  $("btn-hint").addEventListener("click", () => {
    const el = $("q-hints");
    el.hidden = !el.hidden;
    $("btn-hint").textContent = el.hidden ? "💡 ヒントを見る" : "ヒントを閉じる";
  });

  $("btn-prev").addEventListener("click", () => {
    if (state.index === 0) return;
    setAnswer(currentItem(), $("q-input").value.trim());
    state.index -= 1;
    renderQuest();
  });

  $("btn-skip").addEventListener("click", () => {
    if (!currentItem()) return;
    setAnswer(currentItem(), "");
    state.naviText = "だいじょうぶ。あとで書き足せます。次にいきましょう。";
    state.index += 1;
    if (state.index >= state.order.length) startForge();
    else renderQuest();
  });

  $("btn-answer").addEventListener("click", () => {
    const item = currentItem();
    if (!item) return; // 最後の1問のあと、組み立て画面に移るまでの空打ち防止
    const q = questionOf(item);
    const text = $("q-input").value.trim();

    if (!text) {
      state.naviText = "何か1行でいいので書いてみて。書けないときは「スキップ」でもOK。";
      $("navi-text").textContent = state.naviText;
      $("q-input").focus();
      return;
    }

    setAnswer(item, text);

    const a = Engine.analyze(text);
    const score = Engine.scoreAnswer(q, a);
    state.stats[score.stat] += score.points;

    const got = checkTitles();
    state.naviText = Engine.reactionFor(q, a, state.index + text.length);

    showReward(score, got);
    flashStat(score.stat);

    // 追加質問を差し込むか決める
    if (item.kind === "base" && state.usedFollowups.length < MAX_FOLLOWUPS) {
      const f = Engine.pickFollowup(q, a, state.usedFollowups);
      if (f) {
        state.usedFollowups.push(f.id);
        state.order.splice(state.index + 1, 0, { kind: "follow", def: f });
      }
    }

    state.index += 1;
    renderStatRow($("quest-stats"));
    if (state.index >= state.order.length) {
      $("btn-answer").disabled = true;
      $("btn-skip").disabled = true;
      setTimeout(() => {
        $("btn-answer").disabled = false;
        $("btn-skip").disabled = false;
        startForge();
      }, 600);
    } else {
      renderQuest();
    }
  });

  function flashStat(key) {
    const chip = document.querySelector(`#quest-stats .stat-chip[data-stat="${key}"]`);
    if (!chip) return;
    chip.classList.add("up");
    setTimeout(() => chip.classList.remove("up"), 600);
  }

  let rewardTimer = null;
  function showReward(score, titles) {
    const el = $("reward");
    const s = STATS[score.stat];
    el.innerHTML =
      `<span class="gain">${s.emoji} ${s.label} +${score.points}</span>` +
      (score.bonuses.length ? `<span class="bonus">${esc(score.bonuses.join(" / "))}</span>` : "") +
      titles.map((t) => `<span class="badge">称号獲得！ ${t.emoji} ${esc(t.name)}</span>`).join("");
    el.hidden = false;
    clearTimeout(rewardTimer);
    rewardTimer = setTimeout(() => {
      el.hidden = true;
    }, titles.length ? 3200 : 2200);
  }

  /* =======================================================================
   * ④組み立て演出 → タイトル決め
   * ==================================================================== */

  function startForge() {
    show("forge");
    const log = $("forge-log");
    log.innerHTML = "";
    $("forge-title-pick").hidden = true;
    $("forge-title").textContent = "🧩 あなたの言葉を組み立てています…";

    const chars = totalAnswerChars();
    const style = Engine.detectStyle(state.answers);
    const lines = [
      `集めた言葉 … <b>${chars}字</b>`,
      `答えた質問 … <b>${answeredBaseCount() + state.followupAnswers.length}問</b>`,
      `文体を判定 … <b>${style === "p" ? "です・ます調" : "だ・である調"}</b>`,
      `段落に振り分けています …`,
      `つなぎの文を用意しました`,
      `<b>下書きができました。</b>`,
    ];

    lines.forEach((t, i) => {
      setTimeout(() => {
        const li = document.createElement("li");
        li.innerHTML = t;
        log.appendChild(li);
        if (i === lines.length - 1) {
          $("forge-title").textContent = "🧩 下書きができました";
          renderTitlePick();
          $("forge-title-pick").hidden = false;
        }
      }, 350 * (i + 1));
    });
  }

  function renderTitlePick() {
    const cands = Engine.titleCandidates(state);
    $("title-options").innerHTML = cands
      .map(
        (t, i) =>
          `<button class="title-opt${state.essayTitle === t ? " selected" : ""}" data-title="${esc(t)}">${esc(t)}</button>`
      )
      .join("");
    $("in-essay-title").value = cands.includes(state.essayTitle) ? "" : state.essayTitle || "";
  }

  $("title-options").addEventListener("click", (e) => {
    const t = e.target.getAttribute("data-title");
    if (!t) return;
    state.essayTitle = t;
    $("in-essay-title").value = "";
    renderTitlePick();
  });

  $("in-essay-title").addEventListener("input", (e) => {
    if (e.target.value.trim()) {
      state.essayTitle = e.target.value.trim();
      document.querySelectorAll(".title-opt").forEach((b) => b.classList.remove("selected"));
    }
  });

  $("btn-to-edit").addEventListener("click", () => {
    if (!state.essayTitle) state.essayTitle = Engine.titleCandidates(state)[0];
    const aud = AUDIENCES.find((a) => a.key === state.audience);
    if (aud) state.length = state.length || aud.defaultLength;
    rebuildEssay();
    renderEdit();
    show("edit");
  });

  /* =======================================================================
   * ⑤仕上げステージ
   * ==================================================================== */

  function rebuildEssay() {
    essay = Engine.buildEssay(state, {
      audience: state.audience,
      length: state.length,
      edits: state.edits,
      added: state.added,
      dropped: state.dropped,
    });
    return essay;
  }

  function renderEdit() {
    // 読者・字数の選択肢
    $("audience-options").innerHTML = AUDIENCES.map(
      (a) =>
        `<button class="opt${state.audience === a.key ? " selected" : ""}" data-aud="${a.key}">${a.label}</button>`
    ).join("");
    $("length-options").innerHTML = LENGTHS.map(
      (n) => `<button class="opt${state.length === n ? " selected" : ""}" data-len="${n}">${n}字</button>`
    ).join("");

    // メーター
    const pct = Math.min(100, Math.round((essay.chars / state.length) * 100));
    $("meter-chars").textContent = `${essay.chars}字 / ${state.length}字`;
    $("meter-chars-bar").style.width = pct + "%";
    const diff = essay.chars - state.length;
    $("meter-chars-note").textContent = essay.shortfall
      ? `あと${essay.shortfall}字ほど、自分の言葉を足すと目標にとどきます`
      : essay.overflow
      ? `${essay.overflow}字ほど多いです。いらない文を消すか、字数を上げてください`
      : diff > 0
      ? `目標より${diff}字多めですが、この範囲なら大丈夫です`
      : "目標の字数に入っています";

    $("meter-own").textContent = essay.ownRatio + "%";
    $("meter-own-bar").style.width = essay.ownRatio + "%";

    // ミッション
    const editedFrame = Object.keys(state.edits).some(
      (k) => k.startsWith("f:") && state.edits[k] !== undefined
    );
    const hasAdded = Object.values(state.added).some((arr) => arr && arr.length);
    const fits = !essay.shortfall && !essay.overflow;
    $("missions").innerHTML = [
      [editedFrame, "AIのつなぎの文を1つ以上、自分の言葉に書きかえた"],
      [hasAdded, "一番伝えたい一文を足した"],
      [fits, `字数を目標（${state.length}字）に近づけた`],
    ]
      .map(([done, text]) => `<li class="${done ? "done" : ""}">${done ? "✅" : "⬜️"} ${text}</li>`)
      .join("");

    $("edit-essay-title").textContent = state.essayTitle || "（無題）";
    renderEssay($("essay-body"), essay, true);

    // 使わなかった材料
    const drops = essay.dropped || [];
    $("dropped-card").hidden = drops.length === 0;
    $("dropped-list").innerHTML = drops
      .map(
        (d) => `
        <div class="dropped-item">
          <span>${esc(d.label)}（約${d.chars}字）${d.auto ? "<small>／字数に収まらないので外しました</small>" : ""}</span>
          <button class="ghost small" data-restore="${d.key}">${d.auto ? "字数を増やして戻す" : "戻す"}</button>
        </div>`
      )
      .join("");

    // 追記さきの段落
    $("add-block").innerHTML = essay.blocks
      .map((b) => `<option value="${b.key}">${esc(b.label)}</option>`)
      .join("");

    save();
  }

  /** 感想文を描く。editable=true なら文をタップして書きかえられる */
  function renderEssay(root, e, editable) {
    root.innerHTML = "";
    e.blocks.forEach((b) => {
      if (b.heading) {
        const h = document.createElement("h3");
        h.className = "md";
        h.textContent = b.heading;
        root.appendChild(h);
      }
      if (editable) {
        const head = document.createElement("div");
        head.className = "block-head";
        head.innerHTML = `${esc(b.label)} <button class="block-drop" data-drop="${b.key}" title="この段落を外す">✕</button>`;
        root.appendChild(head);
      }
      const p = document.createElement("p");
      b.sentences.forEach((s, i) => {
        const span = document.createElement("span");
        const edited = state.edits[s.id] !== undefined;
        span.className = "sent " + (s.from === "frame" ? "frame" : "mine") + (edited ? " edited" : "");
        span.textContent = s.text;
        if (editable) {
          span.dataset.sid = s.id;
          span.title = "タップして書きかえる";
        }
        p.appendChild(span);
        if (e.audience === "sns" && i < b.sentences.length - 1) p.appendChild(document.createElement("br"));
      });
      root.appendChild(p);

      if (editable && state.editingId) {
        const target = b.sentences.find((s) => s.id === state.editingId);
        if (target) root.appendChild(buildEditor(target));
      }
    });
  }

  function buildEditor(sent) {
    const box = document.createElement("div");
    box.className = "sent-editor";
    box.innerHTML = `
      <div class="note">${sent.from === "frame" ? "これはAIが用意したつなぎの文です。自分の言い方に変えてみよう。" : "あなたが書いた文です。読み返して整えてみよう。"}</div>
      <textarea rows="3">${esc(sent.text)}</textarea>
      <div class="ed-actions">
        <button class="ghost small" data-ed="cancel">やめる</button>
        <button class="ghost small" data-ed="delete">この文を消す</button>
        ${state.edits[sent.id] !== undefined ? '<button class="ghost small" data-ed="revert">もとに戻す</button>' : ""}
        <button class="primary small" data-ed="save">書きかえる</button>
      </div>`;

    box.querySelector("textarea").focus();
    box.addEventListener("click", (ev) => {
      const act = ev.target.getAttribute("data-ed");
      if (!act) return;
      const val = box.querySelector("textarea").value.trim();
      if (act === "save") state.edits[sent.id] = val;
      else if (act === "delete") state.edits[sent.id] = "";
      else if (act === "revert") delete state.edits[sent.id];
      state.editingId = null;
      rebuildEssay();
      checkTitles({ ownRatio: essay.ownRatio });
      renderEdit();
    });
    return box;
  }

  $("essay-body").addEventListener("click", (e) => {
    const drop = e.target.getAttribute("data-drop");
    if (drop) {
      if (!state.dropped.includes(drop)) state.dropped.push(drop);
      state.editingId = null;
      rebuildEssay();
      renderEdit();
      return;
    }
    const sid = e.target.dataset ? e.target.dataset.sid : null;
    if (!sid) return;
    state.editingId = state.editingId === sid ? null : sid;
    renderEdit();
  });

  $("audience-options").addEventListener("click", (e) => {
    const key = e.target.getAttribute("data-aud");
    if (!key) return;
    state.audience = key;
    const preset = AUDIENCES.find((a) => a.key === key);
    if (preset) state.length = preset.defaultLength;
    state.editingId = null;
    rebuildEssay();
    renderEdit();
  });

  $("length-options").addEventListener("click", (e) => {
    const n = e.target.getAttribute("data-len");
    if (!n) return;
    state.length = Number(n);
    state.editingId = null;
    rebuildEssay();
    renderEdit();
  });

  $("dropped-list").addEventListener("click", (e) => {
    const key = e.target.getAttribute("data-restore");
    if (!key) return;
    state.dropped = state.dropped.filter((k) => k !== key);
    const auto = (essay.dropped || []).find((d) => d.key === key && d.auto);
    if (auto) {
      const next = LENGTHS.find((n) => n > state.length);
      if (next) state.length = next;
    }
    rebuildEssay();
    renderEdit();
  });

  $("btn-add-sentence").addEventListener("click", () => {
    const key = $("add-block").value;
    const text = $("add-text").value.trim();
    if (!text) return;
    if (!state.added[key]) state.added[key] = [];
    state.added[key].push(text);
    $("add-text").value = "";
    rebuildEssay();
    checkTitles({ ownRatio: essay.ownRatio });
    renderEdit();
  });

  $("btn-finish").addEventListener("click", () => {
    rebuildEssay();
    checkTitles({ ownRatio: essay.ownRatio });
    viewingSaved = null;
    renderFinal();
    show("final");
  });

  /* =======================================================================
   * ⑥完成
   * ==================================================================== */

  function currentText() {
    return Engine.essayToText(essay, {
      title: state.essayTitle,
      reader: state.book.reader,
      book: state.book,
    });
  }

  function renderFinal() {
    const aud = AUDIENCES.find((a) => a.key === state.audience);
    $("final-summary").innerHTML = `
      <div><b>${essay.chars}字</b>できあがり</div>
      <div><b>${essay.ownRatio}%</b>自分の言葉</div>
      <div><b>${state.titles.length}</b>個の称号</div>
      <div><b>${aud ? aud.label : ""}</b>むけ</div>`;

    renderStatRow($("final-stats"), true);
    $("final-titles").innerHTML = TITLES.filter((t) => state.titles.includes(t.id))
      .map((t) => `<span class="title-badge">${t.emoji} ${esc(t.name)}<small>／${esc(t.desc)}</small></span>`)
      .join("");

    $("final-title").textContent = state.essayTitle || "（無題）";
    renderEssay($("final-body"), essay, false);
    $("final-credit").textContent =
      `『${state.book.title}』` +
      (state.book.author ? `（${state.book.author}）` : "") +
      (state.book.reader ? ` ／ ${state.book.reader}` : "");

    $("btn-back-edit").hidden = false;
    $("copy-msg").textContent = "";

    saveToLibrary({
      id: state.startedAt,
      savedAt: Date.now(),
      book: state.book,
      essayTitle: state.essayTitle,
      text: currentText(),
      chars: essay.chars,
      audience: state.audience,
      length: state.length,
      stats: state.stats,
      titles: state.titles,
    });
    save();
  }

  /** 書だなから開いたとき（テキストだけを表示する） */
  function renderSavedFinal(w) {
    $("final-summary").innerHTML = `
      <div><b>${w.chars}字</b>できあがり</div>
      <div><b>${(w.titles || []).length}</b>個の称号</div>
      <div><b>${new Date(w.savedAt).toLocaleDateString("ja-JP")}</b>に作成</div>`;
    $("final-stats").innerHTML = STAT_ORDER.map(
      (k) =>
        `<div class="stat-chip" data-stat="${k}"><b>${(w.stats && w.stats[k]) || 0}</b>${STATS[k].emoji} ${STATS[k].label}</div>`
    ).join("");
    $("final-titles").innerHTML = TITLES.filter((t) => (w.titles || []).includes(t.id))
      .map((t) => `<span class="title-badge">${t.emoji} ${esc(t.name)}</span>`)
      .join("");
    $("final-title").textContent = w.essayTitle || "（無題）";
    $("final-body").innerHTML = w.text
      .split(/\n{2,}/)
      .map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`)
      .join("");
    $("final-credit").textContent = "";
    $("btn-back-edit").hidden = true;
    $("copy-msg").textContent = "";
  }

  const outText = () => (viewingSaved ? viewingSaved.text : currentText());

  $("btn-copy").addEventListener("click", async () => {
    const text = outText();
    try {
      await navigator.clipboard.writeText(text);
      $("copy-msg").textContent = "コピーしました。原稿用紙アプリやWordに貼りつけてください。";
    } catch (e) {
      $("copy-msg").textContent = "コピーできませんでした。文章を長押しして選択してください。";
    }
  });

  $("btn-download").addEventListener("click", () => {
    const name = (viewingSaved ? viewingSaved.book.title : state.book.title) || "読書感想文";
    const blob = new Blob(["﻿" + outText()], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `読書感想文_${name}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  $("btn-print").addEventListener("click", () => window.print());

  $("btn-back-edit").addEventListener("click", () => {
    renderEdit();
    show("edit");
  });

  $("btn-again").addEventListener("click", () => {
    state = newState();
    viewingSaved = null;
    save();
    fillBookForm();
    renderStart();
    show("book");
  });

  /* =======================================================================
   * 起動
   * ==================================================================== */

  renderStart();
  show("start");
})();
