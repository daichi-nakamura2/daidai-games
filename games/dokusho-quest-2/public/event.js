// ============================================================
// 読書会モード(2.0) — クライアント
//   ホストがSTEPを進めると、部屋の全員の画面が同時に切り替わる。
//   中心にあるのは
//     仮アクション → みんなからのフィードバック → 最終アクション
//   という、自分の行動が変わっていく体験。
// ============================================================
window.DQ = window.DQ || {};

// ---------- モード選択(ランディング) ----------
DQ.Landing = function Landing({ theme, onToggleTheme, onPick }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 text-stone-800 transition-colors dark:from-stone-900 dark:to-stone-950 dark:text-stone-100">
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:py-8">
        <DQ.Header theme={theme} onToggleTheme={onToggleTheme} />

        <p className="animate-fade-up text-center text-sm text-stone-600 dark:text-stone-300">
          本の学びを、仲間との対話を通して<strong>行動</strong>に変えるゲーム。
        </p>

        <div className="grid animate-fade-up gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onPick("circle")}
            className="flex flex-col items-center gap-2 rounded-2xl border-2 border-amber-400 bg-gradient-to-br from-amber-100 to-orange-100 p-6 text-center shadow-md transition hover:scale-[1.02] active:scale-95 sm:order-first dark:border-amber-600 dark:from-stone-800 dark:to-amber-950"
          >
            <span className="text-5xl">👥</span>
            <span className="font-pixel text-lg text-stone-800 dark:text-amber-100">
              読書会をひらく / 参加する
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              読む → 話す → フィードバックをもらう → 明日の一歩を決める。
              進行はぜんぶゲームの中で。
            </span>
          </button>

          <button
            type="button"
            onClick={() => onPick("solo")}
            className="flex flex-col items-center gap-2 rounded-2xl border-2 border-amber-300 bg-white/80 p-6 text-center shadow-md transition hover:scale-[1.02] active:scale-95 dark:border-amber-700 dark:bg-stone-800/80"
          >
            <span className="text-5xl">🧙</span>
            <span className="font-pixel text-lg text-stone-800 dark:text-amber-100">
              ひとりで冒険
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              いつもの読書クエスト。自分のペースでレベルアップ。
            </span>
          </button>
        </div>

        <DQ.FlowGuide open={false} compact />
      </div>
    </div>
  );
};

// ---------- 入室フォーム ----------
function EventEntry({ error, initialCode, initialName, onCreate, onJoin }) {
  const [tab, setTab] = React.useState(initialCode ? "join" : "join");
  const [name, setName] = React.useState(initialName || "");
  const [code, setCode] = React.useState(initialCode || "");

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (tab === "create") onCreate(name);
    else if (code.trim()) onJoin(code, name);
  };

  const tabClass = (on) =>
    on
      ? "rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2 text-sm font-bold text-white shadow"
      : "rounded-full border-2 border-amber-300 bg-white/70 px-5 py-2 text-sm font-bold text-stone-500 dark:border-stone-600 dark:bg-stone-800/70 dark:text-stone-400";

  return (
    <section className="animate-fade-up space-y-4">
      <div className="flex justify-center gap-2">
        <button type="button" onClick={() => setTab("join")} className={tabClass(tab === "join")}>
          部屋に入る
        </button>
        <button type="button" onClick={() => setTab("create")} className={tabClass(tab === "create")}>
          部屋をつくる(主催者)
        </button>
      </div>

      <form
        onSubmit={submit}
        className="space-y-3 rounded-2xl border-2 border-amber-300 bg-white/80 p-5 shadow-md dark:border-amber-700 dark:bg-stone-800/80"
      >
        <div>
          <label className="text-sm font-bold text-stone-600 dark:text-stone-300">
            ニックネーム
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="読書会で表示される名前"
            maxLength={20}
            autoFocus
            className="mt-1 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:ring-2 focus:ring-amber-400 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
          />
        </div>

        {tab === "join" && (
          <div>
            <label className="text-sm font-bold text-stone-600 dark:text-stone-300">
              部屋コード(4文字)
            </label>
            {initialCode ? (
              <p className="mt-1 rounded-lg bg-amber-100 px-3 py-2 text-center text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                招待リンクからコードを入力しました。名前を入れて「この部屋に入る」を押してください。
              </p>
            ) : null}
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="例: AB12"
              maxLength={4}
              autoCapitalize="characters"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className="mt-1 w-full rounded-lg border border-amber-300 bg-white px-3 py-3 text-center text-2xl font-bold tracking-[0.4em] text-stone-800 uppercase outline-none focus:ring-2 focus:ring-amber-400 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
            />
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!name.trim() || (tab === "join" && !code.trim())}
          className="w-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 py-3 font-bold text-white shadow transition hover:brightness-110 active:scale-95 disabled:opacity-40"
        >
          {tab === "create" ? "部屋をつくって入る" : "この部屋に入る"}
        </button>
      </form>

      <DQ.FlowGuide open={false} compact />
    </section>
  );
}

// ---------- 部屋コードと招待リンク ----------
function RoomInvite({ code }) {
  const [copied, setCopied] = React.useState(false);
  const [linkCopied, setLinkCopied] = React.useState(false);
  const inviteUrl = `${location.origin}${location.pathname}?room=${code}`;

  const flash = (set) => {
    set(true);
    setTimeout(() => set(false), 1500);
  };

  const copyCode = () =>
    navigator.clipboard.writeText(code).then(() => flash(setCopied)).catch(() => {});

  const shareInvite = () => {
    const text = `読書クエスト2.0の読書会に参加してね!部屋コード: ${code}`;
    if (navigator.share) {
      navigator.share({ text, url: inviteUrl }).catch(() => {});
    } else {
      navigator.clipboard
        .writeText(inviteUrl)
        .then(() => flash(setLinkCopied))
        .catch(() => {});
    }
  };

  return (
    <section className="rounded-2xl border-2 border-amber-400 bg-gradient-to-br from-amber-100 to-orange-100 p-4 text-center shadow-md dark:border-amber-700 dark:from-stone-800 dark:to-amber-950">
      <p className="text-xs text-amber-700 dark:text-amber-300">部屋コード</p>
      <div className="mt-1 flex items-center justify-center gap-3">
        <span className="font-pixel text-4xl tracking-widest text-stone-800 dark:text-amber-100">
          {code}
        </span>
        <button
          type="button"
          onClick={copyCode}
          className="rounded-full border-2 border-amber-400 bg-white/70 px-3 py-1.5 text-xs font-bold text-amber-700 transition hover:bg-amber-50 active:scale-95 dark:bg-stone-800/70 dark:text-amber-300"
        >
          {copied ? "コピーしました!" : "📋 コピー"}
        </button>
      </div>
      <button
        type="button"
        onClick={shareInvite}
        className="mt-3 w-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 text-sm font-bold text-white shadow transition hover:brightness-110 active:scale-95"
      >
        {linkCopied ? "リンクをコピーしました!" : "🔗 招待リンクを送る"}
      </button>
      <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
        リンクを送れば、仲間はコードを打たずにタップだけで参加できます
      </p>
    </section>
  );
}

