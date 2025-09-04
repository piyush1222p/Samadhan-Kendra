import path from "node:path";
import fs from "fs-extra";
import { glob } from "glob";
import minimist from "minimist";
import { load } from "cheerio";

const args = minimist(process.argv.slice(2), {
  string: ["dir", "jsPath"],
  default: { dir: ".", jsPath: "js" }
});

const ROOT = path.resolve(process.cwd(), args.dir);

function endsWithAny(src, names) {
  if (!src) return false;
  const norm = src.replace(/[#?].*$/, "");
  return names.some((n) => norm.endsWith(n));
}

function checkPage(html) {
  const $ = load(html, { decodeEntities: false });

  const scripts = $("script[src]")
    .map((i, el) => ({
      idx: i,
      src: $(el).attr("src") || "",
      type: ($(el).attr("type") || "").toLowerCase()
    }))
    .get();

  const findIdx = (pred) => {
    for (let i = 0; i < scripts.length; i++) if (pred(scripts[i])) return i;
    return -1;
  };

  const configIdx = findIdx((s) => endsWithAny(s.src, ["/config.js", "config.js"]));
  const apiIdx = findIdx((s) => endsWithAny(s.src, ["/js/api.js", "js/api.js", "api.js"]));
  const authIdx = findIdx((s) => endsWithAny(s.src, ["/js/auth-bootstrap.js", "js/auth-bootstrap.js", "auth-bootstrap.js"]));

  const problems = [];
  const notes = [];

  if (configIdx < 0) problems.push("Missing config.js");
  if (apiIdx < 0) problems.push("Missing js/api.js");
  if (authIdx < 0) problems.push("Missing js/auth-bootstrap.js");

  if (configIdx >= 0 && apiIdx >= 0 && configIdx > apiIdx) {
    problems.push("config.js loads AFTER js/api.js (should load before)");
  }
  if (apiIdx >= 0 && scripts[apiIdx].type !== "module") {
    problems.push('js/api.js should have type="module"');
  }
  if (authIdx >= 0 && scripts[authIdx].type !== "module") {
    problems.push('js/auth-bootstrap.js should have type="module"');
  }

  const loginForm = $("#loginForm");
  if (loginForm.length) {
    const hasUserOrEmail = !!($("#username").length || $("#email").length);
    const hasPassword = !!$("#password").length;
    if (!hasUserOrEmail) problems.push("loginForm present but missing #username or #email");
    if (!hasPassword) problems.push("loginForm present but missing #password");
  }

  const registerForm = $("#registerForm");
  if (registerForm.length) {
    const required = ["#firstName", "#lastName", "#email", "#password"];
    const missing = required.filter((sel) => $(sel).length === 0);
    if (missing.length) problems.push(`registerForm missing fields: ${missing.join(", ")}`);
  }

  const dupConfig = scripts.filter((s) => endsWithAny(s.src, ["/config.js", "config.js"])).length > 1;
  const dupApi = scripts.filter((s) => endsWithAny(s.src, ["/js/api.js", "js/api.js", "api.js"])).length > 1;
  const dupAuth = scripts.filter((s) => endsWithAny(s.src, ["/js/auth-bootstrap.js", "js/auth-bootstrap.js", "auth-bootstrap.js"])).length > 1;
  if (dupConfig) notes.push("Multiple config.js tags found");
  if (dupApi) notes.push("Multiple api.js tags found");
  if (dupAuth) notes.push("Multiple auth-bootstrap.js tags found");

  return { problems, notes };
}

async function run() {
  console.log(`Validating HTML pages under: ${ROOT}`);
  const files = await glob("**/*.html", {
    cwd: ROOT,
    nodir: true,
    absolute: true,
    ignore: ["**/node_modules/**", "**/vendor/**", "**/dist/**", "**/build/**"]
  });

  if (!files.length) {
    console.log("No HTML files found.");
    return;
  }

  let okCount = 0;
  let warnCount = 0;

  for (const f of files) {
    const html = await fs.readFile(f, "utf8");
    const { problems, notes } = checkPage(html);
    const rel = path.relative(process.cwd(), f);

    if (problems.length === 0) {
      okCount++;
      if (notes.length) {
        warnCount++;
        console.log(`OK with notes: ${rel}`);
        notes.forEach((n) => console.log(`  note: ${n}`));
      } else {
        console.log(`OK: ${rel}`);
      }
    } else {
      console.log(`ISSUES: ${rel}`);
      problems.forEach((p) => console.log(`  - ${p}`));
      if (notes.length) notes.forEach((n) => console.log(`  note: ${n}`));
    }
  }

  console.log("\nSummary:");
  console.log(`  Total pages: ${files.length}`);
  console.log(`  OK: ${okCount}`);
  console.log(`  With notes: ${warnCount}`);
  console.log(`  With issues: ${files.length - okCount - warnCount}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});