// スタンプラリーの設定。ブースを増やすときは booths に1行足し、
// 印刷用/codes.js の CODES にも同じ id でコードを足す（hash は cyrb53("id:コード") で作り直す）。
// 元データ: 出店者提出.xlsx「マルシェ内容」（18ブース）
window.RALLY = {
  eventName: "ノザワナマルシェ",
  eventDate: "2026年11月29日（日）",
  eventPlace: "蔵シック館",
  storageKey: "marche-stamp-v1",
  // 特典のしきい値。count 個集めたら受け取れる。
  rewards: [
    { count: 5, label: "達成賞", note: "受付でこの画面をお見せください" },
    { count: 18, label: "コンプリート賞", note: "全ブース満願。受付でこの画面をお見せください" },
  ],
  staffPinHash: "97ee1e2765542",
  // stamp: 朱印に入れる短い名前（省略時は shop の最後の語）
  booths: [
    { id: "b01", shop: "CHOCOLATE HAPPY", owner: "石原恵実", menu: "数秘術で見るあなたに合う働き方", stamp: "HAPPY", hash: "1e5090e34e6be8" },
    { id: "b02", shop: "salon ありの恵", owner: "青柳栄美", menu: "全身から脳まで洗う⁈ 水素吸入体験", stamp: "ありの恵", hash: "18fa06a2197e8f" },
    { id: "b03", shop: "ポートレート安曇野+", owner: "青柳貴大", menu: "あなたもモデル？決めポージングで撮る映える一枚！／野の花の写真と詩 展示販売", stamp: "安曇野+", hash: "4e28b89499c6c" },
    { id: "b04", shop: "やさしい珈琲の店 3月9日", owner: "ほしのしほ", menu: "あなたの近未来を読み解くタロット占い", stamp: "3月9日", hash: "2f09ff78d729" },
    { id: "b05", shop: "運命の待ち合わせ場所 心彩 -koiro-", owner: "刈田瑛子", menu: "カラーセラピー／西洋占星術／オラクルカードセッション", stamp: "心彩", hash: "19cf30b0db697c" },
    { id: "b06", shop: "facial&body freasy（フリージー）", owner: "浅川弥生", menu: "美姿勢ストレッチ整体", stamp: "freasy", hash: "1a2f259d3f16b9" },
    { id: "b07", shop: "KAZAN", owner: "中野たかまさ", menu: "色占い・エネルギー波動測定", stamp: "KAZAN", hash: "8395bf212ecf5" },
    { id: "b08", shop: "メナードフェイシャルサロン 松本惣社", owner: "細矢文", menu: "AIでお肌分析", stamp: "メナード", hash: "12ee52a2196f8e" },
    { id: "b09", shop: "陰陽師", owner: "丸山優子（イモアライユウコ）", menu: "開運のためのプチセッション", stamp: "陰陽師", hash: "16319ff10d5f0f" },
    { id: "b10", shop: "リラクゼーションサロン シュシュ", owner: "諏訪まゆみ", menu: "たった足裏であなたの健康状態丸分かり！", stamp: "シュシュ", hash: "198dfd4e87feaf" },
    { id: "b11", shop: "だいだい屋", owner: "中村大地", menu: "オリジナルゲーム体験と書籍の販売", stamp: "だいだい屋", hash: "1ccfdd02eb8f17" },
    { id: "b12", shop: "glitter balloons", owner: "吉田嘉名", menu: "写真を雑誌風につくろう！", stamp: "glitter", hash: "17279481029822" },
    { id: "b13", shop: "ドラマワークファシリテーター", owner: "なかざわ りえ", menu: "想像力全開★観る・聴く・感じる・表す ― 遊びながら磨くドラマワーク体験", stamp: "ドラマワーク", hash: "117e3c62379e46" },
    { id: "b14", shop: "ドレス試着会", owner: "宮澤理恵", menu: "ドレス試着会", stamp: "ドレス", hash: "d9cca21a173ec" },
    { id: "b15", shop: "自然栽培米", owner: "田原大輔", menu: "自然栽培米直売！ 北アルプスの水で育てた農薬・肥料不使用のお米", stamp: "自然栽培米", hash: "7cc61b1e211e6" },
    { id: "b16", shop: "メッセージ＆雑貨", owner: "深澤佐夜香", menu: "ココロ軽やか＆笑顔になれる♪ あなたに必要なメッセージ＆雑貨", stamp: "ココロ軽やか", hash: "9845053e8ca35" },
    { id: "b17", shop: "ドライヘッドスパ＆耳ツボ", owner: "栗林喜之江", menu: "ドライヘッドスパ＆耳ツボセラピー", stamp: "ヘッドスパ", hash: "10d96e2853f32e" },
    { id: "b18", shop: "パーソナルカラー体験", owner: "わたなべ芳恵", menu: "パーソナルカラー体験", stamp: "パーソナルカラー", hash: "1d270ae9efaf55" },
  ],
};
