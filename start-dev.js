import { spawn } from "child_process";

console.log("=================================================");
console.log("🚀 Menjalankan Server Backend MySQL & Frontend...");
console.log("=================================================\n");

// 1. Jalankan Backend Express MySQL
const server = spawn("node", ["server/server.js"], {
  stdio: "inherit",
  shell: true,
});

// 2. Jalankan Frontend Vite
const vite = spawn("npx", ["vite"], {
  stdio: "inherit",
  shell: true,
});

// Tangani penutupan (Ctrl + C)
function cleanExit() {
  try { server.kill(); } catch {}
  try { vite.kill(); } catch {}
  process.exit();
}

process.on("SIGINT", cleanExit);
process.on("SIGTERM", cleanExit);
process.on("exit", cleanExit);

