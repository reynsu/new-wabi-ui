/**
 * Push the built registry to wherever `registry.json` says it lives.
 *
 * `shadcn build` writes `public/r/`, and `public/r/` is gitignored: it's
 * output, and it gets regenerated from `registry.json`. But the URL consumers
 * install from —the `homepage` of `registry.json`— is a *different* repo
 * serving those files over GitHub Pages, so a component isn't installable
 * until somebody copies the build over there. This is that somebody.
 *
 *   npm run publish:registry
 *
 * Three details worth not undoing:
 *
 * - **The target comes from `homepage`.** The publishing repo isn't written
 *   down twice: it's read out of the same field the consumer's URL comes from,
 *   so if the registry ever moves, this follows it instead of pushing the
 *   build to the old place.
 *
 * - **It mirrors, it doesn't merge.** A file that stopped existing in the
 *   build gets deleted over there too. `shadcn build` doesn't clean up after a
 *   renamed item, and a stale `range-calendar.json` sitting on the Pages site
 *   installs a component that isn't in the registry any more.
 *
 * - **It never touches anything but `r/`.** The `.nojekyll` —which is what
 *   makes Pages serve a directory it would otherwise treat as Jekyll input—
 *   and the README of the publishing repo are its own business.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, copyFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BUILD = "public/r";

const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, encoding: "utf8" }).trim();

/** `https://<owner>.github.io/<repo>` → the repo that serves it. */
function targetFrom(homepage) {
  const match = /^https:\/\/([^.]+)\.github\.io\/([^/]+)\/?$/.exec(homepage ?? "");
  if (!match) {
    console.error(
      `registry.json: homepage "${homepage}" isn't a GitHub Pages URL, so there's` +
        ` no way to tell which repo publishes it. Push public/r/ by hand, or point` +
        ` homepage at the Pages site of the repo that serves the registry.`
    );
    process.exit(1);
  }
  return { owner: match[1], repo: match[2] };
}

const registry = JSON.parse(readFileSync("registry.json", "utf8"));
const { owner, repo } = targetFrom(registry.homepage);

const built = readdirSync(BUILD).filter((f) => f.endsWith(".json"));
if (built.length === 0) {
  console.error(`${BUILD}/ is empty — run \`npm run build:registry\` first.`);
  process.exit(1);
}

const clone = mkdtempSync(join(tmpdir(), "wabi-registry-"));
console.log(`Publishing ${built.length} files to ${owner}/${repo}…`);
run("git", ["clone", "--depth", "1", `https://github.com/${owner}/${repo}.git`, clone]);

const target = join(clone, "r");
mkdirSync(target, { recursive: true });

// Mirror: what the build no longer has stops being served.
const stale = readdirSync(target).filter(
  (f) => f.endsWith(".json") && !built.includes(f)
);
for (const file of stale) rmSync(join(target, file));
for (const file of built) copyFileSync(join(BUILD, file), join(target, file));

if (run("git", ["status", "--porcelain"], clone) === "") {
  console.log("Nothing changed — what's published is already the current build.");
  rmSync(clone, { recursive: true, force: true });
  process.exit(0);
}

const changed = run("git", ["status", "--porcelain"], clone).split("\n").length;
const source = run("git", ["log", "-1", "--format=%h %s"]);

run("git", ["add", "r"], clone);
run(
  "git",
  [
    "commit",
    "-m",
    `Publicar el registry: ${changed} archivos`,
    "-m",
    `Salida de \`shadcn build\` en ${owner === "reynsu" ? "new-wabi-ui" : "el repo fuente"}, ` +
      `desde ${source}.` +
      (stale.length ? `\n\nSe fueron: ${stale.join(", ")}.` : ""),
  ],
  clone
);
run("git", ["push"], clone);

const head = run("git", ["log", "-1", "--format=%h"], clone);
rmSync(clone, { recursive: true, force: true });

console.log(`Published ${head} — https://${owner}.github.io/${repo}/r/<item>.json`);
console.log("Pages takes a moment to rebuild.");
