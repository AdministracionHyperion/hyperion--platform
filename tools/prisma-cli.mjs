import { spawnSync } from "node:child_process";

const [, , command, ...args] = process.argv;

if (!command) {
  console.error("Usage: node tools/prisma-cli.mjs <prisma-command> [...args]");
  process.exitCode = 1;
} else {
  const prismaArgs = ["exec", "prisma", command, ...args];
  const spawnCommand = process.platform === "win32" ? "cmd.exe" : "pnpm";
  const spawnArgs = process.platform === "win32" ? ["/c", "pnpm", ...prismaArgs] : prismaArgs;
  const result = spawnSync(spawnCommand, spawnArgs, {
    env: {
      ...process.env,
      DATABASE_URL:
        process.env.DATABASE_URL ?? "postgresql://placeholder:placeholder@localhost:5432/hyperion",
    },
    stdio: "inherit",
  });

  if (result.error) {
    console.error(result.error.message);
  }

  process.exitCode = result.status ?? 1;
}