// ---------- STEP1: 本とミッションカード ----------
function MissionStep({ entry, onDecide }) {
  const [bookTitle, setBookTitle] = React.useState("");
  const [picking, setPicking] = React.useState(false);

  // すでにカードが決まっている(サーバーに保存ずみ)
  if (entry && entry.hasMission && !picking) {
    return (
      <section className="space-y-3 text-center">
        <div className="rounded-2xl border-2 border-amber-300 bg-white/80 p-5 shadow-md dark:border-amber-700 dark:bg-stone-800/80">
          <p className="text-xs text-stone-500 dark:text-stone-400">今日の冒険の書</p>
          <p className="mt-0.5 font-bold text-stone-800 dark:text-stone-100">
            📖『{entry.bookTitle}』
          </p>
          <p className="mt-3 text-4xl">{entry.missionIcon}</p>
          <p className="font-pixel mt-1 text-lg text-stone-800 dark:text-amber-100">
            {entry.missionTitle}
          </p>
          <p className="mt-3 text-sm font-bold text-emerald-600 dark:text-emerald-400">
            ✅ 準備できました!
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setBookTitle(entry.bookTitle);
            setPicking(true);
          }}
          className="text-sm text-stone-500 underline dark:text-stone-400"
        >
          本やカードを選びなおす
        </button>
      </section>
    );
  }

  // 本のタイトルがまだ
  if (!bookTitle.trim()) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const v = e.target.elements.book.value.trim();
          if (v) setBookTitle(v);
        }}
        className="rounded-2xl border-2 border-amber-300 bg-white/80 p-5 text-center shadow-md dark:border-amber-700 dark:bg-stone-800/80"
      >
        <p className="font-pixel text-lg text-stone-800 dark:text-amber-100">
          📖 今日は何を読む?
        </p>
        <input
          name="book"
          type="text"
          defaultValue={entry ? entry.bookTitle : ""}
          placeholder="本のタイトル"
          autoFocus
          maxLength={60}
          className="mt-3 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:ring-2 focus:ring-amber-400 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
        />
        <button
          type="submit"
          className="mt-3 w-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 font-bold text-white shadow transition hover:brightness-110 active:scale-95"
        >
          ミッションカードを引く
        </button>
      </form>
    );
  }

  // カード抽選
  return (
    <DQ.MissionDraw
      book={{ title: bookTitle }}
      hideTime
      backLabel="← 本を選びなおす"
      startLabel="このカードで挑む"
      onStart={(mission) => {
        setPicking(false);
        onDecide(bookTitle, mission);
      }}
      onBack={() => setBookTitle("")}
    />
  );
}

// ---------- STEP3+4: 読書内容の整理と「仮アクション」 ----------
function DraftForm({ entry, minutes, onSubmit }) {
  const [memo, setMemo] = React.useState(entry ? entry.memo : "");
  const [action, setAction] = React.useState(entry ? entry.draftAction : "");
  const memoRef = React.useRef(null);
  const caretToEndRef = React.useRef(false);

  const mission = {
    icon: entry ? entry.missionIcon : "🎴",
    title: entry ? entry.missionTitle : "",
    bonusXp: 0,
    hints: null,
  };
  // カード別の書き出しヒント(カードのIDはサーバーに送っていないのでタイトルで引く)
  const card = DQ.MISSIONS.find((m) => m.title === mission.title);
  const hints = (card && card.hints) || DQ.DEFAULT_HINTS;
  const len = memo.trim().length;
  const nextTier = [...DQ.DEEP_TIERS].reverse().find((t) => len < t.chars);

  const insertHint = (hint) => {
    caretToEndRef.current = true;
    setMemo((prev) => {
      const base = prev.replace(/\s+$/, "");
      return (base ? base + "\n" : "") + hint;
    });
  };
  React.useLayoutEffect(() => {
    if (!caretToEndRef.current) return;
    caretToEndRef.current = false;
    const el = memoRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, [memo]);

  const xp = DQ.calcSessionXp({
    mission: { title: mission.title, bonusXp: card ? card.bonusXp : 0 },
    memo,
    action,
    minutes,
  }).xpGained;

  return (
    <div className="space-y-4">
      {/* 読書内容を整理する */}
      <section className="rounded-2xl border-2 border-amber-300 bg-white/80 p-4 shadow-md dark:border-amber-700 dark:bg-stone-800/80">
        <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
          {mission.icon} {mission.title}
        </p>
        <p className="mt-2 text-sm font-bold text-stone-700 dark:text-stone-200">
          ① 読んで印象に残ったこと・気づいたこと・学んだこと
        </p>

        <div className="mt-2">
          <p className="text-xs font-bold text-stone-500 dark:text-stone-400">
            ✏️ 書き出しヒント(タップで入る)
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {hints.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => insertHint(h)}
                className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs text-amber-800 transition hover:bg-amber-100 active:scale-95 dark:border-stone-600 dark:bg-stone-700/60 dark:text-amber-200"
              >
                {h}
              </button>
            ))}
          </div>
        </div>

        <textarea
          ref={memoRef}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={6}
          maxLength={500}
          placeholder="あとで2分くらいで話す内容です。箇条書きでもOK!"
          className="mt-3 w-full resize-none rounded-xl border border-amber-300 bg-amber-50/50 px-3 py-2 text-sm text-stone-800 outline-none focus:ring-2 focus:ring-amber-400 dark:border-stone-600 dark:bg-stone-700/50 dark:text-stone-100"
        />
        <div className="mt-1 flex items-center justify-between gap-2 text-xs">
          <span className="text-stone-500 dark:text-stone-400">{len} / 500字</span>
          <span className="font-bold text-amber-600 dark:text-amber-400">
            {nextTier
              ? `あと${nextTier.chars - len}字で じっくりボーナス +${nextTier.xp}`
              : "🌟 じっくりボーナス最大!"}
          </span>
        </div>
      </section>

      {/* 仮アクション */}
      <section className="rounded-2xl border-2 border-sky-300 bg-sky-50/70 p-4 shadow-md dark:border-sky-800 dark:bg-sky-950/30">
        <p className="text-sm font-bold text-stone-700 dark:text-stone-200">
          ② この読書をもとに、自分は何をやってみたい?
        </p>
        <p className="mt-1 rounded-lg bg-white/70 px-3 py-2 text-xs text-stone-600 dark:bg-stone-900/50 dark:text-stone-300">
          これは<strong className="text-sky-700 dark:text-sky-300">仮アクション</strong>です。
          まだ大きくても、ざっくりでも大丈夫。
          このあとみんなに話して、もらった言葉で書きかえます。
        </p>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {DQ.DRAFT_HINTS.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setAction((a) => (a ? a : h))}
              className="rounded-full border border-sky-300 bg-white/70 px-3 py-1 text-xs text-sky-800 transition hover:bg-sky-100 active:scale-95 dark:border-sky-800 dark:bg-stone-800/70 dark:text-sky-200"
            >
              {h}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          maxLength={100}
          placeholder="例: 毎日30分運動する"
          className="mt-2 w-full rounded-lg border border-sky-300 bg-white px-3 py-2.5 text-sm font-bold text-stone-800 outline-none focus:ring-2 focus:ring-sky-400 dark:border-sky-800 dark:bg-stone-800 dark:text-stone-100"
        />
      </section>

      <p className="text-center text-sm text-stone-600 dark:text-stone-300">
        提出すると{" "}
        <span className="font-bold text-orange-600 dark:text-orange-400">+{xp} EXP</span>
      </p>
      <button
        type="button"
        onClick={() => onSubmit(memo, action)}
        disabled={!action.trim()}
        className="w-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 py-3.5 font-pixel text-lg text-white shadow-md transition hover:brightness-110 active:scale-95 disabled:opacity-40"
      >
        {entry && entry.hasDraft ? "書きなおして提出する" : "書けた!共有の準備OK"}
      </button>
      {!action.trim() && (
        <p className="text-center text-xs text-stone-500 dark:text-stone-400">
          仮アクションを1つ書くと提出できます
        </p>
      )}
    </div>
  );
}

