// 感謝脳ゲーム マルシェ版 — 画面。進行はサーバーが決め、ここは state を描くだけ
const socket = io("/games/kansha-marche");

const $ = (id) => document.getElementById(id);
const SCREENS = { title: "s-title", lobby: "s-lobby", writing: "s-write", voting: "s-vote", results: "s-result", final: "s-final" };
const REACTIONS = ["🙏", "🤣", "✨", "👏"];
const FULL_MS = { writing: 60000, voting: 25000, results: 12000 };

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

// 席の持ち主を示す鍵。ロック画面から戻っても同じ席に戻れるように保存する
const TOKEN_KEY = "kansha-marche-token";
function loadToken() {
  try {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (saved) return saved;
  } catch (e) {}
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const made = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  try {
    localStorage.setItem(TOKEN_KEY, made);
  } catch (e) {}
  return made;
}
const token = loadToken();

let state = null;
let renderedKey = "";
let deadline = null;
let lobbyIds = new Set();

function show(name) {
  Object.entries(SCREENS).forEach(([k, id]) => {
    $(id).hidden = k !== name;
  });
  $("react-bar").hidden = !["voting", "results", "final"].includes(name);
}

function setCommon(section) {
  section.querySelectorAll(".q-no").forEach((n) => (n.textContent = `第${state.round}問／全${state.rounds}問`));
  section.querySelectorAll(".topic-text").forEach((n) => (n.textContent = state.topic));
}

function renderLobby() {
  const list = $("lobby-players");
  const ids = new Set(state.players.map((p) => p.id));
  list.replaceChildren(
    ...state.players.map((p) => {
      const li = el("li", (p.id === state.me.id ? "me " : "") + (lobbyIds.has(p.id) ? "" : "pop"));
      li.append(el("span", "", p.avatar), el("span", "", p.name));
      return li;
    })
  );
  lobbyIds = ids;
}

function renderChips(list, doneKey, doneLabel) {
  list.replaceChildren(
    ...state.players.map((p) => el("li", p[doneKey] ? "done" : "", `${p.avatar} ${p.name}${p[doneKey] ? " " + doneLabel : ""}`))
  );
}

function renderWrite(fresh) {
  const section = $("s-write");
  setCommon(section);
  if (fresh) {
    $("answer").value = "";
    $("count").textContent = "0";
    $("write-error").hidden = true;
  }
  const submitted = !!state.me.answer;
  $("answer-form").hidden = submitted;
  $("write-done").hidden = !submitted;
  if (submitted) section.querySelector(".my-answer").textContent = `おかげで、${state.me.answer}。ありがとう！`;
  $("btn-hint").disabled = state.me.hinted;
  renderChips($("write-players"), "answered", "✓");
}

function renderVote(fresh) {
  const section = $("s-vote");
  setCommon(section);
  const list = $("vote-list");
  if (fresh) {
    list.replaceChildren(
      ...state.answers.map((a, i) => {
        const node = el(a.mine ? "div" : "button", "answer" + (a.mine ? " mine" : ""));
        node.style.animationDelay = `${i * 0.12}s`;
        node.append(el("span", "pre", "おかげで、"), document.createTextNode(a.text));
        if (a.mine) {
          node.append(el("span", "tag", "あなたの答え"));
        } else {
          node.type = "button";
          node.dataset.aid = a.aid;
          node.addEventListener("click", () => socket.emit("vote", { aid: a.aid }));
        }
        return node;
      })
    );
  }
  list.querySelectorAll("button.answer").forEach((b) => {
    b.classList.toggle("picked", Number(b.dataset.aid) === state.me.vote);
  });
}

function renderResult() {
  const section = $("s-result");
  setCommon(section);
  const topVotes = state.answers[0] ? state.answers[0].votes : 0;
  $("result-list").replaceChildren(
    ...state.answers.map((a, i) => {
      const isTop = topVotes > 0 && a.votes === topVotes;
      const node = el("div", "answer" + (isTop ? " top" : ""));
      node.style.animationDelay = `${i * 0.12}s`;
      node.append(el("span", "pre", "おかげで、"), document.createTextNode(a.text));
      if (isTop) node.append(el("span", "chop", "感謝"));
      const who = el("div", "who");
      who.append(el("span", "", `${a.avatar} ${a.name}${a.mine ? "（あなた）" : ""}`), el("span", "votes", a.votes ? "🙏".repeat(a.votes) : "―"));
      node.append(who);
      return node;
    })
  );
}

