const express = require("express");
const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");

const app = express();
const PORT = 3000;
app.use(express.static("public"));
app.use(express.json());

// ✅ Render対応: tmp/output を自動生成
["tmp", "output"].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
});

app.post("/build", (req, res) => {
  const code = req.body.code;

  // Save input.nojs
  const inputPath = path.join(__dirname, "tmp", "input.nojs");
  fs.writeFileSync(inputPath, code);

  // ✅ Linux対応: 実行パスを動的に解決（.exe ではない）
  const nojsPath = path.resolve(__dirname, "zig-out", "bin", "nojs");
  exec(`${nojsPath} build tmp/input.nojs`, (err, stdout, stderr) => {
    if (err) {
      return res.status(500).send(`Build error:\n${stderr}`);
    }

    const outputDir = path.resolve("output");
    const outputFile = fs
      .readdirSync(outputDir)
      .find((f) => f.endsWith(".html"));

    if (!outputFile) {
      return res.status(500).send("No HTML output generated.");
    }

    const html = fs.readFileSync(path.join(outputDir, outputFile), "utf-8");
    res.send(html);
  });
});

app.listen(PORT, () => {
  console.log(`✨ NO JS Playground running at http://localhost:${PORT}`);
});
