// build.mjs — 「今日の灯」＋「宙の天気」をGistから取得して埋め込む自動ビルド版
import { writeFileSync } from "node:fs";

// ====== 設定（あなたのGistを指定）======
const GIST = {
  daily: "https://gist.githubusercontent.com/toybox917-cell/5cc5efcc825f7cc57f0e7b49ff9dc7c5/raw",
  weather: "https://gist.githubusercontent.com/toybox917-cell/95124527b68524c2b4d551c7cbb5a14b/raw"
};

// ====== ユーティリティ ======
async function fetchText(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${url}`);
  return await res.text();
}
function pad(n){ return String(n).padStart(2,"0"); }
function etoOf(y,m,d){
  const STEMS=["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
  const BR=["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
  const a=Math.floor((14-m)/12); y=y+4800-a; m=m+12*a-3;
  const jdn=d+Math.floor((153*m+2)/5)+365*y+Math.floor(y/4)-Math.floor(y/100)+Math.floor(y/400)-32045;
  return STEMS[(jdn+9)%10] + BR[(jdn+1)%12];
}
function moonEmoji(date){
  const syn=29.530588853, base=new Date(Date.UTC(2000,0,6,18,14));
  const diff=(date-base)/86400000, ph=((diff%syn)+syn)%syn;
  if(ph<1.5)return"🌑"; if(ph<6)return"🌒"; if(ph<8)return"🌓"; if(ph<14)return"🌔";
  if(ph<16)return"🌕"; if(ph<21)return"🌖"; if(ph<23)return"🌗"; return"🌘";
}

// ====== メイン ======
const now = new Date();
const jst = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
const Y=jst.getFullYear(), M=jst.getMonth()+1, D=jst.getDate();
const W=["日","月","火","水","木","金","土"][jst.getDay()];
const eto = etoOf(Y,M,D);
const moon = moonEmoji(new Date(`${Y}-${pad(M)}-${pad(D)}T00:00:00+09:00`));
const seasonColor = (M>=3&&M<=5)?"#b48ef7":(M>=6&&M<=8)?"#33a1ff":(M>=9&&M<=11)?"#cc7a42":"#6a8fbf";

// Gistから「今日の灯」「宙の天気」を取得
let dailyMsg = "", weatherMsg = "";
try { dailyMsg = await fetchText(GIST.daily); } catch(e){ dailyMsg = "（今日の灯は準備中です）"; }
try { weatherMsg = await fetchText(GIST.weather); } catch(e){ weatherMsg = "（宙の天気は準備中です）"; }

// HTML生成
const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>心灯｜宙のリズム占い</title>
<meta name="description" content="理で導き、やさしさで包む——毎日の“宙の天気”とメッセージを配信。">
<link rel="canonical" href="https://kokorobi.vercel.app/">
<meta property="og:type" content="website">
<meta property="og:title" content="心灯｜宙のリズム占い">
<meta property="og:description" content="理で導き、やさしさで包む——毎日の“宙の天気”とメッセージを配信。">
<meta property="og:url" content="https://kokorobi.vercel.app/">
<meta property="og:image" content="https://kokorobi.vercel.app/og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="${seasonColor}">
<style>
:root{--accent:${seasonColor}}
*{box-sizing:border-box}
body{margin:0;background:#0a0a12;color:#eaeaf2;font-family:"Hiragino Sans","Yu Gothic",sans-serif}
header{background:linear-gradient(135deg,#f5eefc,#e7f7ff);color:#222;text-align:center;padding:28px 14px}
header h1{margin:0;font-size:1.6rem}
header p{margin:.35em 0 0}
main{max-width:820px;margin:22px auto;padding:0 16px}
section{background:#12121a;border:1px solid #222;border-radius:12px;padding:16px;margin:16px 0;box-shadow:0 2px 10px rgba(0,0,0,.35)}
h2{margin:.2em 0 .6em;font-size:1.1rem;border-left:6px solid var(--accent);padding-left:.5em}
.daily{white-space:pre-wrap;line-height:1.9}
footer{text-align:center;color:#aaa;font-size:.85rem;margin:28px 0}
</style>
</head>
<body>
<header>
  <h1>心灯｜宙のリズム占い</h1>
  <p>本日：${Y}年${M}月${D}日（${W}）</p>
  <p style="margin:.3em 0 0;color:#444">干支日：${eto}　今夜の月：${moon}</p>
</header>

<main>
  <section>
    <h2>🌕 今日の灯</h2>
    <div class="daily">${dailyMsg.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</div>
  </section>

  <section>
    <h2>🪐 宙の天気（干支×五行）</h2>
    <div class="daily">${weatherMsg.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</div>
  </section>
</main>

<footer>© 心灯 – 宙のリズム占い</footer>
</body></html>`;

writeFileSync("index.html", html, "utf8");
console.log("index.html generated with daily + weather messages.");
