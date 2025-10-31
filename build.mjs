// build.mjs — 最小の動作確認版（毎日自動で index.html を生成）
import { writeFileSync } from "node:fs";
const now = new Date();
const jst = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
const y=jst.getFullYear(), m=jst.getMonth()+1, d=jst.getDate();
const html = `<!DOCTYPE html><meta charset="utf-8"><title>心灯｜自動ビルド成功</title>
<body style="font-family:sans-serif;padding:24px">
<h1>自動ビルド成功！</h1>
<p>JST: ${y}/${String(m).padStart(2,"0")}/${String(d).padStart(2,"0")} ${jst.toTimeString().slice(0,8)}</p>
</body>`;
writeFileSync("index.html", html, "utf8");
console.log("index.html generated.");
