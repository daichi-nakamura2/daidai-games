// ============================================================
// 読書会モード(リアルタイム共有)のクライアント
//   Socket.io でサーバーの部屋につなぎ、アウトプット共有とEXPプレゼントを行う
// ============================================================
window.DQ = window.DQ || {};

// ---------- モード選択(ランディング) ----------
DQ.Landing = function Landing({ theme, onToggleTheme, onPick }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 text-stone-800 transition-colors dark:from-stone-900 dark:to-stone-950 dark:text-stone-100">
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:py-8">
        <DQ.Header theme={theme} onToggleTheme={onToggleTheme} />

        <p className="animate-fade-up text-center text-sm text-stone-600 dark:text-stone-300">
          ようこそ、読書の冒険へ!遊び方をえらんでください。
        </p>

        <div className="grid animate-fade-up gap-4 sm:grid-cols-2">
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

          <button
            type="button"
            onClick={() => onPick("circle")}
            className="flex flex-col items-center gap-2 rounded-2xl border-2 border-amber-400 bg-gradient-to-br from-amber-100 to-orange-100 p-6 text-center shadow-md transition hover:scale-[1.02] active:scale-95 dark:border-amber-600 dark:from-stone-800 dark:to-amber-950"
          >
            <span className="text-5xl">👥</span>
            <span className="font-pixel text-lg text-stone-800 dark:text-amber-100">
              読書会(みんなで)
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              部屋に集まってアウトプットを共有。EXPと応援コメントを贈り合おう!
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------- 読書会:入室フォーム ----------
function CircleEntry({ error, initialCode, initialName, onCreate, onJoin }) {
  const [tab, setTab] = React.useState("join"); // join | create
  const [name, setName] = React.useState(initialName || "");
  const [code, setCode] = React.useState(initialCode || "");

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (tab === "create") onCreate(name);
    else if (code.trim()) onJoin(code, name);
  };

  return (
    <section className="animate-fade-up space-y-4">
      <div className="flex justify-center gap-2">
        <button
          type="button"
          onClick={() => setTab("join")}
          className={
            tab === "join"
              ? "rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2 text-sm font-bold text-white shadow"
              : "rounded-full border-2 border-amber-300 bg-white/70 px-5 py-2 text-sm font-bold text-stone-500 dark:border-stone-600 dark:bg-stone-800/70 dark:text-stone-400"
          }
        >
          部屋に入る
        </button>
        <button
          type="button"
          onClick={() => setTab("create")}
          className={
            tab === "create"
              ? "rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2 text-sm font-bold text-white shadow"
              : "rounded-full border-2 border-amber-300 bg-white/70 px-5 py-2 text-sm font-bold text-stone-500 dark:border-stone-600 dark:bg-stone-800/70 dark:text-stone-400"
          }
        >
          部屋をつくる
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
              inputMode="text"
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

      <p className="text-center text-xs text-stone-500 dark:text-stone-400">
        同じ部屋コードを仲間に伝えると、いっしょに読書会ができます。
      </p>
    </section>
  );
}

