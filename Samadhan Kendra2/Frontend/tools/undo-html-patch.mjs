import path from "node:path";
import fs from "fs-extra";
import { glob } from "glob";
import minimist from "minimist";

const args = minimist(process.argv.slice(2), { string: ["dir"], default: { dir: "." } });
const ROOT = path.resolve(process.cwd(), args.dir);

async function run() {
  const files = await glob("**/*.html.bak", {
    cwd: ROOT,
    nodir: true,
    absolute: true,
    ignore: ["**/node_modules/**", "**/vendor/**", "**/dist/**", "**/build/**"]
  });
  if (!files.length) {
    console.log("No *.html.bak backups found to restore.");
    return;
  }
  for (const bak of files) {
    const htmlFile = bak.slice(0, -4);
    await fs.copyFile(bak, htmlFile);
    console.log(`Restored: ${path.relative(process.cwd(), htmlFile)} (from .bak)`);
  }
  console.log("Restore complete.");
}
run().catch((e) => {
  console.error(e);
  process.exit(1);
});