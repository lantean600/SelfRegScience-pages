#!/usr/bin/env node
/**
 * PROTOTYPE gate — disallow unlisted style={{ in production src
 */
import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

const ROOT = join(import.meta.dirname, "..", "src");
const ALLOWED_FILES = new Set([
  "components/canvas/nodes/CtdpNode.tsx", // --ctdp-node-size/fill
  "components/ctdp/CtdpCanvasTheme.tsx",
  "components/ctdp/CtdpFloatingMenu.tsx",
  "components/canvas/CanvasContextMenu.tsx",
  "components/ui/Progress.tsx",
  "components/ui/Tree.tsx",
  "components/canvas/edges/RefTargetEdge.tsx",
  "components/canvas/edges/GroupEdge.tsx",
  "components/canvas/edges/StackEdge.tsx",
  "components/canvas/edges/TriggerEdge.tsx",
]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx|ts)$/.test(name)) out.push(p);
  }
  return out;
}

const violations = [];
for (const file of walk(ROOT)) {
  const rel = relative(join(import.meta.dirname, ".."), file).replace(/\\/g, "/");
  if (!rel.startsWith("src/")) continue;
  if (rel.includes("/prototype/")) continue;
  const short = rel.replace(/^src\//, "");
  const content = readFileSync(file, "utf8");
  if (!content.includes("style={{") && !content.includes("style={\n")) continue;
  if (ALLOWED_FILES.has(short)) continue;
  const lines = content.split("\n");
  lines.forEach((line, i) => {
    if (line.includes("style={{") || line.includes("style={ {")) {
      violations.push(`${rel}:${i + 1}`);
    }
  });
}

if (violations.length) {
  console.error("Unlisted inline style={{ found:\n" + violations.join("\n"));
  process.exit(1);
}
console.log("check-no-inline-style: OK");
