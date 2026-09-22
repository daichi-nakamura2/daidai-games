// ============================================================
// 進行まわりのUI部品(2.0)
//   「今どのSTEPか」「あと何分か」「次に何をするか」を
//   全員の画面に常に出しておくための部品を集めたファイル。
// ============================================================
window.DQ = window.DQ || {};

// server.js の PHASES と同じ順番
DQ.PHASE_ORDER = ["lobby", "mission", "reading", "draft", "share", "final", "done"];

/** サーバーの共有タイマーに合わせて残り時間を刻む */
DQ.useCountdown = function useCountdown(timer) {
  const [remaining, setRemaining] = React.useState(0);
  React.useEffect(() => {
    if (!timer) {
      setRemaining(0);
      return;
    }
    // 届いた時点の残り時間を基準に、この端末で数え直す(誤差はほぼ1秒以内)
    const endsAt = Date.now() + timer.remainingMs;
    const tick = () => setRemaining(Math.max(0, endsAt - Date.now()));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [timer]);
  return remaining;
};

/** ミリ秒を m:ss に */
DQ.formatClock = function formatClock(ms) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

// ---------- 進行バー(今どこにいるか) ----------
DQ.StepProgress = function StepProgress({ phase }) {
  const now = DQ.PHASE_ORDER.indexOf(phase);

  return (
    <nav
      aria-label="今日の進行"
      className="rounded-2xl border-2 border-amber-300 bg-white/80 px-2 py-2.5 shadow-sm dark:border-amber-700 dark:bg-stone-800/80"
    >
      <ol className="flex items-stretch justify-between gap-0.5">
        {DQ.STEPS.map((s) => {
          const idx = DQ.PHASE_ORDER.indexOf(s.phase);
          const state = idx < now ? "done" : idx === now ? "now" : "next";
          return (
            <li
              key={s.no}
              aria-current={state === "now" ? "step" : undefined}
              className={
                "flex flex-1 flex-col items-center gap-0.5 rounded-lg px-0.5 py-1 text-center transition " +
                (state === "now"
                  ? "bg-gradient-to-b from-amber-400 to-orange-500 text-white shadow"
                  : state === "done"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-stone-400 dark:text-stone-500")
              }
            >
              <span className={state === "next" ? "text-base opacity-50" : "text-base"}>
                {state === "done" ? "✅" : s.icon}
              </span>
              {/* 画面が狭いときは番号だけ(名前は下の「いまやること」に出ている) */}
              <span className="text-[10px] leading-tight font-bold sm:hidden">{s.no}</span>
              <span className="hidden text-[10px] leading-tight font-bold sm:block">
                {s.short}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

// ---------- いまやること(全員に見せる見出し) ----------
DQ.PhaseHeader = function PhaseHeader({ phase, children }) {
  const info = DQ.PHASE_INFO[phase];
  if (!info) return null;

  return (
    <section className="rounded-2xl border-2 border-amber-400 bg-gradient-to-br from-amber-100 to-orange-100 p-4 shadow-md dark:border-amber-700 dark:from-stone-800 dark:to-amber-950">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-white">
          {info.badge}
        </span>
        <span className="text-xs text-amber-700 dark:text-amber-300">
          いまやること
        </span>
      </div>
      <h2 className="font-pixel mt-2 text-xl text-stone-800 sm:text-2xl dark:text-amber-100">
        {info.icon} {info.title}
      </h2>
      <p className="mt-1.5 text-sm text-stone-600 dark:text-stone-300">{info.lead}</p>
      {children}
    </section>
  );
};

// ---------- 今日の流れ(チュートリアル) ----------
DQ.FlowGuide = function FlowGuide({ open: initialOpen = true, compact }) {
  const [open, setOpen] = React.useState(initialOpen);

  return (
    <section className="rounded-2xl border-2 border-amber-300 bg-white/80 p-4 shadow-md dark:border-amber-700 dark:bg-stone-800/80">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <h2 className="font-pixel text-lg text-stone-800 dark:text-amber-100">
          🗺 今日はこの順番で進みます
        </h2>
        <span className="shrink-0 text-sm text-stone-400">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <ol className="mt-3 space-y-2">
          {DQ.STEPS.map((s) => (
            <li
              key={s.no}
              className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3 dark:border-stone-600 dark:bg-stone-700/40"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-white">
                {s.no}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-stone-800 dark:text-stone-100">
                  {s.icon} {s.title}
                </p>
                {!compact && (
                  <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
                    {s.lead}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};

// ---------- 共有タイマー(部屋の全員が同じ数字を見る) ----------
DQ.SharedTimer = function SharedTimer({ timer, isHost, onStop, onExtend, note }) {
  const remaining = DQ.useCountdown(timer);
  if (!timer) return null;

  const ratio = timer.durationMs > 0 ? remaining / timer.durationMs : 0;
  const finished = remaining <= 0;
  // 残り1分を切ったら赤くして、声をかけやすくする
  const urgent = !finished && remaining <= 60000;

  return (
    <section
      className={
        "rounded-2xl border-2 p-5 text-center shadow-md transition-colors " +
        (finished
          ? "border-stone-300 bg-white/80 dark:border-stone-600 dark:bg-stone-800/80"
          : urgent
            ? "border-red-400 bg-gradient-to-br from-red-50 to-orange-100 dark:border-red-700 dark:from-stone-800 dark:to-red-950"
            : "border-amber-400 bg-gradient-to-br from-amber-100 to-orange-100 dark:border-amber-700 dark:from-stone-800 dark:to-amber-950")
      }
    >
      <p
        className={
          "text-sm font-bold " +
          (finished
            ? "text-stone-500 dark:text-stone-400"
            : urgent
              ? "text-red-600 dark:text-red-400"
              : "text-amber-700 dark:text-amber-300")
        }
      >
        {finished ? "⏹ 時間になりました" : urgent ? "⏰ まもなく終了" : `🔥 ${timer.label}`}
      </p>
      <p className="font-pixel mt-1 text-5xl text-stone-800 tabular-nums sm:text-6xl dark:text-amber-100">
        {DQ.formatClock(remaining)}
      </p>

      <div className="mx-auto mt-3 h-2 max-w-xs overflow-hidden rounded-full bg-amber-200/70 dark:bg-stone-700">
        <div
          className={
            "h-full rounded-full transition-all duration-500 " +
            (urgent
              ? "bg-gradient-to-r from-red-400 to-orange-500"
              : "bg-gradient-to-r from-amber-400 to-orange-500")
          }
          style={{ width: `${Math.max(ratio * 100, 0)}%` }}
        />
      </div>

      {note && (
        <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">{note}</p>
      )}

      {isHost && (
        <div className="mt-3 flex justify-center gap-2">
          <button
            type="button"
            onClick={onExtend}
            className="rounded-full border-2 border-amber-400 bg-white/70 px-4 py-1.5 text-xs font-bold text-amber-700 transition hover:bg-amber-50 active:scale-95 dark:bg-stone-800/70 dark:text-amber-300"
          >
            ＋1分
          </button>
          {!finished && (
            <button
              type="button"
              onClick={onStop}
              className="rounded-full border-2 border-amber-400 bg-white/70 px-4 py-1.5 text-xs font-bold text-amber-700 transition hover:bg-amber-50 active:scale-95 dark:bg-stone-800/70 dark:text-amber-300"
            >
              ⏹ ここで終える
            </button>
          )}
        </div>
      )}
    </section>
  );
};

// ---------- ホスト進行パネル(ホストにだけ見える) ----------
// 台本・操作ボタン・次のSTEPをここに集約して、
// 主催者がこのパネルだけ見れば進行できるようにしている。
DQ.HostPanel = function HostPanel({ phase, onNext, children, nextDisabledNote }) {
  const info = DQ.PHASE_INFO[phase];
  const [showScript, setShowScript] = React.useState(true);
  if (!info) return null;

  return (
    <section className="rounded-2xl border-2 border-indigo-300 bg-indigo-50/80 p-4 shadow-md dark:border-indigo-800 dark:bg-indigo-950/40">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-pixel text-base text-indigo-900 dark:text-indigo-100">
          👑 ホスト進行パネル
        </h2>
        <button
          type="button"
          onClick={() => setShowScript((v) => !v)}
          className="shrink-0 text-xs text-indigo-600 underline dark:text-indigo-300"
        >
          {showScript ? "台本をとじる" : "台本を見る"}
        </button>
      </div>

      {showScript && (
        <p className="mt-2 rounded-xl border border-indigo-200 bg-white/80 px-3 py-2.5 text-sm text-stone-700 dark:border-indigo-900 dark:bg-stone-900/60 dark:text-stone-200">
          <span className="mr-1 text-xs font-bold text-indigo-500 dark:text-indigo-300">
            読み上げ用
          </span>
          <br />
          {info.script}
        </p>
      )}

      {children && <div className="mt-3 space-y-3">{children}</div>}

      {info.next && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => onNext(info.next.phase)}
            className="w-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 py-3 font-bold text-white shadow transition hover:brightness-110 active:scale-95"
          >
            {info.next.label} →
          </button>
          {nextDisabledNote && (
            <p className="mt-1.5 text-center text-xs text-indigo-600 dark:text-indigo-300">
              {nextDisabledNote}
            </p>
          )}
        </div>
      )}
    </section>
  );
};

// ---------- 参加メンバー(進み具合つき) ----------
DQ.Roster = function Roster({ players, entries, selfId, hostId, onRemove }) {
  const byId = new Map(entries.map((e) => [e.playerId, e]));
  const sorted = [...players].sort((a, b) => b.totalXp - a.totalXp);
  const medals = ["🥇", "🥈", "🥉"];
  const iAmHost = hostId === selfId;

  return (
    <section className="rounded-2xl border-2 border-amber-300 bg-white/80 p-4 shadow-md dark:border-amber-700 dark:bg-stone-800/80">
      <h2 className="font-pixel text-lg text-stone-800 dark:text-amber-100">
        🏅 参加メンバー({players.length}人)
      </h2>
      <ul className="mt-3 space-y-2">
        {sorted.map((p, i) => {
          const level = DQ.levelFromXp(p.totalXp);
          const e = byId.get(p.id);
          const isSelf = p.id === selfId;
          const marks = [
            { on: e && e.hasMission, icon: "🎴", label: "カード" },
            { on: e && e.hasDraft, icon: "✍️", label: "仮アクション" },
            { on: e && e.hasFinal, icon: "🎯", label: "最終アクション" },
          ];
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
              <span className="w-6 text-center text-lg">{medals[i] || i + 1}</span>
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
                    <span className="ml-1 text-xs text-stone-400">(接続待ち)</span>
                  )}
                </p>
                <p className="truncate text-xs text-stone-500 dark:text-stone-400">
                  Lv.{level} ・ {DQ.titleForLevel(level)}
                </p>
              </div>
              <span className="flex shrink-0 gap-0.5 text-sm" aria-hidden="true">
                {marks.map((m) => (
                  <span key={m.label} title={m.label} className={m.on ? "" : "opacity-20"}>
                    {m.icon}
                  </span>
                ))}
              </span>
              <span className="shrink-0 rounded-full bg-amber-200 px-2 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                {p.totalXp}
              </span>
              {iAmHost && !p.connected && p.id !== hostId && (
                <button
                  type="button"
                  onClick={() => onRemove(p.id)}
                  aria-label={`${p.name} を一覧から外す`}
                  title="一覧から外す"
                  className="shrink-0 text-stone-400 transition hover:text-red-500"
                >
                  ✕
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
};

// ---------- 待機中の案内(ホスト以外) ----------
DQ.WaitingNote = function WaitingNote({ phase, done, total }) {
  const info = DQ.PHASE_INFO[phase];
  if (!info || !info.waiting) return null;
  return (
    <p className="rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2.5 text-center text-sm text-stone-600 dark:border-stone-600 dark:bg-stone-800/60 dark:text-stone-300">
      ⏳ {info.waiting}
      {typeof done === "number" && (
        <span className="mt-0.5 block text-xs font-bold text-amber-600 dark:text-amber-400">
          {done} / {total} 人が完了
        </span>
      )}
    </p>
  );
};
