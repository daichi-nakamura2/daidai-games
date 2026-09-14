// ============================================================
// アプリ本体(モード選択 → ソロ / 読書会)
// ============================================================

// ---------- ソロプレイ(ひとりで冒険) ----------
function SoloApp({ theme, onToggleTheme, onExit }) {
  // ゲームデータ(本・ログ・XP)。変更のたびに localStorage へ保存
  const [data, setData] = React.useState(DQ.loadGameData);
  React.useEffect(() => {
    DQ.saveGameData(data);
  }, [data]);

  // 画面遷移: home → mission → reading → memo → result → home
  const [screen, setScreen] = React.useState({ name: "home" });

  const addBook = (title, author) => {
    const book = {
      id: DQ.generateId(),
      title: title.trim(),
      author: author.trim(),
      createdAt: new Date().toISOString(),
      totalSessions: 0,
    };
    setData((prev) => ({ ...prev, books: [book, ...prev.books] }));
  };

  const deleteBook = (bookId) => {
    setData((prev) => ({
      ...prev,
      books: prev.books.filter((b) => b.id !== bookId),
    }));
  };

  /** 読書セッションを完了して、XP加算・ログ追加・リザルト表示を行う */
  const completeSession = ({ book, mission, memo, minutes }) => {
    const { breakdown, xpGained } = DQ.calcSessionXp({ mission, memo, minutes });
    const prevLevel = DQ.levelFromXp(data.totalXp);
    const newLevel = DQ.levelFromXp(data.totalXp + xpGained);

    const log = {
      id: DQ.generateId(),
      bookId: book.id,
      bookTitle: book.title,
      missionTitle: mission.title,
      missionIcon: mission.icon,
      memo: memo.trim(),
      minutes,
      xpGained,
      date: new Date().toISOString(),
    };

    setData((prev) => ({
      books: prev.books.map((b) =>
        b.id === book.id ? { ...b, totalSessions: b.totalSessions + 1 } : b,
      ),
      logs: [log, ...prev.logs],
      totalXp: prev.totalXp + xpGained,
    }));

    setScreen({
      name: "result",
      result: {
        xpGained,
        breakdown,
        prevLevel,
        newLevel,
        leveledUp: newLevel > prevLevel,
        bookTitle: book.title,
        minutes,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 text-stone-800 transition-colors dark:from-stone-900 dark:to-stone-950 dark:text-stone-100">
      <div className="mx-auto max-w-2xl space-y-5 px-4 py-6 sm:py-8">
        <DQ.Header theme={theme} onToggleTheme={onToggleTheme} />

        {screen.name === "home" && (
          <React.Fragment>
            <PlayerCardWithExit data={data} onExit={onExit} />
            <DQ.BookShelf
              books={data.books}
              onAddBook={addBook}
              onDeleteBook={deleteBook}
              onSelectBook={(book) => setScreen({ name: "mission", book })}
            />
            <DQ.AdventureLog logs={data.logs} />
          </React.Fragment>
        )}

        {screen.name === "mission" && (
          <DQ.MissionDraw
            book={screen.book}
            onStart={(mission, sessionMinutes) =>
              setScreen({
                name: "reading",
                book: screen.book,
                mission,
                sessionMinutes,
              })
            }
            onBack={() => setScreen({ name: "home" })}
          />
        )}

        {screen.name === "reading" && (
          <DQ.ReadingTimer
            book={screen.book}
            mission={screen.mission}
            sessionMinutes={screen.sessionMinutes}
            onFinish={(minutes) =>
              setScreen({
                name: "memo",
                book: screen.book,
                mission: screen.mission,
                minutes,
              })
            }
            onAbort={() => setScreen({ name: "home" })}
          />
        )}

        {screen.name === "memo" && (
          <DQ.MemoForm
            book={screen.book}
            mission={screen.mission}
            minutes={screen.minutes}
            onComplete={(memo) =>
              completeSession({
                book: screen.book,
                mission: screen.mission,
                memo,
                minutes: screen.minutes,
              })
            }
          />
        )}

        {screen.name === "result" && (
          <DQ.ResultScreen
            result={screen.result}
            onClose={() => setScreen({ name: "home" })}
          />
        )}
      </div>
    </div>
  );
}

// ソロのホームで、プレイヤーカードの上に「モード選択にもどる」を添える
function PlayerCardWithExit({ data, onExit }) {
  return (
    <React.Fragment>
      <button
        type="button"
        onClick={onExit}
        className="text-sm text-stone-500 underline dark:text-stone-400"
      >
        ← モード選択にもどる
      </button>
      <DQ.PlayerCard data={data} />
    </React.Fragment>
  );
}

// URL の ?room=XXXX を読む(招待リンクから来た場合、そのコードで読書会へ)
function roomCodeFromUrl() {
  try {
    const code = new URLSearchParams(location.search).get("room") || "";
    return code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
  } catch {
    return "";
  }
}

/**
 * 読書会をどう始めるかを決める。
 *  - 直前まで参加していた部屋があれば、そこへ自動で戻る(autoRejoin)
 *  - 招待リンク(?room=)で来たなら、そのコードを入れた入室フォームを出す
 */
function circleStart() {
  const urlCode = roomCodeFromUrl();
  const saved = DQ.loadCircleSession();
  if (saved && (!urlCode || urlCode === saved.code)) {
    return {
      initialCode: saved.code,
      initialName: saved.name,
      autoRejoin: saved,
    };
  }
  if (urlCode) {
    return {
      initialCode: urlCode,
      initialName: saved ? saved.name : "",
      autoRejoin: null,
    };
  }
  return null;
}

// ---------- ルート(モード選択で切り替え) ----------
function App() {
  const [theme, setTheme] = React.useState(DQ.loadTheme);
  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    DQ.saveTheme(theme);
  }, [theme]);
  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  // 招待リンクで来たとき / 読書会の途中で閉じてしまったときは、最初から読書会モード
  const start = React.useRef(circleStart()).current;
  const [mode, setMode] = React.useState(start ? "circle" : null);

  if (mode === "circle") {
    return (
      <DQ.CircleApp
        theme={theme}
        onToggleTheme={toggleTheme}
        onExit={() => setMode(null)}
        initialCode={start ? start.initialCode : ""}
        initialName={start ? start.initialName : ""}
        autoRejoin={start ? start.autoRejoin : null}
      />
    );
  }
  if (mode === "solo") {
    return (
      <SoloApp
        theme={theme}
        onToggleTheme={toggleTheme}
        onExit={() => setMode(null)}
      />
    );
  }
  return <DQ.Landing theme={theme} onToggleTheme={toggleTheme} onPick={setMode} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
