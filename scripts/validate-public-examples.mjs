import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const banned = [
  /out_dynamic_1/,
  /docs\.nexalayer\.com/,
  /api\.nexalayer\.com/,
  /https:\/\/nexalayer\.com/,
  /\/Users\//,
  /railway\.internal/,
  /agk_[A-Za-z0-9_-]{12,}/,
  /socks5:\/\/[^@\s]+:[^@\s]+@/,
];

function walk(dir) {
  const entries = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if ([".git", "node_modules", ".venv"].includes(item.name)) continue;
    const full = path.join(dir, item.name);
    if (item.isDirectory()) entries.push(...walk(full));
    else entries.push(full);
  }
  return entries;
}

const files = walk(root).filter((file) =>
  [".md", ".py", ".mjs", ".js", ".json", ".yml", ".yaml", ".example"].some((suffix) =>
    file.endsWith(suffix),
  ) && !file.endsWith(path.join("scripts", "validate-public-examples.mjs")),
);

const problems = [];
for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  for (const pattern of banned) {
    if (pattern.test(text)) problems.push(`${file}: banned pattern ${pattern}`);
  }
}

const exampleDirs = [
  "playwright/basic-session",
  "playwright/telemetry-health",
  "python/quickstart",
  "python/dynamic-session",
  "python/static-session",
  "node/quickstart",
];
for (const dir of exampleDirs) {
  if (!fs.existsSync(path.join(root, dir, ".env.example"))) {
    problems.push(`${dir}: missing .env.example`);
  }
  if (!fs.existsSync(path.join(root, dir, "README.md"))) {
    problems.push(`${dir}: missing README.md`);
  }
}

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`Validated ${files.length} public files.`);
