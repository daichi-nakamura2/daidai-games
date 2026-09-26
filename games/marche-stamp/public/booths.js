// スタンプラリーの設定。ブースを増やすときは booths に1行足し、
// 印刷用/qr-sheet.html の CODES にも同じ id でコードを足す（hash は作り直しが必要）。
window.RALLY = {
  eventName: "ノザワナマルシェ",
  eventDate: "2026年11月29日（日）",
  eventPlace: "松本クラシック館",
  storageKey: "marche-stamp-v1",
  // 特典のしきい値。count 個集めたら受け取れる。
  rewards: [
    { count: 5, label: "達成賞", note: "受付でこの画面をお見せください" },
    { count: 13, label: "コンプリート賞", note: "全ブース満願。受付でこの画面をお見せください" },
  ],
  staffPinHash: "97ee1e2765542",
  booths: [
    { id: "b01", shop: "CHOCOLATE HAPPY", owner: "石原恵美", menu: "数秘術で見るあなたに合う働き方", emoji: "🍫", color: "#8a4b2a", hash: "1e5090e34e6be8" },
    { id: "b02", shop: "salon ありの恵", owner: "青柳栄美", menu: "全身から脳まで洗う?! 水素吸入体験", emoji: "💧", color: "#2f7fb5", hash: "18fa06a2197e8f" },
    { id: "b03", shop: "ポートレート安曇野+", owner: "青柳貴大", menu: "写真・作品展示", emoji: "📷", color: "#4a5a6a", hash: "4e28b89499c6c" },
    { id: "b04", shop: "やさしい珈琲の店 3月9日", owner: "ほしのしほ", menu: "あなたの近未来を読み解く タロット占い", emoji: "☕", color: "#6b4a2f", hash: "2f09ff78d729" },
    { id: "b05", shop: "運命の待ち合わせ場所 心彩 -koiro-", owner: "刈田瑛子", menu: "カラーセラピー／西洋占星術／オラクルカードセッション", emoji: "🌈", color: "#b0467a", hash: "19cf30b0db697c" },
    { id: "b06", shop: "facial&body freasy（フリージー）", owner: "浅川弥生", menu: "美姿勢ストレッチ整体", emoji: "🧘", color: "#c0392b", hash: "1a2f259d3f16b9" },
    { id: "b07", shop: "KAZAN", owner: "中野たかまさ", menu: "色占い／エネルギー波動測定", emoji: "🔮", color: "#6a3fa0", hash: "8395bf212ecf5" },
    { id: "b08", shop: "メナードフェイシャルサロン 松本惣社", owner: "細谷 文", menu: "AIでお肌診断", emoji: "✨", color: "#b8860b", hash: "12ee52a2196f8e" },
    { id: "b09", shop: "陰陽師", owner: "丸山優子", menu: "開運プチセッション", emoji: "⛩️", color: "#2e7d4f", hash: "16319ff10d5f0f" },
    { id: "b10", shop: "リラクゼーションサロン シュシュ", owner: "諏訪まゆみ", menu: "足裏で あなたの健康状態丸分かり！", emoji: "🦶", color: "#c46a2b", hash: "198dfd4e87feaf" },
    { id: "b11", shop: "だいだい", owner: "中村大地", menu: "オリジナルゲーム体験", emoji: "🎲", color: "#e07b00", hash: "1ccfdd02eb8f17" },
    { id: "b12", shop: "glitter balloons", owner: "吉田嘉名", menu: "絵画のような家族写真／写真を雑誌風につくろう！", emoji: "🎈", color: "#d14b8f", hash: "17279481029822" },
    { id: "b13", shop: "ドラマワークファシリテーター 対話クリエイター", owner: "なかざわ りえ", menu: "想像力全開★ 観る・聴く・感じる・表す ― 遊びながら磨くドラマワーク体験", emoji: "🎭", color: "#1f6f8b", hash: "117e3c62379e46" },
  ],
};
