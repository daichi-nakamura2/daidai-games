// 会場地図（蔵シック館）。元: ノザワナ支部マルシェ.pdf の配置検討用レイアウト。
// 座標は元図面(1400×790)のまま。スタッフ向けメモ（電源・荷物置き等）は載せない。
// kind: tatami 畳 / wood 板 / doma 土間 / room その他 / void 吹抜 / stair 階段 / wc トイレ
// pins: id=ブースid（booths.js）か、special=受付などの目印。label の位置 lp: b(下) l(左) r(右) t(上)
// t: 地図に出す名前（省略時は朱印の名前。狭い所だけ短くする）
window.RALLY_MAP = [
  {
    id: "2-1", name: "2号館 1F", vb: [262, 58, 846, 710],
    rooms: [
      { x: 290, y: 115, w: 305, h: 45, kind: "wood" },
      { x: 345, y: 160, w: 250, h: 245, kind: "tatami", label: "和室1", lx: 470, ly: 300 },
      { x: 345, y: 405, w: 250, h: 275, kind: "tatami", label: "和室2", lx: 470, ly: 470 },
      { x: 290, y: 160, w: 55, h: 520, kind: "room" },
      { x: 290, y: 680, w: 305, h: 45, kind: "wood" },
      { x: 595, y: 285, w: 195, h: 280, kind: "wood", label: "板の間", lx: 692, ly: 330 },
      { x: 600, y: 130, w: 50, h: 155, kind: "stair", label: "2Fへ", lx: 625, ly: 115 },
      { x: 655, y: 150, w: 130, h: 135, kind: "room", label: "事務室", lx: 720, ly: 222 },
      { x: 600, y: 565, w: 235, h: 180, kind: "wc", label: "トイレ", lx: 745, ly: 660 },
      { x: 790, y: 160, w: 270, h: 560, kind: "doma", label: "土間", lx: 900, ly: 705 },
    ],
    marks: [{ x: 930, y: 125, text: "入口", kind: "entry" }],
    pins: [
      { id: "b16", x: 380, y: 215, t: "深澤" },
      { id: "b18", x: 545, y: 215, t: "わたなべ" },
      { id: "b01", x: 380, y: 365 },
      { id: "b08", x: 545, y: 380, lp: "r" },
      { id: "b05", x: 380, y: 545 },
      { id: "b09", x: 545, y: 560, lp: "r" },
      { id: "b04", x: 462, y: 640, lp: "r" },
      { special: "受付・景品", x: 1000, y: 250, lp: "l" },
      { id: "b11", x: 1012, y: 395, lp: "l" },
      { id: "b07", x: 1012, y: 515, lp: "l" },
      { id: "b15", x: 1012, y: 635, lp: "l" },
    ],
  },
  {
    id: "2-2", name: "2号館 2F", vb: [400, 130, 590, 580],
    rooms: [
      { x: 425, y: 160, w: 185, h: 130, kind: "room" },
      { x: 610, y: 160, w: 45, h: 130, kind: "stair", label: "1Fへ", lx: 632, ly: 148 },
      { x: 655, y: 155, w: 310, h: 135, kind: "wood", label: "展示室1", lx: 810, ly: 178 },
      { x: 425, y: 290, w: 255, h: 300, kind: "wood", label: "展示室2", lx: 552, ly: 330 },
      { x: 680, y: 290, w: 285, h: 400, kind: "void", label: "吹抜", lx: 822, ly: 500 },
      { x: 640, y: 590, w: 40, h: 60, kind: "stair" },
    ],
    marks: [],
    pins: [
      { id: "b02", x: 690, y: 238 },
      { id: "b03", x: 780, y: 238 },
      { id: "b14", x: 900, y: 238 },
      { id: "b12", x: 552, y: 450 },
    ],
  },
  {
    id: "3-1", name: "3号館 1F", vb: [140, 280, 880, 420],
    rooms: [
      { x: 170, y: 300, w: 820, h: 65, kind: "room", label: "廊下", lx: 580, ly: 340 },
      { x: 170, y: 365, w: 230, h: 250, kind: "tatami", label: "和室3", lx: 285, ly: 400 },
      { x: 400, y: 365, w: 280, h: 250, kind: "tatami", label: "和室4", lx: 540, ly: 400 },
      { x: 680, y: 365, w: 315, h: 240, kind: "wood", label: "会議室1", lx: 837, ly: 400 },
      { x: 795, y: 605, w: 200, h: 75, kind: "stair", label: "2Fへ", lx: 895, ly: 650 },
    ],
    marks: [],
    pins: [
      { id: "b10", x: 285, y: 500 },
      { id: "b17", x: 540, y: 500 },
      { id: "b06", x: 837, y: 500 },
    ],
  },
  {
    id: "3-2", name: "3号館 2F", vb: [125, 275, 1100, 405],
    rooms: [
      { x: 145, y: 295, w: 1055, h: 365, kind: "wood", label: "会議室2", lx: 520, ly: 345 },
      { x: 925, y: 585, w: 145, h: 75, kind: "stair", label: "1Fへ", lx: 997, ly: 570 },
    ],
    marks: [],
    pins: [{ id: "b13", x: 520, y: 470 }],
  },
];
