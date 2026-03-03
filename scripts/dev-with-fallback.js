#!/usr/bin/env node
const { spawn } = require("child_process");
const net = require("net");

function isPortInUse(port) {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.once("error", () => resolve(true));
    s.once("listening", () => {
      s.close();
      resolve(false);
    });
    s.listen(port, "0.0.0.0");
  });
}

function runDev(port) {
  return new Promise((_, reject) => {
    const child = spawn("npx", ["next", "dev", "-H", "0.0.0.0", "-p", String(port)], {
      stdio: "inherit",
      shell: true,
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0 && code !== null) reject(new Error(`Exit ${code}`));
    });
  });
}

async function main() {
  const port = (await isPortInUse(3000)) ? 3001 : 3000;
  if (port === 3001) console.log("Port 3000 in use, using 3001...\n");
  console.log(`Starting on port ${port}. Open Ports tab → port ${port} → globe icon\n`);
  await runDev(port);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
