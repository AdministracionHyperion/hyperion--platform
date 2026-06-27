import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const vitestArgs = [
  "exec",
  "vitest",
  "run",
  "modules/products/cedco/d02-calls/src/evals",
  "apps/evals/src",
];

const command = process.platform === "win32" ? "cmd.exe" : "pnpm";
const commandArgs =
  process.platform === "win32" ? ["/d", "/s", "/c", ["pnpm", ...vitestArgs].join(" ")] : vitestArgs;
const result = spawnSync(command, commandArgs, {
  stdio: "inherit",
});

if (result.status === 0) {
  if (args.includes("--json")) {
    console.log('{"suiteName":"CEDCO D02 Full Deterministic Eval Suite","status":"pass"}');
  } else if (args.includes("--report")) {
    console.log("# CEDCO D02 Full Deterministic Eval Suite\n\nStatus: pass");
  } else {
    console.log("CEDCO D02 deterministic eval suite passed.");
  }
}

process.exitCode = result.status ?? 1;
