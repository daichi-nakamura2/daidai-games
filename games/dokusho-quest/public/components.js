// ============================================================
// UIコンポーネント(JSX / Babelで変換される)
// ============================================================
window.DQ = window.DQ || {};

// ---------- ヘッダー ----------
DQ.Header = function Header({ theme, onToggleTheme }) {
  return (
    <header className="flex items-center justify-between">
      <h1 className="font-pixel text-2xl text-amber-800 sm:text-3xl dark:text-amber-200">
        📚 読書クエスト
      </h1>
      <button
        type="button"
        onClick={onToggleTheme}
        aria-label={theme === "light" ? "ダークモードにする" : "ライトモードにする"}
        className="rounded-full border-2 border-amber-300 bg-white/70 px-3 py-2 text-lg shadow-sm transition hover:scale-110 dark:border-amber-700 dark:bg-stone-800/70"
      >
        {theme === "light" ? "🌙" : "☀️"}
      </button>
    </header>
  );
};

// ---------- プレイヤーステータス ----------
DQ.PlayerCard = function PlayerCard({ data }) {
  const { level, current, required, ratio } = DQ.levelProgress(data.totalXp);
  const totalMinutes = data.logs.reduce((sum, log) => sum + log.minutes, 0);

  return (
    <section className="animate-fade-up rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-100 to-orange-100 p-4 shadow-md sm:p-5 dark:border-amber-700 dark:from-stone-800 dark:to-amber-950">
      <div className="flex items-center gap-4">
        <div className="animate-bounce-slow text-4xl sm:text-5xl">🧙</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            {DQ.titleForLevel(level)}
          </p>
          <p className="font-pixel text-xl text-stone-800 sm:text-2xl dark:text-amber-100">
            Lv.{level}
          </p>
        </div>
        <div className="text-right text-xs text-stone-500 sm:text-sm dark:text-stone-400">
          <p>⏱️ 累計 {totalMinutes} 分</p>
          <p>📖 冒険 {data.logs.length} 回</p>
        </div>
      </div>
      <div className="mt-3">
        <div className="flex justify-between text-xs text-stone-500 dark:text-stone-400">
          <span>EXP</span>
          <span>
            {current} / {required}
          </span>
        </div>
        <div className="mt-1 h-3 overflow-hidden rounded-full bg-amber-200/70 dark:bg-stone-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-700"
            style={{ width: `${Math.max(ratio * 100, 2)}%` }}
          />
        </div>
      </div>
    </section>
  );
};