// ---------- 読書会:メンバー一覧(EXPの多い順=ランキング) ----------
function Roster({ players, selfId, hostId }) {
  const sorted = [...players].sort((a, b) => b.totalXp - a.totalXp);
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <section className="rounded-2xl border-2 border-amber-300 bg-white/80 p-4 shadow-md dark:border-amber-700 dark:bg-stone-800/80">
      <h2 className="font-pixel text-lg text-stone-800 dark:text-amber-100">
        🏅 参加メンバー({players.length}人)
      </h2>
      <ul className="mt-3 space-y-2">
        {sorted.map((p, i) => {
          const level = DQ.levelFromXp(p.totalXp);
          const isSelf = p.id === selfId;
          return (
            <li
              key={p.id}
              className={
                "flex items-center gap-3 rounded-xl border p-2.5 " +
                (isSelf
                  ? "border-amber-400 bg-amber-50 dark:border-amber-600 dark:bg-amber-950/40"
                  : "border-amber-200 bg-amber-50/50 dark:border-stone-600 dark:bg-stone-700/40")
              }
            >
              <span className="w-6 text-center text-lg">
                {medals[i] || i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-stone-800 dark:text-stone-100">
                  {p.name}
                  {isSelf && (
                    <span className="ml-1 text-xs text-amber-600 dark:text-amber-400">
                      (あなた)
                    </span>
                  )}
                  {p.id === hostId && (
                    <span className="ml-1 text-xs" title="ホスト">
                      👑
                    </span>
                  )}
                  {!p.connected && (
                    <span className="ml-1 text-xs text-stone-400">(退出)</span>
                  )}
                </p>
                <p className="truncate text-xs text-stone-500 dark:text-stone-400">
                  Lv.{level} ・ {DQ.titleForLevel(level)}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-amber-200 px-2 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                {p.totalXp} XP
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ---------- 読書会:EXPといっしょに応援コメントを贈るシート ----------
function CheerSheet({ output, onSend, onClose }) {
  const [comment, setComment] = React.useState("");
  const ng = DQ.findNgWord(comment);
  const hasComment = comment.trim().length > 0;
  const gifterXp = DQ.GIFT_XP_TO_GIFTER + (hasComment ? DQ.GIFT_COMMENT_BONUS : 0);

  // Esc で閉じる
  React.useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="応援コメントを贈る"
        onClick={(e) => e.stopPropagation()}
        className="animate-pop-in max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl border-2 border-pink-300 bg-white p-5 shadow-xl sm:rounded-3xl dark:border-pink-800 dark:bg-stone-900"
      >
        <p className="font-pixel text-lg text-stone-800 dark:text-pink-100">
          🎁 {output.authorName} さんに応援を贈る
        </p>
        <p className="mt-1 truncate text-xs text-stone-500 dark:text-stone-400">
          📖『{output.bookTitle}』のアウトプットへ
        </p>

        <p className="mt-4 text-sm font-bold text-stone-600 dark:text-stone-300">
          ひとことえらぶ(タップで入る)
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {DQ.CHEER_STAMPS.map((s) => {
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
          placeholder="例: 「明日の一歩」わたしもやってみます!"
          className="mt-1 w-full resize-none rounded-xl border border-pink-300 bg-pink-50/40 px-3 py-2 text-sm text-stone-800 outline-none focus:ring-2 focus:ring-pink-300 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
        />
        <div className="flex justify-between text-xs text-stone-500 dark:text-stone-400">
          <span>
            {ng ? "" : "ポジティブな言葉だけ届けられます"}
          </span>
          <span>
            {comment.length} / {DQ.MAX_CHEER}
          </span>
        </div>
        {ng && (
          <p className="mt-2 rounded-lg bg-amber-100 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            🌷「{ng}」は応援にはちょっと強い言葉かも。よかったところを伝える言葉に言いかえてみよう
          </p>
        )}

        <div className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-center text-xs text-stone-600 dark:bg-stone-800 dark:text-stone-300">
          {output.authorName} さん <span className="font-bold text-orange-600 dark:text-orange-400">+{DQ.GIFT_XP_TO_AUTHOR} EXP</span>
          {" ・ "}
          あなた <span className="font-bold text-orange-600 dark:text-orange-400">+{gifterXp} EXP</span>
          {!hasComment && (
            <span className="block text-pink-600 dark:text-pink-300">
              ひとこと添えると、あなたにも +{DQ.GIFT_COMMENT_BONUS} EXP
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row-reverse">
          <button
            type="button"
            onClick={() => onSend(comment.trim())}
            disabled={!!ng}
            className="rounded-full bg-gradient-to-r from-pink-500 to-orange-500 px-6 py-3 font-bold text-white shadow transition hover:brightness-110 active:scale-95 disabled:opacity-40 sm:flex-1"
          >
            {hasComment ? "💌 応援コメントつきで贈る" : "🎁 EXPだけ贈る"}
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

// ---------- 読書会:届いた応援をふわっと知らせる ----------
function CheerToasts({ toasts }) {
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-40 flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="animate-pop-in w-full max-w-md rounded-2xl border-2 border-pink-300 bg-white/95 px-4 py-3 shadow-lg dark:border-pink-800 dark:bg-stone-900/95"
        >
          <p className="text-sm font-bold text-pink-700 dark:text-pink-300">
            💌 {t.gifterName} さんから応援が届いた! +{DQ.GIFT_XP_TO_AUTHOR} EXP
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

// ---------- 読書会:共有フィードの1件 ----------
function FeedItem({ output, selfId, onGift }) {
  const isMine = output.authorId === selfId;
  const gifted = output.gifterIds.includes(selfId);
  const cheers = output.cheers || [];

  return (
    <li className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 dark:border-stone-600 dark:bg-stone-700/40">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-bold text-stone-800 dark:text-stone-100">
          {output.missionIcon} {output.authorName}
          {isMine && (
            <span className="ml-1 text-xs text-amber-600 dark:text-amber-400">
              (あなた)
            </span>
          )}
        </p>
        <span className="shrink-0 rounded-full bg-amber-200 px-2 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-900 dark:text-amber-200">
          +{output.baseXp} XP
        </span>
      </div>
      <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
        📖『{output.bookTitle}』・ {output.minutes}分 ・ {output.missionTitle}
      </p>
      {output.memo && (
        <p className="mt-2 rounded-lg bg-white/70 px-3 py-2 text-sm whitespace-pre-wrap text-stone-700 dark:bg-stone-800/60 dark:text-stone-200">
          {output.memo}
        </p>
      )}
      {output.action && (
        <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
          🚶 明日の一歩: {output.action}
        </p>
      )}
      {cheers.length > 0 && (
        <ul className="mt-2 space-y-1">
          {cheers.map((c) => (
            <li
              key={c.gifterId}
              className="rounded-lg border border-pink-200 bg-pink-50/70 px-3 py-1.5 text-xs text-stone-700 dark:border-pink-900 dark:bg-pink-950/30 dark:text-stone-200"
            >
              💌 <span className="font-bold">{c.gifterName}</span>「{c.comment}」
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-stone-500 dark:text-stone-400">
          🎁 {output.giftCount} 人が応援
        </span>
        <button
          type="button"
          onClick={() => onGift(output)}
          disabled={isMine || gifted}
          className={
            gifted
              ? "rounded-full bg-amber-200 px-4 py-1.5 text-sm font-bold text-amber-800 dark:bg-amber-900 dark:text-amber-200"
              : "rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-1.5 text-sm font-bold text-white shadow transition hover:brightness-110 active:scale-95 disabled:opacity-40"
          }
        >
          {isMine ? "自分の記録" : gifted ? "🎁 応援ずみ" : "💌 応援を贈る"}
        </button>
      </div>
    </li>
  );
}

// ---------- 読書会:みんなで一斉に読書するタイマー ----------
function ReadingSession({ session, isHost, onStart, onStop }) {
  const [remaining, setRemaining] = React.useState(0);
  const [pick, setPick] = React.useState(DQ.SESSION_OPTIONS[0]);

  // サーバーから届いた残り時間に合わせて、毎回カウントダウンを取り直す
  React.useEffect(() => {
    if (!session) {
      setRemaining(0);
      return;
    }
    const endsAt = Date.now() + session.remainingMs;
    const tick = () => setRemaining(Math.max(0, endsAt - Date.now()));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [session]);

  const active = session && remaining > 0;
  const mm = Math.floor(remaining / 60000);
  const ss = Math.floor((remaining % 60000) / 1000);

  if (active) {
    return (
      <section className="rounded-2xl border-2 border-amber-400 bg-gradient-to-br from-amber-100 to-orange-100 p-5 text-center shadow-md dark:border-amber-700 dark:from-stone-800 dark:to-amber-950">
        <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
          🔥 みんなで読書中!
        </p>
        <p className="font-pixel mt-1 text-5xl text-stone-800 tabular-nums sm:text-6xl dark:text-amber-100">
          {mm}:{String(ss).padStart(2, "0")}
        </p>
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          全員でいっしょに集中しよう(残り時間)
        </p>
        {isHost && (
          <button
            type="button"
            onClick={onStop}
            className="mt-3 rounded-full border-2 border-amber-400 bg-white/70 px-5 py-2 text-sm font-bold text-amber-700 transition hover:bg-amber-50 active:scale-95 dark:bg-stone-800/70 dark:text-amber-300"
          >
            ⏹ 読書タイムを終える
          </button>
        )}
      </section>
    );
  }

  // タイマーが動いていないとき
  return (
    <section className="rounded-2xl border-2 border-amber-300 bg-white/80 p-5 text-center shadow-md dark:border-amber-700 dark:bg-stone-800/80">
      <p className="font-pixel text-lg text-stone-800 dark:text-amber-100">
        ⏱ みんなで読書タイム
      </p>
      {session && (
        <p className="mt-1 text-sm font-bold text-amber-600 dark:text-amber-400">
          読書タイムが終了しました!アウトプットを投稿しよう
        </p>
      )}
      {isHost ? (
        <div className="mt-3 space-y-3">
          <div className="flex justify-center gap-2">
            {DQ.SESSION_OPTIONS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setPick(m)}
                className={
                  pick === m
                    ? "rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-sm font-bold text-white shadow"
                    : "rounded-full border-2 border-amber-300 bg-white/70 px-4 py-2 text-sm font-bold text-stone-500 transition hover:bg-amber-50 active:scale-95 dark:border-stone-600 dark:bg-stone-800/70 dark:text-stone-400"
                }
              >
                {m}分
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onStart(pick)}
            className="w-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 py-3 font-pixel text-white shadow transition hover:brightness-110 active:scale-95"
          >
            ▶ よーいドン!({pick}分)
          </button>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            押すと部屋の全員のカウントダウンが一斉に始まります
          </p>
        </div>
      ) : (
        <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
          ホストが読書タイムを始めるのを待っています…
        </p>
      )}
    </section>
  );
}

// ---------- 読書会:カードを引いたあと「みんなで読書タイム」を待つ・進行する画面 ----------
// 読書タイムが終わる(または host が終了する)と自動で感想画面(onDone)に進む
function QuestReadingStep({
  room,
  selfId,
  bookTitle,
  mission,
  onStartReading,
  onStopReading,
  onDone,
  onCancel,
}) {
  const isHost = room.hostId === selfId;
  // このカードで待ち始めてから、読書タイムが実際に動いているのを一度でも見たか
  const sawActiveRef = React.useRef(false);

  React.useEffect(() => {
    const remaining = room.session ? room.session.remainingMs : 0;
    if (remaining > 0) {
      sawActiveRef.current = true;
    } else if (sawActiveRef.current) {
      // 動いていた読書タイムが終わった → 感想を書く画面へ
      onDone();
    }
  }, [room.session]);

  return (
    <div className="animate-fade-up space-y-4 text-center">
      <section className="rounded-2xl border-2 border-amber-300 bg-white/80 p-4 shadow-md dark:border-amber-700 dark:bg-stone-800/80">
        <p className="text-sm text-stone-600 dark:text-stone-300">
          📖『{bookTitle}』
        </p>
        <p className="mt-1 text-sm font-bold text-amber-700 dark:text-amber-300">
          {mission.icon} {mission.title}
        </p>
      </section>

      <ReadingSession
        session={room.session}
        isHost={isHost}
        onStart={onStartReading}
        onStop={onStopReading}
      />

      <p className="text-xs text-stone-500 dark:text-stone-400">
        読書タイムが終わると、自動で感想を書く画面に進みます
      </p>

      <button
        type="button"
        onClick={onCancel}
        className="text-sm text-stone-500 underline dark:text-stone-400"
      >
        ← やめて部屋にもどる
      </button>
    </div>
  );
}

// ---------- 読書会:今まさに進行中の読書タイムがあれば知らせる帯 ----------
function SessionBanner({ session }) {
  if (!session || session.remainingMs <= 0) return null;
  const mm = Math.floor(session.remainingMs / 60000);
  return (
    <p className="text-center text-sm font-bold text-amber-600 dark:text-amber-400">
      🔥 いま読書タイム進行中(残り約{Math.max(1, mm)}分)・「アウトプットを投稿する」から参加できます
    </p>
  );
}

// ---------- 読書会:部屋のメイン画面 ----------
function RoomView({ room, selfId, online, onStartQuest, onGift, onExit }) {
  const [copied, setCopied] = React.useState(false);
  // 応援シートを開いている投稿のID(開いている間に一覧が更新されても最新を使う)
  const [cheerTargetId, setCheerTargetId] = React.useState(null);
  const cheerTarget = room.feed.find((o) => o.id === cheerTargetId) || null;
  const [linkCopied, setLinkCopied] = React.useState(false);
  const me = room.players.find((p) => p.id === selfId);
  const feed = [...room.feed].reverse(); // 新しい順

  // 招待リンク(このリンクを開くとコードが自動で入る)
  const inviteUrl = `${location.origin}${location.pathname}?room=${room.code}`;

  const copyCode = () => {
    navigator.clipboard
      .writeText(room.code)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});
  };

  // 招待リンクを共有(スマホは共有シート、PCはクリップボードにコピー)
  const shareInvite = () => {
    const text = `読書クエスト＋の読書会に参加してね!部屋コード: ${room.code}`;
    if (navigator.share) {
      navigator.share({ text, url: inviteUrl }).catch(() => {});
    } else {
      navigator.clipboard
        .writeText(inviteUrl)
        .then(() => {
          setLinkCopied(true);
          setTimeout(() => setLinkCopied(false), 1500);
        })
        .catch(() => {});
    }
  };

  return (
    <div className="animate-fade-up space-y-5">
      {/* 部屋コード */}
      <section className="rounded-2xl border-2 border-amber-400 bg-gradient-to-br from-amber-100 to-orange-100 p-4 text-center shadow-md dark:border-amber-700 dark:from-stone-800 dark:to-amber-950">
        <p className="text-xs text-amber-700 dark:text-amber-300">部屋コード</p>
        <div className="mt-1 flex items-center justify-center gap-3">
          <span className="font-pixel text-4xl tracking-widest text-stone-800 dark:text-amber-100">
            {room.code}
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

      {!online && (
        <p className="rounded-xl bg-amber-100 px-3 py-2 text-center text-sm font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          📡 通信が切れました。つなぎ直しています…
          <span className="block text-xs font-normal">
            戻れば同じ自分のまま続けられます(EXPも投稿も残ります)
          </span>
        </p>
      )}

      <SessionBanner session={room.session} />

      <Roster players={room.players} selfId={selfId} hostId={room.hostId} />

      {/* アウトプット投稿 */}
      <button
        type="button"
        onClick={onStartQuest}
        className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-4 font-pixel text-lg text-white shadow-md transition hover:brightness-110 active:scale-95"
      >
        ✍️ アウトプットを投稿する
      </button>

      {/* 共有フィード */}
      <section className="rounded-2xl border-2 border-amber-300 bg-white/80 p-4 shadow-md dark:border-amber-700 dark:bg-stone-800/80">
        <h2 className="font-pixel text-lg text-stone-800 dark:text-amber-100">
          📜 みんなのアウトプット
        </h2>
        {feed.length === 0 ? (
          <p className="mt-3 text-center text-sm text-stone-500 dark:text-stone-400">
            まだ投稿がありません。
            <br />
            読書クエストを始めて、最初のアウトプットを共有しよう!
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {feed.map((o) => (
              <FeedItem
                key={o.id}
                output={o}
                selfId={selfId}
                onGift={(o) => setCheerTargetId(o.id)}
              />
            ))}
          </ul>
        )}
      </section>

      <button
        type="button"
        onClick={onExit}
        className="mx-auto block text-sm text-stone-500 underline dark:text-stone-400"
      >
        ← 読書会から退出する(次に開いても戻りません)
      </button>

      {cheerTarget && (
        <CheerSheet
          output={cheerTarget}
          onSend={(comment) => {
            onGift(cheerTarget.id, comment);
            setCheerTargetId(null);
          }}
          onClose={() => setCheerTargetId(null)}
        />
      )}
    </div>
  );
}

// ---------- 読書会:今日読む本の入力 ----------
function CircleBookInput({ onNext, onBack }) {
  const [title, setTitle] = React.useState("");

  const submit = (e) => {
    e.preventDefault();
    if (title.trim()) onNext(title.trim());
  };

  return (
    <form onSubmit={submit} className="animate-fade-up space-y-4 text-center">
      <div className="rounded-2xl border-2 border-amber-300 bg-white/80 p-5 shadow-md dark:border-amber-700 dark:bg-stone-800/80">
        <p className="font-pixel text-lg text-stone-800 dark:text-amber-100">
          📖 今日は何を読む?
        </p>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="本のタイトル"
          autoFocus
          maxLength={60}
          className="mt-3 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:ring-2 focus:ring-amber-400 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
        />
        <button
          type="submit"
          disabled={!title.trim()}
          className="mt-3 w-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 font-bold text-white shadow transition hover:brightness-110 active:scale-95 disabled:opacity-40"
        >
          ミッションカードを引く
        </button>
      </div>
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-stone-500 underline dark:text-stone-400"
      >
        ← 部屋にもどる
      </button>
    </form>
  );
}

// ---------- 読書会アプリ本体 ----------
DQ.CircleApp = function CircleApp({
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
  // つなぎ直したときに、どの部屋へどの名前で戻るか
  const rejoinRef = React.useRef(autoRejoin || null);
  const pendingNameRef = React.useRef(autoRejoin ? autoRejoin.name : "");
  const [phase, setPhase] = React.useState(autoRejoin ? "rejoining" : "entry"); // entry | rejoining | room
  const [room, setRoom] = React.useState(null);
  const [selfId, setSelfId] = React.useState(null);
  const [online, setOnline] = React.useState(true);
  const [error, setError] = React.useState("");
  const [toasts, setToasts] = React.useState([]);
  // すでに知っている「自分の投稿への応援」(初回の部屋状態は通知せず基準にする)
  const knownGiftsRef = React.useRef(null);

  // クエストのサブ画面: null | book | mission | waiting(読書タイム待ち) | memo
  const [questStep, setQuestStep] = React.useState(null);
  const [quest, setQuest] = React.useState({}); // { bookTitle, mission, minutes }

  // ソケット接続(マウント時に1回だけ)
  React.useEffect(() => {
    // このゲーム専用の Socket.io ネームスペースにつなぐ
    const socket = io("/games/dokusho-quest-plus");
    socketRef.current = socket;

    socket.on("connect", () => {
      setOnline(true);
      // 通信が切れて つなぎ直したとき(または再読み込み後)は、
      // 同じ playerId で入り直して元の自分に復帰する
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
      // 自動で戻ろうとして部屋が無かった場合は、入室フォームに戻す
      if (rejoinRef.current) {
        rejoinRef.current = null;
        DQ.clearCircleSession();
      }
      setPhase("entry");
      setError(msg);
    });
    return () => socket.disconnect();
  }, []);

  // 自分の投稿に届いた応援を、応援レターに保存し、新しく届いたものは通知する
  React.useEffect(() => {
    if (!room || !selfId) return;
    const mine = room.feed.filter((o) => o.authorId === selfId);

    DQ.addLetters(
      mine.flatMap((o) =>
        (o.cheers || []).map((c) => ({
          key: `${room.code}-${o.id}-${c.gifterId}-${c.at}`,
          comment: c.comment,
          gifterName: c.gifterName,
          bookTitle: o.bookTitle,
          at: c.at,
        })),
      ),
    );

    const keys = mine.flatMap((o) => o.gifterIds.map((g) => `${o.id}:${g}`));
    if (knownGiftsRef.current === null) {
      knownGiftsRef.current = new Set(keys);
      return;
    }
    const fresh = [];
    for (const o of mine) {
      for (const g of o.gifterIds) {
        const k = `${o.id}:${g}`;
        if (knownGiftsRef.current.has(k)) continue;
        knownGiftsRef.current.add(k);
        const cheer = (o.cheers || []).find((c) => c.gifterId === g);
        const gifter = room.players.find((p) => p.id === g);
        fresh.push({
          id: `${k}-${Date.now()}`,
          gifterName: cheer ? cheer.gifterName : gifter ? gifter.name : "だれか",
          comment: cheer ? cheer.comment : "",
        });
      }
    }
    if (fresh.length === 0) return;
    setToasts((t) => [...t, ...fresh]);
    const ids = new Set(fresh.map((f) => f.id));
    setTimeout(() => setToasts((t) => t.filter((x) => !ids.has(x.id))), 5000);
  }, [room, selfId]);

  // 自分のEXP(サーバーが真の値)をローカル保存に反映 → ソロのレベルにも通算される
  React.useEffect(() => {
    if (!room || !selfId) return;
    const me = room.players.find((p) => p.id === selfId);
    if (!me) return;
    const d = DQ.loadGameData();
    if (d.totalXp !== me.totalXp) {
      DQ.saveGameData({ ...d, totalXp: me.totalXp });
    }
  }, [room, selfId]);

  const createRoom = (name) => {
    pendingNameRef.current = name;
    socketRef.current.emit("createRoom", {
      name,
      totalXp: DQ.loadGameData().totalXp,
      playerId: playerIdRef.current,
    });
  };
  const joinRoom = (code, name) => {
    pendingNameRef.current = name;
    socketRef.current.emit("joinRoom", {
      code,
      name,
      totalXp: DQ.loadGameData().totalXp,
      playerId: playerIdRef.current,
    });
  };
  // 自分の意思で退出したときだけ、自動復帰の記憶を消す
  const leaveCircle = () => {
    rejoinRef.current = null;
    DQ.clearCircleSession();
    onExit();
  };
  const giftXp = (outputId, comment) =>
    socketRef.current.emit("giftXp", { outputId, comment });
  const startReading = (minutes) =>
    socketRef.current.emit("startReading", { minutes });
  const stopReading = () => socketRef.current.emit("stopReading");

  // アウトプットの読書時間は「みんなで読書」の設定時間(なければ15分)
  const readMinutes = (room && room.session && room.session.minutes) || 15;

  const submitOutput = (memo, action) => {
    socketRef.current.emit("submitOutput", {
      bookTitle: quest.bookTitle,
      missionIcon: quest.mission.icon,
      missionTitle: quest.mission.title,
      missionBonus: quest.mission.bonusXp,
      minutes: readMinutes,
      memo,
      action,
    });
    // 自分の冒険ログにも記録を残す(EXPはサーバーが加算するのでここでは足さない)
    const { xpGained } = DQ.calcSessionXp({
      mission: quest.mission,
      memo,
      action,
      minutes: readMinutes,
    });
    const d = DQ.loadGameData();
    DQ.saveGameData({
      ...d,
      logs: [
        {
          id: DQ.generateId(),
          bookId: null,
          bookTitle: quest.bookTitle,
          missionTitle: quest.mission.title,
          missionIcon: quest.mission.icon,
          memo: memo.trim(),
          action: (action || "").trim(),
          minutes: readMinutes,
          xpGained,
          date: new Date().toISOString(),
        },
        ...d.logs,
      ],
    });
    setQuestStep(null);
    setQuest({});
  };

  // ラッパー(背景+ヘッダー)
  const shell = (children) => (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 text-stone-800 transition-colors dark:from-stone-900 dark:to-stone-950 dark:text-stone-100">
      <div className="mx-auto max-w-2xl space-y-5 px-4 py-6 sm:py-8">
        <DQ.Header theme={theme} onToggleTheme={onToggleTheme} />
        {children}
        <CheerToasts toasts={toasts} />
      </div>
    </div>
  );

  // 前回の部屋に自動で戻っているところ
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
          onClick={leaveCircle}
          className="mx-auto block text-sm text-stone-500 underline dark:text-stone-400"
        >
          ← もどらずにモード選択へ
        </button>
      </div>,
    );
  }

  // 入室前
  if (phase === "entry") {
    return shell(
      <React.Fragment>
        <CircleEntry
          error={error}
          initialCode={initialCode}
          initialName={initialName}
          onCreate={createRoom}
          onJoin={joinRoom}
        />
        <button
          type="button"
          onClick={leaveCircle}
          className="mx-auto block text-sm text-stone-500 underline dark:text-stone-400"
        >
          ← モード選択にもどる
        </button>
      </React.Fragment>,
    );
  }

  // 入室後(部屋がまだ届いていない場合の保険)
  if (!room) {
    return shell(
      <p className="text-center text-sm text-stone-500 dark:text-stone-400">
        部屋に接続しています…
      </p>,
    );
  }

  // クエストのサブ画面
  const questBook = { title: quest.bookTitle };
  if (questStep === "book") {
    return shell(
      <CircleBookInput
        onNext={(bookTitle) => {
          setQuest({ bookTitle });
          setQuestStep("mission");
        }}
        onBack={() => setQuestStep(null)}
      />,
    );
  }
  if (questStep === "mission") {
    // 読書会では時間は共有タイマーで決めるので、個別の時間選択は隠す
    return shell(
      <DQ.MissionDraw
        book={questBook}
        hideTime
        onStart={(mission) => {
          setQuest((q) => ({ ...q, mission }));
          setQuestStep("waiting");
        }}
        onBack={() => setQuestStep(null)}
      />,
    );
  }
  if (questStep === "waiting") {
    // カードが決まったら、みんなで読書タイムが終わるのを待つ(ホストは開始もここから)
    return shell(
      <QuestReadingStep
        room={room}
        selfId={selfId}
        bookTitle={quest.bookTitle}
        mission={quest.mission}
        onStartReading={startReading}
        onStopReading={stopReading}
        onDone={() => setQuestStep("memo")}
        onCancel={() => setQuestStep(null)}
      />,
    );
  }
  if (questStep === "memo") {
    return shell(
      <DQ.MemoForm
        book={questBook}
        mission={quest.mission}
        minutes={readMinutes}
        submitLabel="みんなに投稿する!"
        onComplete={submitOutput}
      />,
    );
  }

  // 部屋のメイン
  return shell(
    <RoomView
      room={room}
      selfId={selfId}
      online={online}
      onStartQuest={() => setQuestStep("book")}
      onGift={giftXp}
      onExit={leaveCircle}
    />,
  );
};
