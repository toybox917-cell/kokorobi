// build.mjs - UTF8 Safe版
import { writeFileSync, existsSync, readFileSync } from "node:fs";

(async () => {
  try {
    console.log("[kokorobi] build start");

    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>心灯 | 宙のリズム占い</title>
</head>
<body>
<h1>🪷 心灯 | 宙のリズム占い</h1>
<p>このページはビルド成功テスト版です。</p>
<p>動作確認が取れたら、完全版HTMLを差し替えます。</p>
</body>
</html>`;

    writeFileSync("index.html", html, "utf8");
    console.log("[kokorobi] ✅ build complete");

  } catch (err) {
    console.error("[kokorobi] ❌ build failed:", err);
    process.exit(1);
  }
})();