// ---------- 本棚(登録・選択・削除) ----------
DQ.BookShelf = function BookShelf({ books, onAddBook, onDeleteBook, onSelectBook }) {
  const [showForm, setShowForm] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [author, setAuthor] = React.useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddBook(title, author);
    setTitle("");
    setAuthor("");
    setShowForm(false);
  };

  const handleDelete = (book) => {
    if (window.confirm(`「${book.title}」を本棚から外しますか?`)) {
      onDeleteBook(book.id);
    }
  };

  return (
    <section className="animate-fade-up rounded-2xl border-2 border-amber-300 bg-white/80 p-4 shadow-md sm:p-5 dark:border-amber-700 dark:bg-stone-800/80">
      <div className="flex items-center justify-between">
        <h2 className="font-pixel text-lg text-stone-800 dark:text-amber-100">
          🏰 本棚
        </h2>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-full bg-amber-500 px-4 py-1.5 text-sm font-bold text-white shadow transition hover:bg-amber-600 active:scale-95"
        >
          {showForm ? "とじる" : "＋ 本を登録"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="animate-pop-in mt-3 space-y-2 rounded-xl bg-amber-50 p-3 dark:bg-stone-700/50"
        >
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="本のタイトル(必須)"
            autoFocus
            className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:ring-2 focus:ring-amber-400 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
          />
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="著者(任意)"
            className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:ring-2 focus:ring-amber-400 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
          />
          <button
            type="submit"
            disabled={!title.trim()}
            className="w-full rounded-lg bg-orange-500 py-2 text-sm font-bold text-white shadow transition hover:bg-orange-600 active:scale-95 disabled:opacity-40"
          >
            本棚に追加する
          </button>
        </form>
      )}

      {books.length === 0 && !showForm ? (
        <p className="mt-4 text-center text-sm text-stone-500 dark:text-stone-400">
          まだ本がありません。
          <br />
          「＋ 本を登録」から冒険の書を追加しよう!
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {books.map((book) => (
            <li
              key={book.id}
              className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3 dark:border-stone-600 dark:bg-stone-700/40"
            >
              <span className="text-2xl">📖</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-stone-800 dark:text-stone-100">
                  {book.title}
                </p>
                <p className="truncate text-xs text-stone-500 dark:text-stone-400">
                  {book.author || "著者未登録"} ・ 冒険 {book.totalSessions} 回
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectBook(book)}
                className="shrink-0 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-sm font-bold text-white shadow transition hover:brightness-110 active:scale-95"
              >
                今日はこれ!
              </button>
              <button
                type="button"
                onClick={() => handleDelete(book)}
                aria-label={`「${book.title}」を削除`}
                className="shrink-0 text-stone-400 transition hover:text-red-500"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

// ---------- 冒険ログ(読書記録の一覧) ----------
DQ.AdventureLog = function AdventureLog({ logs }) {
  const MAX_LOGS = 10;
  if (logs.length === 0) return null;

  return (
    <section className="animate-fade-up rounded-2xl border-2 border-amber-300 bg-white/80 p-4 shadow-md sm:p-5 dark:border-amber-700 dark:bg-stone-800/80">
      <h2 className="font-pixel text-lg text-stone-800 dark:text-amber-100">
        📜 冒険ログ
      </h2>
      <ul className="mt-3 space-y-2">
        {logs.slice(0, MAX_LOGS).map((log) => (
          <li
            key={log.id}
            className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-sm dark:border-stone-600 dark:bg-stone-700/40"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="truncate font-bold text-stone-800 dark:text-stone-100">
                {log.missionIcon} {log.bookTitle}
              </p>
              <span className="shrink-0 rounded-full bg-amber-200 px-2 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                +{log.xpGained} EXP
              </span>
            </div>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              {new Date(log.date).toLocaleDateString("ja-JP")} ・ {log.minutes}分 ・{" "}
              {log.missionTitle}
            </p>
            {log.memo && (
              <p className="mt-1 whitespace-pre-wrap text-stone-600 dark:text-stone-300">
                {log.memo}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
};

// ---------- ミッションカードを引く画面 ----------
const DQ_RARITY_STYLES = {
  normal:
    "border-stone-300 from-stone-50 to-amber-50 dark:border-stone-500 dark:from-stone-700 dark:to-stone-800",
  rare: "border-sky-400 from-sky-50 to-indigo-50 dark:border-sky-500 dark:from-sky-950 dark:to-indigo-950",
  epic: "border-purple-400 from-purple-50 to-pink-50 dark:border-purple-500 dark:from-purple-950 dark:to-pink-950",
};

const DQ_RARITY_BADGE = {
  normal: "bg-stone-200 text-stone-600 dark:bg-stone-600 dark:text-stone-200",
  rare: "bg-sky-200 text-sky-700 dark:bg-sky-800 dark:text-sky-200",
  epic: "bg-purple-200 text-purple-700 dark:bg-purple-800 dark:text-purple-200",
};

DQ.MissionDraw = function MissionDraw({ book, onStart, onBack }) {
  const [mission, setMission] = React.useState(null);
  const [minutes, setMinutes] = React.useState(DQ.SESSION_OPTIONS[0]);

  return (
    <section className="animate-fade-up space-y-4 text-center">
      <p className="text-sm text-stone-600 dark:text-stone-300">
        今日の冒険の書:<span className="font-bold">『{book.title}』</span>
      </p>

      {mission === null ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setMission(DQ.drawMission())}
            className="mx-auto flex h-56 w-40 flex-col items-center justify-center gap-3 rounded-2xl border-4 border-amber-400 bg-gradient-to-br from-amber-300 to-orange-400 shadow-lg transition hover:scale-105 active:scale-95 dark:border-amber-600 dark:from-amber-700 dark:to-orange-800"
          >
            <span className="animate-sparkle text-5xl">🎴</span>
            <span className="font-pixel text-white drop-shadow">カードを引く</span>
          </button>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            ミッションカードを引いて、今日のクエストを決めよう!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div
            key={mission.id + String(Date.now())}
            className={`animate-card-flip mx-auto max-w-xs rounded-2xl border-4 bg-gradient-to-br p-5 shadow-lg ${DQ_RARITY_STYLES[mission.rarity]}`}
          >
            <span
              className={`inline-block rounded-full px-3 py-0.5 text-xs font-bold ${DQ_RARITY_BADGE[mission.rarity]}`}
            >
              {DQ.RARITY_LABELS[mission.rarity]}
            </span>
            <div className="mt-3 text-5xl">{mission.icon}</div>
            <h2 className="font-pixel mt-3 text-lg text-stone-800 dark:text-stone-100">
              {mission.title}
            </h2>
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
              {mission.description}
            </p>
            <p className="mt-3 text-xs font-bold text-amber-600 dark:text-amber-400">
              ボーナス +{mission.bonusXp} EXP
            </p>
          </div>

          <div>
            <p className="text-sm font-bold text-stone-600 dark:text-stone-300">
              ⏱ 今日の読書時間
            </p>
            <div className="mt-2 flex justify-center gap-2">
              {DQ.SESSION_OPTIONS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMinutes(m)}
                  className={
                    minutes === m
                      ? "rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-sm font-bold text-white shadow"
                      : "rounded-full border-2 border-amber-300 bg-white/70 px-4 py-2 text-sm font-bold text-stone-500 transition hover:bg-amber-50 active:scale-95 dark:border-stone-600 dark:bg-stone-800/70 dark:text-stone-400 dark:hover:bg-stone-700"
                  }
                >
                  {m}分
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => setMission(DQ.drawMission())}
              className="rounded-full border-2 border-amber-400 bg-white/70 px-4 py-2 text-sm font-bold text-amber-700 transition hover:bg-amber-50 active:scale-95 dark:bg-stone-800/70 dark:text-amber-300 dark:hover:bg-stone-700"
            >
              🎴 引き直す
            </button>
            <button
              type="button"
              onClick={() => onStart(mission, minutes)}
              className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2 font-bold text-white shadow transition hover:brightness-110 active:scale-95"
            >
              クエスト開始!
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onBack}
        className="text-sm text-stone-500 underline dark:text-stone-400"
      >
        ← 本棚にもどる
      </button>
    </section>
  );
};

// ---------- 読書タイマー(時間は sessionMinutes で指定) ----------

// 経過秒数から獲得扱いにする読書分数を計算(最低1分)
function dqElapsedToMinutes(elapsedSeconds) {
  return Math.max(1, Math.round(elapsedSeconds / 60));
}

DQ.ReadingTimer = function ReadingTimer({
  book,
  mission,
  sessionMinutes,
  onFinish,
  onAbort,
}) {
  const totalSeconds = sessionMinutes * 60;
  const [remaining, setRemaining] = React.useState(totalSeconds);
  const [isPaused, setIsPaused] = React.useState(false);
  const onFinishRef = React.useRef(onFinish);
  onFinishRef.current = onFinish;

  React.useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onFinishRef.current(dqElapsedToMinutes(totalSeconds));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaused, totalSeconds]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = 1 - remaining / totalSeconds;

  const handleAbort = () => {
    if (window.confirm("クエストを中断しますか?(記録は残りません)")) {
      onAbort();
    }
  };

  return (
    <section className="animate-fade-up space-y-5 text-center">
      <div className="rounded-2xl border-2 border-amber-300 bg-white/80 p-4 shadow-md dark:border-amber-700 dark:bg-stone-800/80">
        <p className="text-sm text-stone-600 dark:text-stone-300">
          📖『{book.title}』
        </p>
        <p className="mt-1 text-sm font-bold text-amber-700 dark:text-amber-300">
          {mission.icon} {mission.title}
        </p>
      </div>

      <div className="mx-auto flex h-52 w-52 flex-col items-center justify-center rounded-full border-8 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-100 shadow-inner sm:h-60 sm:w-60 dark:border-amber-700 dark:from-stone-800 dark:to-amber-950">
        <span className="text-3xl">{isPaused ? "😴" : "🔥"}</span>
        <p className="font-pixel mt-1 text-5xl text-stone-800 tabular-nums sm:text-6xl dark:text-amber-100">
          {minutes}:{String(seconds).padStart(2, "0")}
        </p>
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          {isPaused ? "ひとやすみ中…" : "集中して読もう!"}
        </p>
      </div>

      <div className="mx-auto h-2 max-w-xs overflow-hidden rounded-full bg-amber-200/70 dark:bg-stone-700">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-1000"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="flex justify-center gap-3">
        <button
          type="button"
          onClick={() => setIsPaused((v) => !v)}
          className="rounded-full border-2 border-amber-400 bg-white/70 px-5 py-2 text-sm font-bold text-amber-700 transition hover:bg-amber-50 active:scale-95 dark:bg-stone-800/70 dark:text-amber-300 dark:hover:bg-stone-700"
        >
          {isPaused ? "▶ 再開" : "⏸ 一時停止"}
        </button>
        <button
          type="button"
          onClick={() =>
            onFinish(dqElapsedToMinutes(totalSeconds - remaining))
          }
          className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2 font-bold text-white shadow transition hover:brightness-110 active:scale-95"
        >
          読み終えた!
        </button>
      </div>

      <button
        type="button"
        onClick={handleAbort}
        className="text-sm text-stone-500 underline dark:text-stone-400"
      >
        クエストを中断する
      </button>
    </section>
  );
};

// ---------- 読書メモ入力 ----------
DQ.MemoForm = function MemoForm({ book, mission, minutes, onComplete }) {
  const [memo, setMemo] = React.useState("");

  return (
    <section className="animate-fade-up space-y-4">
      <div className="rounded-2xl border-2 border-amber-300 bg-white/80 p-4 text-center shadow-md dark:border-amber-700 dark:bg-stone-800/80">
        <p className="font-pixel text-lg text-stone-800 dark:text-amber-100">
          🎉 {minutes}分の読書、おつかれさま!
        </p>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
          『{book.title}』での学びを書き残そう
        </p>
      </div>

      <div className="rounded-2xl border-2 border-amber-300 bg-white/80 p-4 shadow-md dark:border-amber-700 dark:bg-stone-800/80">
        <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
          {mission.icon} ミッション: {mission.title}
        </p>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={5}
          autoFocus
          placeholder={`${mission.description}\nここに書き残すと +20 EXP!`}
          className="mt-3 w-full resize-none rounded-xl border border-amber-300 bg-amber-50/50 px-3 py-2 text-sm text-stone-800 outline-none focus:ring-2 focus:ring-amber-400 dark:border-stone-600 dark:bg-stone-700/50 dark:text-stone-100"
        />
        <div className="mt-3 flex flex-col gap-2 sm:flex-row-reverse">
          <button
            type="button"
            onClick={() => onComplete(memo)}
            disabled={!memo.trim()}
            className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2 font-bold text-white shadow transition hover:brightness-110 active:scale-95 disabled:opacity-40 sm:flex-1"
          >
            記録してクエスト完了!
          </button>
          <button
            type="button"
            onClick={() => onComplete("")}
            className="rounded-full border-2 border-amber-300 px-6 py-2 text-sm font-bold text-stone-500 transition hover:bg-amber-50 active:scale-95 dark:border-stone-600 dark:text-stone-400 dark:hover:bg-stone-700"
          >
            メモなしで完了
          </button>
        </div>
      </div>
    </section>
  );
};

// ---------- リザルト画面 ----------

/** 読書の成果をSNSにシェアする(スマホは共有シート、PCはXの投稿画面) */
function dqShareResult(result) {
  const title = DQ.titleForLevel(result.newLevel);
  const text =
    `📚読書クエスト:『${result.bookTitle}』を${result.minutes}分読んで +${result.xpGained} EXP獲得!` +
    `${result.leveledUp ? `✨レベルアップして` : `現在`} Lv.${result.newLevel}「${title}」 #読書クエスト`;

  if (navigator.share) {
    navigator.share({ text, url: DQ.APP_URL }).catch(() => {
      // ユーザーが共有をキャンセルした場合は何もしない
    });
  } else {
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(DQ.APP_URL)}`;
    window.open(intent, "_blank", "noopener");
  }
}

DQ.ResultScreen = function ResultScreen({ result, onClose }) {
  return (
    <section className="animate-pop-in space-y-4 text-center">
      {result.leveledUp && (
        <div className="rounded-2xl border-4 border-yellow-400 bg-gradient-to-br from-yellow-100 to-amber-200 p-5 shadow-lg dark:border-yellow-600 dark:from-yellow-950 dark:to-amber-900">
          <p className="animate-sparkle text-4xl">✨🎉✨</p>
          <p className="font-pixel mt-2 text-2xl text-amber-800 dark:text-yellow-200">
            レベルアップ!
          </p>
          <p className="font-pixel mt-1 text-lg text-stone-700 dark:text-amber-100">
            Lv.{result.prevLevel} → Lv.{result.newLevel}
          </p>
          <p className="mt-1 text-sm font-bold text-amber-700 dark:text-amber-300">
            称号: {DQ.titleForLevel(result.newLevel)}
          </p>
        </div>
      )}

      <div className="rounded-2xl border-2 border-amber-300 bg-white/80 p-5 shadow-md dark:border-amber-700 dark:bg-stone-800/80">
        <p className="font-pixel text-xl text-stone-800 dark:text-amber-100">
          🏆 クエストクリア!
        </p>
        <ul className="mx-auto mt-4 max-w-xs space-y-1.5 text-sm">
          {result.breakdown.map((item) => (
            <li
              key={item.label}
              className="flex justify-between gap-3 text-stone-600 dark:text-stone-300"
            >
              <span className="truncate">{item.label}</span>
              <span className="shrink-0 font-bold text-amber-600 dark:text-amber-400">
                +{item.xp}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 border-t border-amber-200 pt-3 text-lg font-bold text-orange-600 dark:border-stone-600 dark:text-orange-400">
          合計 +{result.xpGained} EXP
        </p>
      </div>

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={() => dqShareResult(result)}
          className="rounded-full border-2 border-amber-400 bg-white/70 px-6 py-3 font-bold text-amber-700 transition hover:bg-amber-50 active:scale-95 dark:bg-stone-800/70 dark:text-amber-300 dark:hover:bg-stone-700"
        >
          📣 成果をシェアする
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-3 font-bold text-white shadow transition hover:brightness-110 active:scale-95"
        >
          ホームにもどる
        </button>
      </div>
    </section>
  );
};