function renderFinal() {
  const bestBox = $("best");
  bestBox.hidden = !state.best;
  if (state.best) {
    bestBox.replaceChildren(
      el("small", "", "本日の名言"),
      el("p", "quote", `おかげで、${state.best.text}`),
      el("p", "from", `${state.best.avatar} ${state.best.name} ／ お題：${state.best.topic}`)
    );
  }
  $("rank-list").replaceChildren(
    ...state.ranking.map((r, i) => {
      const li = el("li", r.id === state.me.id ? "me" : "");
      li.style.animationDelay = `${i * 0.12}s`;
      li.append(el("span", "r", r.rank === 1 ? "一位" : `${r.rank}位`), el("span", "n", `${r.avatar} ${r.name}`), el("span", "s", `🙏 ${r.score}`));
      return li;
    })
  );
  const mine = $("my-best");
  mine.hidden = !state.myBest;
  if (state.myBest) {
    mine.replaceChildren(el("small", "", `あなたの感謝 ／ お題：${state.myBest.topic}`), el("p", "quote", `おかげで、${state.myBest.text}。ありがとう！`));
  }
}

function render() {
  const { phase, round } = state;
  const key = `${phase}:${round}`;
  const fresh = key !== renderedKey;
  renderedKey = key;
  show(phase);
  if (phase === "lobby") renderLobby();
  if (phase === "writing") renderWrite(fresh);
  if (phase === "voting") renderVote(fresh);
  if (phase === "results" && fresh) renderResult();
  if (phase === "final" && fresh) renderFinal();
  if (fresh) window.scrollTo(0, 0);
}

function tick() {
  if (!state || !$(SCREENS[state.phase]) || deadline == null) return;
  const left = Math.max(0, deadline - Date.now());
  const section = $(SCREENS[state.phase]);
  const clock = section.querySelector(".clock");
  const bar = section.querySelector(".bar i");
  if (clock) {
    clock.textContent = `${Math.ceil(left / 1000)}秒`;
    clock.classList.toggle("hurry", left <= 10000 && state.phase !== "results");
  }
  if (bar) bar.style.transform = `scaleX(${Math.min(1, left / FULL_MS[state.phase])})`;
}
setInterval(tick, 200);

let toastTimer = null;
function toast(message) {
  const box = $("toast");
  box.textContent = message;
  box.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (box.hidden = true), 3000);
}

function floatEmoji(emoji) {
  const node = el("span", "floater", emoji);
  node.style.left = `${8 + Math.random() * 80}%`;
  $("floaters").append(node);
  node.addEventListener("animationend", () => node.remove());
}

function goTitle() {
  state = null;
  renderedKey = "";
  deadline = null;
  lobbyIds = new Set();
  show("title");
}

// ---------- サーバーから ----------
socket.on("connect", () => {
  $("conn").hidden = true;
  socket.emit("resume", { token });
});
socket.on("disconnect", () => {
  $("conn").hidden = false;
});
socket.on("state", (next) => {
  state = next;
  deadline = next.remainMs == null ? null : Date.now() + next.remainMs;
  render();
  tick();
});
socket.on("noSeat", goTitle);
socket.on("hint", (text) => {
  const box = $("answer");
  box.value = text;
  $("count").textContent = String(text.length);
});
socket.on("errorMsg", (message) => {
  if (state && state.phase === "writing") {
    $("write-error").textContent = message;
    $("write-error").hidden = false;
  } else {
    toast(message);
  }
});
socket.on("reaction", floatEmoji);

// ---------- 操作 ----------
$("join-form").addEventListener("submit", (e) => {
  e.preventDefault();
  socket.emit("join", { token, name: $("name").value });
});
$("btn-start").addEventListener("click", () => socket.emit("start"));
$("btn-hint").addEventListener("click", () => socket.emit("hint"));
let draftTimer = null;
$("answer").addEventListener("input", (e) => {
  $("count").textContent = String(e.target.value.length);
  $("write-error").hidden = true;
  // 時間切れでも書きかけが答えになるよう、途中経過を送っておく
  clearTimeout(draftTimer);
  draftTimer = setTimeout(() => socket.emit("draft", { text: $("answer").value }), 300);
});
$("answer-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const text = $("answer").value.trim();
  if (!text) {
    $("write-error").textContent = "ひとことだけでも書いてみてください。";
    $("write-error").hidden = false;
    return;
  }
  socket.emit("answer", { text });
});
$("btn-again").addEventListener("click", () => {
  const name = state ? state.me.name : "";
  renderedKey = "";
  socket.emit("join", { token, name });
});

REACTIONS.forEach((emoji) => {
  const b = el("button", "", emoji);
  b.type = "button";
  b.setAttribute("aria-label", `${emoji} を送る`);
  b.addEventListener("click", () => socket.emit("react", { emoji }));
  $("react-bar").append(b);
});
