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
              部屋に集まってアウトプットを共有。EXPを贈り合おう!
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------- 読書会:入室フォーム ----------
function CircleEntry({ error, initialCode, onCreate, onJoin }) {
  const [tab, setTab] = React.useState("join"); // join | create
  const [name, setName] = React.useState("");
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

// ---------- 読書会:共有フィードの1件 ----------
function FeedItem({ output, selfId, onGift }) {
  const isMine = output.authorId === selfId;
  const gifted = output.gifterIds.includes(selfId);

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
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-stone-500 dark:text-stone-400">
          🎁 {output.giftCount} 人が応援
        </span>
        <button
          type="button"
          onClick={() => onGift(output.id)}
          disabled={isMine || gifted}
          className={
            gifted
              ? "rounded-full bg-amber-200 px-4 py-1.5 text-sm font-bold text-amber-800 dark:bg-amber-900 dark:text-amber-200"
              : "rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-1.5 text-sm font-bold text-white shadow transition hover:brightness-110 active:scale-95 disabled:opacity-40"
          }
        >
          {isMine ? "自分の記録" : gifted ? "🎁 応援ずみ" : "🎁 EXPを贈る"}
        </button>
      </div>
    </li>
  );
}

// ---------- 読書会:部屋のメイン画面 ----------
function RoomView({ room, selfId, onStartQuest, onGift, onExit }) {
  const [copied, setCopied] = React.useState(false);
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
    const text = `読書クエストの読書会に参加してね!部屋コード: ${room.code}`;
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

      <Roster players={room.players} selfId={selfId} hostId={room.hostId} />

      {/* クエスト開始 */}
      <button
        type="button"
        onClick={onStartQuest}
        className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-4 font-pixel text-lg text-white shadow-md transition hover:brightness-110 active:scale-95"
      >
        📖 読書クエストを始める
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
                onGift={onGift}
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
        ← 読書会から退出してモード選択へ
      </button>
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
DQ.CircleApp = function CircleApp({ theme, onToggleTheme, onExit, initialCode }) {
  const socketRef = React.useRef(null);
  const [phase, setPhase] = React.useState("entry"); // entry | room
  const [room, setRoom] = React.useState(null);
  const [selfId, setSelfId] = React.useState(null);
  const [error, setError] = React.useState("");

  // クエストのサブ画面: null | book | mission | timer | memo
  const [questStep, setQuestStep] = React.useState(null);
  const [quest, setQuest] = React.useState({}); // { bookTitle, mission, minutes }

  // ソケット接続(マウント時に1回だけ)
  React.useEffect(() => {
    // このゲーム専用の Socket.io ネームスペースにつなぐ
    const socket = io("/games/dokusho-quest");
    socketRef.current = socket;
    socket.on("joined", ({ selfId }) => {
      setSelfId(selfId);
      setPhase("room");
      setError("");
    });
    socket.on("roomUpdate", (state) => setRoom(state));
    socket.on("errorMsg", (msg) => setError(msg));
    return () => socket.disconnect();
  }, []);

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

  const createRoom = (name) =>
    socketRef.current.emit("createRoom", {
      name,
      totalXp: DQ.loadGameData().totalXp,
    });
  const joinRoom = (code, name) =>
    socketRef.current.emit("joinRoom", {
      code,
      name,
      totalXp: DQ.loadGameData().totalXp,
    });
  const giftXp = (outputId) =>
    socketRef.current.emit("giftXp", { outputId });

  const submitOutput = (memo) => {
    socketRef.current.emit("submitOutput", {
      bookTitle: quest.bookTitle,
      missionIcon: quest.mission.icon,
      missionTitle: quest.mission.title,
      missionBonus: quest.mission.bonusXp,
      minutes: quest.minutes,
      memo,
    });
    // 自分の冒険ログにも記録を残す(EXPはサーバーが加算するのでここでは足さない)
    const { xpGained } = DQ.calcSessionXp({
      mission: quest.mission,
      memo,
      minutes: quest.minutes,
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
          minutes: quest.minutes,
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
      </div>
    </div>
  );

  // 入室前
  if (phase === "entry") {
    return shell(
      <React.Fragment>
        <CircleEntry
          error={error}
          initialCode={initialCode}
          onCreate={createRoom}
          onJoin={joinRoom}
        />
        <button
          type="button"
          onClick={onExit}
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
    return shell(
      <DQ.MissionDraw
        book={questBook}
        onStart={(mission, sessionMinutes) => {
          setQuest((q) => ({ ...q, mission, minutes: sessionMinutes }));
          setQuestStep("timer");
        }}
        onBack={() => setQuestStep(null)}
      />,
    );
  }
  if (questStep === "timer") {
    return shell(
      <DQ.ReadingTimer
        book={questBook}
        mission={quest.mission}
        sessionMinutes={quest.minutes}
        onFinish={(minutes) => {
          setQuest((q) => ({ ...q, minutes }));
          setQuestStep("memo");
        }}
        onAbort={() => setQuestStep(null)}
      />,
    );
  }
  if (questStep === "memo") {
    return shell(
      <DQ.MemoForm
        book={questBook}
        mission={quest.mission}
        minutes={quest.minutes}
        onComplete={submitOutput}
      />,
    );
  }

  // 部屋のメイン
  return shell(
    <RoomView
      room={room}
      selfId={selfId}
      onStartQuest={() => setQuestStep("book")}
      onGift={giftXp}
      onExit={onExit}
    />,
  );
};
