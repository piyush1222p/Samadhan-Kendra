import path from "node:path";
import fs from "fs-extra";
import { glob } from "glob";
import minimist from "minimist";
import { load } from "cheerio";

const args = minimist(process.argv.slice(2), {
  string: ["dir", "base", "jsPath"],
  boolean: ["dry"],
  default: { dir: ".", base: "http://localhost:4000", jsPath: "js", dry: false }
});

const ROOT = path.resolve(process.cwd(), args.dir);
const JS_ROOT = path.resolve(ROOT, args.jsPath);
const CONFIG_FILE = path.resolve(ROOT, "config.js");
const API_BASE = String(args.base).replace(/\/+$/, "");

function relUrl(fromFile, targetAbs) {
  const fromDir = path.dirname(fromFile);
  const rel = path.relative(fromDir, targetAbs).split(path.sep).join("/");
  return rel.startsWith(".") ? rel : "./" + rel;
}

async function ensureConfig() {
  const content = `window.APP_CONFIG = { API_BASE: "${API_BASE}" };`;
  const exists = await fs.pathExists(CONFIG_FILE);
  if (!exists) {
    await fs.outputFile(CONFIG_FILE, content, "utf8");
    return { created: true, updated: false };
  }
  const current = await fs.readFile(CONFIG_FILE, "utf8");
  if (current.trim() !== content.trim()) {
    await fs.writeFile(CONFIG_FILE, content, "utf8");
    return { created: false, updated: true };
  }
  return { created: false, updated: false };
}

function upsertScript($, selector, attrs, where = "head") {
  const found = $(selector);
  if (found.length) return false;
  const tag = $("<script>");
  Object.entries(attrs).forEach(([k, v]) => tag.attr(k, v));
  if (where === "head") {
    if ($("head").length === 0) $("html").prepend("<head></head>");
    $("head").prepend(tag);
  } else if (where === "body-end") {
    if ($("body").length === 0) $("html").append("<body></body>");
    $("body").append("\n", tag, "\n");
  }
  return true;
}

function reorderForConfigFirst($, configSrc) {
  const head = $("head");
  if (!head.length) return false;
  const scripts = head.find("script[src]");
  const config = scripts.filter((i, el) => $(el).attr("src") === configSrc);
  if (!config.length) return false;
  const firstScript = scripts.first();
  if (firstScript.is(config)) return false;
  head.prepend(config.detach());
  return true;
}

async function patchHtml(file) {
  const html = await fs.readFile(file, "utf8");
  const $ = load(html, { decodeEntities: false });

  const apiJsAbs = path.resolve(JS_ROOT, "api.js");
  const authJsAbs = path.resolve(JS_ROOT, "auth-bootstrap.js");
  const configSrc = relUrl(file, CONFIG_FILE);
  const apiSrc = relUrl(file, apiJsAbs);
  const authSrc = relUrl(file, authJsAbs);

  const addedConfig = upsertScript($, `script[src="${configSrc}"]`, { src: configSrc }, "head");
  const reordered = reorderForConfigFirst($, configSrc);
  const addedApi = upsertScript($, `script[src="${apiSrc}"]`, { type: "module", src: apiSrc }, "body-end");
  const addedAuth = upsertScript($, `script[src="${authSrc}"]`, { type: "module", src: authSrc }, "body-end");

  const changed = addedConfig || reordered || addedApi || addedAuth;
  if (!changed) return { changed: false };

  const bak = file + ".bak";
  if (!(await fs.pathExists(bak))) await fs.writeFile(bak, html, "utf8");
  if (!args.dry) await fs.writeFile(file, $.html(), "utf8");
  return { changed: true, addedConfig, reordered, addedApi, addedAuth };
}

async function run() {
  console.log(`Patching HTML under: ${ROOT}`);
  console.log(`API_BASE: ${API_BASE}`);
  await fs.ensureDir(JS_ROOT);

  const conf = await ensureConfig();
  if (conf.created) console.log(`Created ${path.relative(process.cwd(), CONFIG_FILE)}`);
  if (conf.updated) console.log(`Updated ${path.relative(process.cwd(), CONFIG_FILE)}`);

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

  let touched = 0;
  for (const f of files) {
    const res = await patchHtml(f);
    if (res.changed) {
      touched++;
      console.log(`Patched: ${path.relative(process.cwd(), f)} ${JSON.stringify(res)}`);
    }
  }
  console.log(`Done. Patched ${touched}/${files.length} file(s). Backups saved as *.bak next to originals.`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});