// ---------- フィードバックを贈るシート ----------
function FeedbackSheet({ target, onSend, onClose }) {
  const [comment, setComment] = React.useState("");
  const ng = DQ.findNgWord(comment);
  const hasComment = comment.trim().length > 0;
  const gifterXp = DQ.GIFT_XP_TO_GIFTER + (hasComment ? DQ.GIFT_COMMENT_BONUS : 0);

  React.useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="フィードバックを贈る"
        onClick={(e) => e.stopPropagation()}
        className="animate-pop-in max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl border-2 border-pink-300 bg-white p-5 shadow-xl sm:rounded-3xl dark:border-pink-800 dark:bg-stone-900"
      >
        <p className="font-pixel text-lg text-stone-800 dark:text-pink-100">
          💌 {target.name} さんへのフィードバック
        </p>
        <p className="mt-1 rounded-lg bg-pink-50 px-3 py-1.5 text-xs text-stone-600 dark:bg-pink-950/40 dark:text-stone-300">
          🎯 仮アクション: {target.draftAction || "(まだ書かれていません)"}
        </p>

        <p className="mt-4 text-sm font-bold text-stone-600 dark:text-stone-300">
          ひとことえらぶ(タップで入る)
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {DQ.FEEDBACK_STAMPS.map((s) => {
            const picked = comment === s.text;
            return (
              <button
                key={s.text}
                type="button"
                onClick={() => setComment(picked ? "" : s.text)}
                className={
                  "rounded-xl border-2 px-2 py-2 text-left text-xs font-bold transition active:scale-95 " +
                  (picked
                    ? "border-pink-400 bg-pink-100 text-pink-800 dark:border-pink-500 dark:bg-pink-950 dark:text-pink-200"
                    : "border-amber-200 bg-amber-50/60 text-stone-700 hover:bg-amber-100 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200")
                }
              >
                <span className="mr-1">{s.icon}</span>
                {s.text}
              </button>
            );
          })}
        </div>

        <label className="mt-4 block text-sm font-bold text-stone-600 dark:text-stone-300">
          自分の言葉で書く(任意)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={DQ.MAX_CHEER}
          rows={2}
          placeholder="例: そのアクション、もっと小さくしても良さそう!"
          className="mt-1 w-full resize-none rounded-xl border border-pink-300 bg-pink-50/40 px-3 py-2 text-sm text-stone-800 outline-none focus:ring-2 focus:ring-pink-300 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
        />
        <div className="flex justify-between text-xs text-stone-500 dark:text-stone-400">
          <span>{ng ? "" : "前向きな言葉だけ届けられます"}</span>
          <span>
            {comment.length} / {DQ.MAX_CHEER}
          </span>
        </div>
        {ng && (
          <p className="mt-2 rounded-lg bg-amber-100 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            🌷「{ng}」はフィードバックにはちょっと強い言葉かも。
            よかったところや、自分ならどうするかを伝える言葉に言いかえてみよう
          </p>
        )}

        <div className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-center text-xs text-stone-600 dark:bg-stone-800 dark:text-stone-300">
          {target.name} さん{" "}
          <span className="font-bold text-orange-600 dark:text-orange-400">
            +{DQ.GIFT_XP_TO_AUTHOR} EXP
          </span>
          {" ・ "}
          あなた{" "}
          <span className="font-bold text-orange-600 dark:text-orange-400">
            +{gifterXp} EXP
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row-reverse">
          <button
            type="button"
            onClick={() => onSend(comment.trim())}
            disabled={!!ng}
            className="rounded-full bg-gradient-to-r from-pink-500 to-orange-500 px-6 py-3 font-bold text-white shadow transition hover:brightness-110 active:scale-95 disabled:opacity-40 sm:flex-1"
          >
            {hasComment ? "💌 ひとこと添えて贈る" : "🎁 EXPだけ贈る"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border-2 border-stone-300 px-6 py-2 text-sm font-bold text-stone-500 transition hover:bg-stone-50 active:scale-95 dark:border-stone-600 dark:text-stone-400 dark:hover:bg-stone-800"
          >
            やめる
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- 届いたフィードバックの通知 ----------
function FeedbackToasts({ toasts }) {
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-40 flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="animate-pop-in w-full max-w-md rounded-2xl border-2 border-pink-300 bg-white/95 px-4 py-3 shadow-lg dark:border-pink-800 dark:bg-stone-900/95"
        >
          <p className="text-sm font-bold text-pink-700 dark:text-pink-300">
            💌 {t.gifterName} さんからフィードバック! +{DQ.GIFT_XP_TO_AUTHOR} EXP
          </p>
          {t.comment && (
            <p className="mt-0.5 text-sm text-stone-700 dark:text-stone-200">
              「{t.comment}」
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------- フィードバック一覧 ----------
function FeedbackList({ feedback, empty }) {
  if (feedback.length === 0) {
    return empty ? (
      <p className="rounded-lg bg-white/60 px-3 py-2 text-center text-xs text-stone-500 dark:bg-stone-900/40 dark:text-stone-400">
        {empty}
      </p>
    ) : null;
  }
  return (
    <ul className="space-y-1.5">
      {feedback.map((f) => (
        <li
          key={f.gifterId}
          className="rounded-lg border border-pink-200 bg-pink-50/70 px-3 py-2 text-sm text-stone-700 dark:border-pink-900 dark:bg-pink-950/30 dark:text-stone-200"
        >
          💌 <span className="font-bold">{f.gifterName}</span>
          {f.comment ? `「${f.comment}」` : " が応援してくれました"}
        </li>
      ))}
    </ul>
  );
}

// ---------- 発表内容のカード ----------
function EntryCard({ entry, big }) {
  return (
    <div
      className={
        "rounded-2xl border-2 border-amber-300 bg-white/85 shadow-md dark:border-amber-700 dark:bg-stone-800/85 " +
        (big ? "p-5" : "p-4")
      }
    >
      <p className="text-xs text-stone-500 dark:text-stone-400">
        📖『{entry.bookTitle || "(無題)"}』
      </p>
      <p className="mt-0.5 text-sm font-bold text-amber-700 dark:text-amber-300">
        {entry.missionIcon} {entry.missionTitle}
      </p>

      {entry.memo ? (
        <p
          className={
            "mt-3 rounded-xl bg-amber-50/70 px-3 py-2.5 whitespace-pre-wrap text-stone-700 dark:bg-stone-900/50 dark:text-stone-200 " +
            (big ? "text-base" : "text-sm")
          }
        >
          {entry.memo}
        </p>
      ) : (
        <p className="mt-3 text-sm text-stone-400">（メモは書かれていません）</p>
      )}

      <div className="mt-3 rounded-xl border-2 border-sky-300 bg-sky-50/70 px-3 py-2.5 dark:border-sky-800 dark:bg-sky-950/30">
        <p className="text-xs font-bold text-sky-700 dark:text-sky-300">【仮アクション】</p>
        <p
          className={
            "mt-0.5 font-bold text-stone-800 dark:text-stone-100 " +
            (big ? "text-lg" : "text-sm")
          }
        >
          {entry.draftAction || "（まだ書かれていません）"}
        </p>
      </div>
    </div>
  );
}

// ---------- STEP4+5: 共有とフィードバック ----------
function SpotlightView({
  room,
  selfId,
  entriesById,
  onOpenFeedback,
  isHost,
  onMove,
  onStopTimer,
  onExtendTimer,
}) {
  const [showPast, setShowPast] = React.useState(false);
  const stage = room.stage;
  if (!stage || stage.order.length === 0) {
    return <DQ.WaitingNote phase="share" />;
  }

  const currentId = stage.currentId;
  const current = room.players.find((p) => p.id === currentId);
  const entry = entriesById.get(currentId);
  const isMe = currentId === selfId;
  const gifted = entry ? entry.gifterIds.includes(selfId) : false;
  const done = stage.index >= stage.order.length - 1;
  // 発表者以外の何人がフィードバックを贈ったか
  const others = Math.max(0, room.players.length - 1);
  const gaveCount = entry ? entry.feedbackCount : 0;
  const allGave = others > 0 && gaveCount >= others;

  const past = stage.order
    .slice(0, stage.index)
    .map((id) => entriesById.get(id))
    .filter(Boolean);

  return (
    <div className="space-y-4">
      {/* 今だれの番か */}
      <section className="rounded-2xl border-2 border-orange-400 bg-gradient-to-br from-orange-100 to-pink-100 p-4 text-center shadow-md dark:border-orange-700 dark:from-stone-800 dark:to-orange-950">
        <p className="text-xs font-bold text-orange-700 dark:text-orange-300">
          いま発表中 ({stage.index + 1} / {stage.total}人目)
        </p>
        <p className="font-pixel mt-1 text-2xl text-stone-800 sm:text-3xl dark:text-amber-100">
          🎤 {current ? current.name : "…"}
        </p>
        {isMe && (
          <p className="mt-1 text-sm font-bold text-orange-600 dark:text-orange-400">
            あなたの番です!読んだ内容と仮アクションを話してください
          </p>
        )}
      </section>

      <DQ.SharedTimer
        timer={room.timer}
        isHost={isHost}
        onStop={onStopTimer}
        onExtend={onExtendTimer}
        note={
          isMe
            ? "話し終わったら、みんなからのフィードバックを受け取ろう"
            : "聞きながら、贈りたい言葉を考えておこう"
        }
      />

      {entry && entry.hasDraft ? (
        <EntryCard entry={entry} big />
      ) : (
        // 途中参加などでまだ何も書いていない人。口頭での共有はできるので、
        // 画面を空にせず、そのまま聞いてフィードバックできるようにしておく
        <p className="rounded-2xl border-2 border-amber-200 bg-white/70 px-4 py-4 text-center text-sm text-stone-500 dark:border-stone-600 dark:bg-stone-800/60 dark:text-stone-400">
          この人はまだ書いたものを提出していません。
          <br />
          話を聞いて、そのままフィードバックを贈ってあげてください。
        </p>
      )}

      {/* フィードバック */}
      <section className="rounded-2xl border-2 border-pink-300 bg-pink-50/60 p-4 shadow-md dark:border-pink-800 dark:bg-pink-950/20">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-pixel text-base text-stone-800 dark:text-pink-100">
            💌 みんなからのフィードバック
          </h3>
          {/* ホストが「全員ひとこと言い終わったか」を見て、次の人へ進む目安にする */}
          <span
            className={
              "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold " +
              (allGave
                ? "bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                : "bg-pink-200 text-pink-800 dark:bg-pink-900 dark:text-pink-200")
            }
          >
            {gaveCount} / {others} 人{allGave ? " 全員ぶん!" : ""}
          </span>
        </div>
        <div className="mt-2">
          <FeedbackList
            feedback={entry ? entry.feedback : []}
            empty={
              isMe
                ? "まだありません。みんなの言葉を待ちましょう"
                : "最初のひとことを贈ってみよう!"
            }
          />
        </div>

        {!isMe && (
          <button
            type="button"
            onClick={() => onOpenFeedback(currentId)}
            disabled={gifted}
            className={
              "mt-3 w-full rounded-full py-3 font-bold shadow transition active:scale-95 " +
              (gifted
                ? "bg-pink-200 text-pink-800 dark:bg-pink-900 dark:text-pink-200"
                : "bg-gradient-to-r from-pink-500 to-orange-500 text-white hover:brightness-110 disabled:opacity-40")
            }
          >
            {gifted ? "✅ 贈りました" : "💌 フィードバックを贈る"}
          </button>
        )}
        <p className="mt-2 text-center text-xs text-stone-500 dark:text-stone-400">
          「それいいですね」「自分だったらこうする」など自由にどうぞ
        </p>
      </section>

      {/* ホストの進行操作 */}
      {isHost && (
        <div className="rounded-2xl border-2 border-indigo-300 bg-indigo-50/80 p-3 dark:border-indigo-800 dark:bg-indigo-950/40">
          <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
            👑 発表者の切り替え
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => onMove(-1)}
              disabled={stage.index === 0}
              className="rounded-full border-2 border-indigo-300 bg-white/70 px-4 py-2 text-sm font-bold text-indigo-700 transition active:scale-95 disabled:opacity-30 dark:bg-stone-800/70 dark:text-indigo-300"
            >
              ← 前の人
            </button>
            <button
              type="button"
              onClick={() => onMove(1)}
              disabled={done}
              className="flex-1 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-bold text-white shadow transition hover:brightness-110 active:scale-95 disabled:opacity-30"
            >
              {done ? "最後の人です" : "次の人へ →（タイマーも再スタート）"}
            </button>
          </div>
          <ol className="mt-2 flex flex-wrap gap-1">
            {stage.order.map((id, i) => {
              const p = room.players.find((x) => x.id === id);
              return (
                <li
                  key={id}
                  className={
                    "rounded-full px-2 py-0.5 text-[11px] " +
                    (i === stage.index
                      ? "bg-indigo-500 font-bold text-white"
                      : i < stage.index
                        ? "bg-indigo-100 text-indigo-400 line-through dark:bg-indigo-900/50"
                        : "bg-white text-indigo-600 dark:bg-stone-800 dark:text-indigo-300")
                  }
                >
                  {i + 1}. {p ? p.name : "…"}
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* 終わった人にも、あとから贈れる */}
      {past.length > 0 && (
        <section className="rounded-2xl border-2 border-amber-300 bg-white/80 p-4 shadow-md dark:border-amber-700 dark:bg-stone-800/80">
          <button
            type="button"
            onClick={() => setShowPast((v) => !v)}
            className="flex w-full items-center justify-between text-left"
          >
            <h3 className="font-pixel text-base text-stone-800 dark:text-amber-100">
              📜 発表がすんだ人({past.length}人)
            </h3>
            <span className="text-sm text-stone-400">{showPast ? "▲" : "▼"}</span>
          </button>
          {showPast && (
            <ul className="mt-3 space-y-3">
              {past.map((e) => {
                const already = e.gifterIds.includes(selfId);
                return (
                  <li key={e.playerId} className="space-y-2">
                    <p className="text-sm font-bold text-stone-700 dark:text-stone-200">
                      {e.name}
                    </p>
                    <EntryCard entry={e} />
                    {e.playerId !== selfId && (
                      <button
                        type="button"
                        onClick={() => onOpenFeedback(e.playerId)}
                        disabled={already}
                        className={
                          "w-full rounded-full py-2 text-sm font-bold transition active:scale-95 " +
                          (already
                            ? "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300"
                            : "bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow hover:brightness-110")
                        }
                      >
                        {already ? "✅ 贈りました" : "💌 あとからフィードバックを贈る"}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

// ---------- 仮アクション → フィードバック → 最終アクション ----------
// このゲームの中心体験。「人に話したことで行動が具体化した」のを目に見える形にする。
DQ.ChangeCard = function ChangeCard({ entry, compact }) {
  const changed = entry.finalAction && entry.finalAction !== entry.draftAction;

  return (
    <section className="rounded-2xl border-2 border-emerald-300 bg-gradient-to-b from-white to-emerald-50/60 p-4 shadow-md dark:border-emerald-800 dark:from-stone-800 dark:to-emerald-950/30">
      {!compact && (
        <h3 className="font-pixel text-base text-stone-800 dark:text-emerald-100">
          ✨ あなたの行動の変化
        </h3>
      )}

      <div className="mt-2 rounded-xl border border-sky-300 bg-sky-50/70 px-3 py-2.5 dark:border-sky-800 dark:bg-sky-950/30">
        <p className="text-xs font-bold text-sky-700 dark:text-sky-300">【仮アクション】</p>
        <p className="mt-0.5 text-sm text-stone-700 dark:text-stone-200">
          {entry.draftAction || "（なし）"}
        </p>
      </div>

      <div className="py-1 text-center text-lg text-pink-400">↓</div>

      <div className="rounded-xl border border-pink-200 bg-pink-50/60 px-3 py-2.5 dark:border-pink-900 dark:bg-pink-950/25">
        <p className="text-xs font-bold text-pink-700 dark:text-pink-300">
          【みんなからのフィードバック】({entry.feedbackCount})
        </p>
        <div className="mt-1.5">
          <FeedbackList
            feedback={entry.feedback}
            empty="（フィードバックはまだありません）"
          />
        </div>
      </div>

      <div className="py-1 text-center text-lg text-emerald-500">↓</div>

      <div className="rounded-xl border-2 border-emerald-400 bg-emerald-50 px-3 py-3 dark:border-emerald-600 dark:bg-emerald-950/40">
        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
          【最終アクション】
        </p>
        <p className="mt-0.5 font-bold text-stone-800 dark:text-stone-100">
          🎯 {entry.finalAction || "（まだ決まっていません）"}
        </p>
      </div>

      {entry.hasFinal && (
        <p
          className={
            "mt-3 rounded-lg px-3 py-2 text-center text-sm font-bold " +
            (changed
              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
              : "bg-stone-100 text-stone-600 dark:bg-stone-700/50 dark:text-stone-300")
          }
        >
          {changed
            ? "🌟 人に話したことで、行動がここまで具体的になりました!"
            : "🔥 みんなの言葉を受けても、この一歩を貫きました!"}
        </p>
      )}
    </section>
  );
};

// ---------- STEP6: 最終アクションを決める ----------
function FinalForm({ entry, onSubmit }) {
  const [action, setAction] = React.useState(entry.finalAction || "");
  const inputRef = React.useRef(null);
  const changed = action.trim() && action.trim() !== entry.draftAction;
  const xp = changed ? DQ.FINAL_XP_CHANGED : DQ.FINAL_XP_KEPT;

  const useHint = (h) => {
    setAction((a) => (a.trim() ? a : h + " "));
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div className="space-y-4">
      {/* 振り返り: 仮アクションともらった言葉 */}
      <section className="rounded-2xl border-2 border-amber-300 bg-white/80 p-4 shadow-md dark:border-amber-700 dark:bg-stone-800/80">
        <div className="rounded-xl border border-sky-300 bg-sky-50/70 px-3 py-2.5 dark:border-sky-800 dark:bg-sky-950/30">
          <p className="text-xs font-bold text-sky-700 dark:text-sky-300">
            あなたの【仮アクション】
          </p>
          <p className="mt-0.5 font-bold text-stone-800 dark:text-stone-100">
            {entry.draftAction || "（なし）"}
          </p>
        </div>
        <p className="mt-3 text-xs font-bold text-pink-700 dark:text-pink-300">
          💌 みんなからのフィードバック({entry.feedbackCount})
        </p>
        <div className="mt-1.5">
          <FeedbackList
            feedback={entry.feedback}
            empty="（フィードバックはまだ届いていません）"
          />
        </div>
      </section>

      {/* ルール */}
      <section className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/70 p-4 shadow-md dark:border-emerald-800 dark:bg-emerald-950/25">
        <p className="font-pixel text-base text-stone-800 dark:text-emerald-100">
          🎯 最終アクションの3つのルール
        </p>
        <ul className="mt-2 grid gap-1.5 sm:grid-cols-3">
          {DQ.ACTION_RULES.map((r) => (
            <li
              key={r.text}
              className="rounded-lg bg-white/80 px-3 py-2 text-center text-xs font-bold text-emerald-800 dark:bg-stone-900/50 dark:text-emerald-200"
            >
              <span className="mr-1">{r.icon}</span>
              {r.text}
            </li>
          ))}
        </ul>
        <div className="mt-3 rounded-lg bg-white/70 px-3 py-2 text-xs text-stone-600 dark:bg-stone-900/50 dark:text-stone-300">
          <p>
            例:「{DQ.ACTION_EXAMPLE.before}」→
            <strong className="text-emerald-700 dark:text-emerald-300">
              「{DQ.ACTION_EXAMPLE.after}」
            </strong>
          </p>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {DQ.FINAL_HINTS.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => useHint(h)}
              className="rounded-full border border-emerald-300 bg-white/70 px-3 py-1 text-xs text-emerald-800 transition hover:bg-emerald-100 active:scale-95 dark:border-emerald-800 dark:bg-stone-800/70 dark:text-emerald-200"
            >
              {h}
            </button>
          ))}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          maxLength={100}
          placeholder={`例: ${DQ.ACTION_EXAMPLE.after}`}
          className="mt-2 w-full rounded-lg border-2 border-emerald-300 bg-white px-3 py-3 font-bold text-stone-800 outline-none focus:ring-2 focus:ring-emerald-400 dark:border-emerald-800 dark:bg-stone-800 dark:text-stone-100"
        />

        {entry.draftAction && action.trim() !== entry.draftAction && (
          <button
            type="button"
            onClick={() => setAction(entry.draftAction)}
            className="mt-2 text-xs text-stone-500 underline dark:text-stone-400"
          >
            仮アクションのままでいく(「{entry.draftAction}」)
          </button>
        )}
      </section>

      <p className="text-center text-sm text-stone-600 dark:text-stone-300">
        決定すると{" "}
        <span className="font-bold text-orange-600 dark:text-orange-400">+{xp} EXP</span>
        {changed && (
          <span className="block text-xs text-amber-600 dark:text-amber-400">
            ✨ 対話で行動が進化したボーナス
          </span>
        )}
      </p>
      <button
        type="button"
        onClick={() => onSubmit(action.trim())}
        disabled={!action.trim()}
        className="w-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 py-3.5 font-pixel text-lg text-white shadow-md transition hover:brightness-110 active:scale-95 disabled:opacity-40"
      >
        この一歩に決める!
      </button>
    </div>
  );
}

// ---------- しめくくり ----------
function DoneView({ room, selfId, entriesById }) {
  const [copied, setCopied] = React.useState(false);
  const mine = entriesById.get(selfId);
  const declared = room.players
    .map((p) => entriesById.get(p.id))
    .filter((e) => e && e.hasFinal);

  const reportText = mine
    ? `【読書クエスト】やってみました!\n📖『${mine.bookTitle}』\n🎯 ${mine.finalAction}\n`
    : "";

  const copyReport = () =>
    navigator.clipboard
      .writeText(reportText)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      })
      .catch(() => {});

  return (
    <div className="space-y-4">
      {/* 24時間チャレンジ */}
      <section className="animate-pop-in rounded-2xl border-4 border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-100 p-5 text-center shadow-lg dark:border-emerald-600 dark:from-stone-800 dark:to-emerald-950">
        <p className="text-4xl">🚀</p>
        <p className="font-pixel mt-2 text-xl text-stone-800 dark:text-emerald-100">
          24時間チャレンジ
        </p>
        {mine && mine.hasFinal ? (
          <p className="mt-3 rounded-xl border-2 border-emerald-400 bg-white/80 px-4 py-3 text-lg font-bold text-stone-800 dark:bg-stone-900/60 dark:text-stone-100">
            🎯 {mine.finalAction}
          </p>
        ) : (
          <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">
            最終アクションがまだ決まっていません
          </p>
        )}
        <p className="mt-3 text-sm font-bold text-emerald-700 dark:text-emerald-300">
          これを24時間以内に、10分以内で、1回だけ試してみよう!
        </p>
      </section>

      {/* オープンチャットへの報告 */}
      <section className="rounded-2xl border-2 border-amber-300 bg-white/80 p-4 shadow-md dark:border-amber-700 dark:bg-stone-800/80">
        <h3 className="font-pixel text-base text-stone-800 dark:text-amber-100">
          📣 やってみたら、報告しよう
        </h3>
        <p className="mt-1.5 text-sm text-stone-600 dark:text-stone-300">
          LINEオープンチャット
          <strong className="text-green-700 dark:text-green-400">
            「{DQ.OPENCHAT_NAME}
            {DQ.OPENCHAT_TAGLINE ? `｜${DQ.OPENCHAT_TAGLINE}` : ""}」
          </strong>
          に「やってみました!」と書き込んでください。
          写真やスクリーンショットでもOK。仲間の報告には「ナイスチャレンジ!」と返そう。
        </p>
        {DQ.OPENCHAT_URL ? (
          <a
            href={DQ.OPENCHAT_URL}
            target="_blank"
            rel="noopener"
            className="mt-3 block w-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500 py-3 text-center font-bold text-white shadow transition hover:brightness-110 active:scale-95"
          >
            💬 {DQ.OPENCHAT_NAME}に参加する
          </a>
        ) : null}
        {mine && mine.hasFinal && (
          <button
            type="button"
            onClick={copyReport}
            className="mt-2 w-full rounded-full border-2 border-amber-400 bg-white/70 py-2.5 text-sm font-bold text-amber-700 transition hover:bg-amber-50 active:scale-95 dark:bg-stone-800/70 dark:text-amber-300"
          >
            {copied ? "コピーしました!" : "📋 報告用の文をコピー"}
          </button>
        )}
      </section>

      {/* 自分の変化 */}
      {mine && <DQ.ChangeCard entry={mine} />}

      {/* みんなの宣言ボード */}
      <section className="rounded-2xl border-2 border-amber-300 bg-white/80 p-4 shadow-md dark:border-amber-700 dark:bg-stone-800/80">
        <h3 className="font-pixel text-base text-stone-800 dark:text-amber-100">
          🪧 みんなの宣言ボード({declared.length}人)
        </h3>
        <ul className="mt-3 space-y-2">
          {declared.map((e) => (
            <li
              key={e.playerId}
              className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-900 dark:bg-emerald-950/25"
            >
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {e.name} ・ 📖『{e.bookTitle}』
              </p>
              <p className="mt-0.5 font-bold text-stone-800 dark:text-stone-100">
                🎯 {e.finalAction}
              </p>
              {e.actionChanged && e.draftAction && (
                <p className="mt-1 text-xs text-stone-500 line-through dark:text-stone-500">
                  仮: {e.draftAction}
                </p>
              )}
            </li>
          ))}
          {declared.length === 0 && (
            <li className="text-center text-sm text-stone-500 dark:text-stone-400">
              まだ誰も宣言していません
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}

// ---------- 提出ずみの表示(書きなおしたい人だけフォームを開く) ----------
function SubmittedPanel({ summary, waiting, editLabel, renderForm }) {
  const [editing, setEditing] = React.useState(false);

  if (editing) {
    return (
      <React.Fragment>
        {renderForm(() => setEditing(false))}
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="mx-auto block text-sm text-stone-500 underline dark:text-stone-400"
        >
          ← 書きなおすのをやめる
        </button>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      {summary}
      {waiting}
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="mx-auto block text-sm text-stone-500 underline dark:text-stone-400"
      >
        {editLabel}
      </button>
    </React.Fragment>
  );
}

// ---------- 読書会アプリ本体 ----------
DQ.EventApp = function EventApp({
  theme,
  onToggleTheme,
  onExit,
  initialCode,
  initialName,
  autoRejoin, // { code, name } があれば、開いた瞬間に元の部屋へ戻る
}) {
  const socketRef = React.useRef(null);
  // 端末の固定ID。これで「同じ人」と分かるので、つなぎ直しても別人にならない
  const playerIdRef = React.useRef(DQ.getPlayerId());
  const rejoinRef = React.useRef(autoRejoin || null);
  const pendingNameRef = React.useRef(autoRejoin ? autoRejoin.name : "");
  const [phase, setPhase] = React.useState(autoRejoin ? "rejoining" : "entry");
  const [room, setRoom] = React.useState(null);
  const [selfId, setSelfId] = React.useState(null);
  const [online, setOnline] = React.useState(true);
  const [error, setError] = React.useState("");
  const [toasts, setToasts] = React.useState([]);
  const [feedbackTargetId, setFeedbackTargetId] = React.useState(null);
  // すでに知っている「自分へのフィードバック」(最初の部屋状態は通知せず基準にする)
  const knownRef = React.useRef(null);

  // ソケット接続(マウント時に1回だけ)
  React.useEffect(() => {
    const socket = io("/games/dokusho-quest-2");
    socketRef.current = socket;

    socket.on("connect", () => {
      setOnline(true);
      // つなぎ直したとき(再読み込み後も)は、同じ playerId で入り直して元の自分に復帰
      const r = rejoinRef.current;
      if (r) {
        socket.emit("joinRoom", {
          code: r.code,
          name: r.name,
          totalXp: DQ.loadGameData().totalXp,
          playerId: playerIdRef.current,
        });
      }
    });
    socket.on("disconnect", () => setOnline(false));

    socket.on("joined", ({ code, selfId }) => {
      setSelfId(selfId);
      setPhase("room");
      setError("");
      const name = pendingNameRef.current;
      if (code && name) {
        rejoinRef.current = { code, name };
        DQ.saveCircleSession(code, name);
      }
    });
    socket.on("roomUpdate", (state) => setRoom(state));
    socket.on("errorMsg", (msg) => {
      if (rejoinRef.current) {
        rejoinRef.current = null;
        DQ.clearCircleSession();
      }
      setPhase("entry");
      setError(msg);
    });
    return () => socket.disconnect();
  }, []);

  const entriesById = React.useMemo(
    () => new Map((room ? room.entries : []).map((e) => [e.playerId, e])),
    [room],
  );
  const myEntry = selfId ? entriesById.get(selfId) : null;

  // 自分に届いたフィードバックを、レターに保存し、新しいものは通知する
  React.useEffect(() => {
    if (!room || !selfId) return;
    const mine = entriesById.get(selfId);
    if (!mine) return;

    DQ.addLetters(
      mine.feedback.map((f) => ({
        key: `${room.code}-${selfId}-${f.gifterId}-${f.at}`,
        comment: f.comment,
        gifterName: f.gifterName,
        bookTitle: mine.bookTitle,
        at: f.at,
      })),
    );

    const keys = mine.gifterIds;
    if (knownRef.current === null) {
      knownRef.current = new Set(keys);
      return;
    }
    const fresh = [];
    for (const g of keys) {
      if (knownRef.current.has(g)) continue;
      knownRef.current.add(g);
      const f = mine.feedback.find((x) => x.gifterId === g);
      fresh.push({
        id: `${g}-${Date.now()}`,
        gifterName: f ? f.gifterName : "だれか",
        comment: f ? f.comment : "",
      });
    }
    if (fresh.length === 0) return;
    setToasts((t) => [...t, ...fresh]);
    const ids = new Set(fresh.map((f) => f.id));
    setTimeout(() => setToasts((t) => t.filter((x) => !ids.has(x.id))), 5000);
  }, [room, selfId, entriesById]);

  // 自分のEXP(サーバーが真の値)をローカル保存に反映 → ソロのレベルにも通算される
  React.useEffect(() => {
    if (!room || !selfId) return;
    const me = room.players.find((p) => p.id === selfId);
    if (!me) return;
    const d = DQ.loadGameData();
    if (d.totalXp !== me.totalXp) DQ.saveGameData({ ...d, totalXp: me.totalXp });
  }, [room, selfId]);

  // ---------- サーバーへの操作 ----------
  const emit = (event, payload) => {
    if (socketRef.current) socketRef.current.emit(event, payload);
  };
  const createRoom = (name) => {
    pendingNameRef.current = name;
    emit("createRoom", {
      name,
      totalXp: DQ.loadGameData().totalXp,
      playerId: playerIdRef.current,
    });
  };
  const joinRoom = (code, name) => {
    pendingNameRef.current = name;
    emit("joinRoom", {
      code,
      name,
      totalXp: DQ.loadGameData().totalXp,
      playerId: playerIdRef.current,
    });
  };
  const leaveEvent = () => {
    rejoinRef.current = null;
    DQ.clearCircleSession();
    onExit();
  };

  const decideMission = (bookTitle, mission) =>
    emit("setMission", {
      bookTitle,
      missionIcon: mission.icon,
      missionTitle: mission.title,
      missionBonus: mission.bonusXp,
    });

  // 読書会の記録は、自分の冒険ログにも残す(ソロのホームで見返せる)
  const submitDraft = (memo, draftAction) => {
    emit("submitDraft", { memo, draftAction });
    if (!myEntry) return;
    const card = DQ.MISSIONS.find((m) => m.title === myEntry.missionTitle);
    const minutes = room.readingMinutes;
    const { xpGained } = DQ.calcSessionXp({
      mission: { title: myEntry.missionTitle, bonusXp: card ? card.bonusXp : 0 },
      memo,
      action: draftAction,
      minutes,
    });
    const d = DQ.loadGameData();
    DQ.saveGameData({
      ...d,
      logs: [
        {
          id: DQ.generateId(),
          bookId: null,
          bookTitle: myEntry.bookTitle,
          missionTitle: myEntry.missionTitle,
          missionIcon: myEntry.missionIcon,
          memo: memo.trim(),
          action: (draftAction || "").trim(),
          minutes,
          xpGained,
          date: new Date().toISOString(),
        },
        ...d.logs,
      ],
    });
  };

  const sendFeedback = (targetId, comment) => emit("sendFeedback", { targetId, comment });
  const submitFinal = (finalAction) => emit("submitFinal", { finalAction });
  const goPhase = (p) => emit("setPhase", { phase: p });

  // ---------- ラッパー ----------
  const shell = (children) => (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 text-stone-800 transition-colors dark:from-stone-900 dark:to-stone-950 dark:text-stone-100">
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6 sm:py-8">
        <DQ.Header theme={theme} onToggleTheme={onToggleTheme} />
        {children}
        <FeedbackToasts toasts={toasts} />
      </div>
    </div>
  );

  if (phase === "rejoining") {
    return shell(
      <div className="space-y-3 text-center">
        <p className="font-pixel text-lg text-stone-800 dark:text-amber-100">
          読書会にもどっています…
        </p>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          部屋 {(autoRejoin && autoRejoin.code) || ""} に再接続中です
        </p>
        <button
          type="button"
          onClick={leaveEvent}
          className="mx-auto block text-sm text-stone-500 underline dark:text-stone-400"
        >
          ← もどらずにモード選択へ
        </button>
      </div>,
    );
  }

  if (phase === "entry") {
    return shell(
      <React.Fragment>
        <EventEntry
          error={error}
          initialCode={initialCode}
          initialName={initialName}
          onCreate={createRoom}
          onJoin={joinRoom}
        />
        <button
          type="button"
          onClick={leaveEvent}
          className="mx-auto block text-sm text-stone-500 underline dark:text-stone-400"
        >
          ← モード選択にもどる
        </button>
      </React.Fragment>,
    );
  }

  if (!room) {
    return shell(
      <p className="text-center text-sm text-stone-500 dark:text-stone-400">
        部屋に接続しています…
      </p>,
    );
  }

  // ---------- 部屋の中 ----------
  const isHost = room.hostId === selfId;
  const p = room.phase;
  const total = room.players.length;
  const countDone = (key) => room.entries.filter((e) => e[key]).length;

  // STEPごとの本文
  let body = null;
  if (p === "lobby") {
    body = (
      <React.Fragment>
        <RoomInvite code={room.code} />
        <DQ.FlowGuide open />
      </React.Fragment>
    );
  } else if (p === "mission") {
    body = (
      <React.Fragment>
        <MissionStep entry={myEntry} onDecide={decideMission} />
        {myEntry && myEntry.hasMission && (
          <DQ.WaitingNote phase="mission" done={countDone("hasMission")} total={total} />
        )}
      </React.Fragment>
    );
  } else if (p === "reading") {
    body = (
      <React.Fragment>
        {myEntry && myEntry.hasMission && (
          <div className="rounded-2xl border-2 border-amber-300 bg-white/80 p-4 text-center shadow-md dark:border-amber-700 dark:bg-stone-800/80">
            <p className="text-sm text-stone-600 dark:text-stone-300">
              📖『{myEntry.bookTitle}』
            </p>
            <p className="mt-1 text-sm font-bold text-amber-700 dark:text-amber-300">
              {myEntry.missionIcon} {myEntry.missionTitle}
            </p>
          </div>
        )}
        {room.timer ? (
          <DQ.SharedTimer
            timer={room.timer}
            isHost={isHost}
            onStop={() => emit("stopTimer")}
            onExtend={() => emit("extendTimer")}
            note="時間になると、自動で次のSTEPに進みます"
          />
        ) : (
          <DQ.WaitingNote phase="reading" />
        )}
      </React.Fragment>
    );
  } else if (p === "draft") {
    body =
      myEntry && myEntry.hasDraft ? (
        <SubmittedPanel
          editLabel="メモや仮アクションを書きなおす"
          summary={
            <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/70 p-4 text-center dark:border-emerald-800 dark:bg-emerald-950/25">
              <p className="font-pixel text-base text-emerald-800 dark:text-emerald-200">
                ✅ 提出できました!
              </p>
              <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
                🎯 仮アクション
              </p>
              <p className="font-bold text-stone-800 dark:text-stone-100">
                {myEntry.draftAction}
              </p>
            </div>
          }
          waiting={
            <DQ.WaitingNote phase="draft" done={countDone("hasDraft")} total={total} />
          }
          renderForm={(close) => (
            <DraftForm
              entry={myEntry}
              minutes={room.readingMinutes}
              onSubmit={(memo, action) => {
                submitDraft(memo, action);
                close();
              }}
            />
          )}
        />
      ) : (
        <DraftForm entry={myEntry} minutes={room.readingMinutes} onSubmit={submitDraft} />
      );
  } else if (p === "share") {
    body = (
      <SpotlightView
        room={room}
        selfId={selfId}
        entriesById={entriesById}
        onOpenFeedback={setFeedbackTargetId}
        isHost={isHost}
        onMove={(delta) => emit("movePresenter", { delta })}
        onStopTimer={() => emit("stopTimer")}
        onExtendTimer={() => emit("extendTimer")}
      />
    );
  } else if (p === "final") {
    body =
      myEntry && myEntry.hasFinal ? (
        <SubmittedPanel
          editLabel="最終アクションを決めなおす"
          summary={<DQ.ChangeCard entry={myEntry} />}
          waiting={
            <DQ.WaitingNote phase="final" done={countDone("hasFinal")} total={total} />
          }
          renderForm={(close) => (
            <FinalForm
              entry={myEntry}
              onSubmit={(a) => {
                submitFinal(a);
                close();
              }}
            />
          )}
        />
      ) : (
        // 途中参加などで何も書いていない人でも、最終アクションだけは決められるようにする
        <FinalForm
          entry={
            myEntry || {
              draftAction: "",
              finalAction: "",
              feedback: [],
              feedbackCount: 0,
            }
          }
          onSubmit={submitFinal}
        />
      );
  } else if (p === "done") {
    body = <DoneView room={room} selfId={selfId} entriesById={entriesById} />;
  }

  // ホストだけに見える操作(STEPごと)
  let hostControls = null;
  if (p === "reading") {
    hostControls = <ReadingControls room={room} onStart={(m) => emit("startReading", { minutes: m })} />;
  } else if (p === "draft") {
    hostControls = (
      <ShareSetup room={room} onStart={(s, shuffle) => emit("startShare", { seconds: s, shuffle })} />
    );
  }

  const nextNote =
    p === "mission"
      ? `${countDone("hasMission")} / ${total} 人がカードを引きました`
      : p === "draft"
        ? `${countDone("hasDraft")} / ${total} 人が提出しました`
        : p === "final"
          ? `${countDone("hasFinal")} / ${total} 人が決めました`
          : "";

  // 贈る相手。まだ何も書いていない人にも贈れるよう、名前だけの相手も作れるようにする
  let feedbackTarget = null;
  if (feedbackTargetId) {
    const player = room.players.find((x) => x.id === feedbackTargetId);
    feedbackTarget = entriesById.get(feedbackTargetId) ||
      (player && { playerId: player.id, name: player.name, draftAction: "" });
  }

  return shell(
    <React.Fragment>
      <DQ.StepProgress phase={p} />
      <DQ.PhaseHeader phase={p} />

      {!online && (
        <p className="rounded-xl bg-amber-100 px-3 py-2 text-center text-sm font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          📡 通信が切れました。つなぎ直しています…
          <span className="block text-xs font-normal">
            戻れば同じ自分のまま続けられます(EXPも記録も残ります)
          </span>
        </p>
      )}

      {body}

      {isHost && (
        <DQ.HostPanel phase={p} onNext={goPhase} nextDisabledNote={nextNote}>
          {hostControls}
        </DQ.HostPanel>
      )}

      <DQ.Roster
        players={room.players}
        entries={room.entries}
        selfId={selfId}
        hostId={room.hostId}
        onRemove={(id) => emit("removePlayer", { playerId: id })}
      />

      {p !== "lobby" && (
        <details className="rounded-2xl border-2 border-amber-200 bg-white/60 px-4 py-3 text-sm dark:border-stone-700 dark:bg-stone-800/50">
          <summary className="cursor-pointer font-bold text-stone-600 dark:text-stone-300">
            🗺 今日の流れをもう一度見る
          </summary>
          <div className="mt-3">
            <DQ.FlowGuide open compact />
          </div>
        </details>
      )}

      <button
        type="button"
        onClick={leaveEvent}
        className="mx-auto block text-sm text-stone-500 underline dark:text-stone-400"
      >
        ← 読書会から退出する(次に開いても戻りません)
      </button>

      {feedbackTarget && (
        <FeedbackSheet
          target={feedbackTarget}
          onSend={(comment) => {
            sendFeedback(feedbackTarget.playerId, comment);
            setFeedbackTargetId(null);
          }}
          onClose={() => setFeedbackTargetId(null)}
        />
      )}
    </React.Fragment>,
  );
};

// ---------- ホスト操作: 読書タイムの開始 ----------
function ReadingControls({ room, onStart }) {
  const [pick, setPick] = React.useState(room.readingMinutes || 20);
  const running = room.timer && room.timer.remainingMs > 0;

  return (
    <div>
      <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
        ⏱ 読書タイム
      </p>
      <div className="mt-2 flex gap-2">
        {[15, 20, 25, 30].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setPick(m)}
            className={
              "flex-1 rounded-full px-2 py-2 text-sm font-bold transition active:scale-95 " +
              (pick === m
                ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow"
                : "border-2 border-indigo-300 bg-white/70 text-indigo-600 dark:bg-stone-800/70 dark:text-indigo-300")
            }
          >
            {m}分
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onStart(pick)}
        className="mt-2 w-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 py-3 font-pixel text-white shadow transition hover:brightness-110 active:scale-95"
      >
        {running ? `▶ 読書タイムをやり直す(${pick}分)` : `▶ よーいドン!(${pick}分)`}
      </button>
      <p className="mt-1 text-xs text-indigo-600 dark:text-indigo-300">
        全員のカウントダウンが一斉に始まり、終わると自動でSTEP3へ進みます
      </p>
    </div>
  );
}

// ---------- ホスト操作: 共有タイムの設定 ----------
function ShareSetup({ room, onStart }) {
  const [pick, setPick] = React.useState(room.shareSeconds || 120);
  const [shuffle, setShuffle] = React.useState(false);
  const people = room.players.length;

  return (
    <div>
      <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
        🎤 1人あたりの共有時間
      </p>
      <div className="mt-2 flex gap-2">
        {[90, 120, 180, 240].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setPick(s)}
            className={
              "flex-1 rounded-full px-2 py-2 text-sm font-bold transition active:scale-95 " +
              (pick === s
                ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow"
                : "border-2 border-indigo-300 bg-white/70 text-indigo-600 dark:bg-stone-800/70 dark:text-indigo-300")
            }
          >
            {s / 60}分
          </button>
        ))}
      </div>
      <label className="mt-2 flex items-center gap-2 text-xs text-indigo-700 dark:text-indigo-300">
        <input
          type="checkbox"
          checked={shuffle}
          onChange={(e) => setShuffle(e.target.checked)}
          className="h-4 w-4 accent-indigo-500"
        />
        発表順をシャッフルする
      </label>
      <button
        type="button"
        onClick={() => onStart(pick, shuffle)}
        className="mt-2 w-full rounded-full bg-gradient-to-r from-pink-500 to-orange-500 py-3 font-pixel text-white shadow transition hover:brightness-110 active:scale-95"
      >
        🎤 共有をはじめる
      </button>
      <p className="mt-1 text-xs text-indigo-600 dark:text-indigo-300">
        {people}人 × {pick / 60}分 = 発表だけで約{Math.round((people * pick) / 60)}分
        (フィードバックの時間は別に取ってください)
      </p>
    </div>
  );
}
