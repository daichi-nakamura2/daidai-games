// qr-sheet.html を A4 の印刷用PDFにする: node make-pdf.mjs
// （Chrome を DevTools Protocol で操作。出力は QRポスター_印刷用.pdf ＝合言葉入りなので git には載せない）
import { spawn } from "node:child_process";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", "--remote-debugging-port=9335", `--user-data-dir=${mkdtempSync(join(tmpdir(), "qrpdf-"))}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let t; for (let i = 0; i < 50 && !t; i++) { try { t = (await (await fetch("http://127.0.0.1:9335/json")).json()).find((x) => x.type === "page"); } catch {} await sleep(200); }
const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
let id = 0; const P = new Map(); ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && P.has(d.id)) { P.get(d.id)(d); P.delete(d.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; P.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send("Page.enable"); await send("Page.navigate", { url: "file://" + join(here, "qr-sheet.html") }); await sleep(2500);
await send("Runtime.evaluate", { expression: "document.fonts.ready", awaitPromise: true });
const n = (await send("Runtime.evaluate", { expression: "document.querySelectorAll('.poster svg').length", returnByValue: true })).result.result.value;
const pdf = await send("Page.printToPDF", { printBackground: true, paperWidth: 8.27, paperHeight: 11.69, marginTop: 0.31, marginBottom: 0.31, marginLeft: 0.31, marginRight: 0.31 });
writeFileSync(join(here, "QRポスター_印刷用.pdf"), Buffer.from(pdf.result.data, "base64"));
console.log(`QR ${n}個 → QRポスター_印刷用.pdf`);
ws.close(); chrome.kill(); process.exit(0);
