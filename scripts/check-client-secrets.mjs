import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const STATIC_DIR = path.join(ROOT, ".next", "static");
const FORBIDDEN = [
  "PINATA_",
  "ALCHEMY_",
  "NEYNAR_",
  "VITE_",
  "MAINNET_RPC_URL",
  "SEPOLIA_RPC_URL",
  "RPC_URL",
];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) {
    return files;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else {
      files.push(full);
    }
  }
  return files;
}

if (!fs.existsSync(STATIC_DIR)) {
  console.error("Missing .next/static. Run `npm run build` first.");
  process.exit(1);
}

const matches = [];
for (const file of walk(STATIC_DIR)) {
  if (!file.endsWith(".js") && !file.endsWith(".json") && !file.endsWith(".html")) {
    continue;
  }
  const content = fs.readFileSync(file, "utf8");
  for (const needle of FORBIDDEN) {
    if (content.includes(needle)) {
      matches.push({ file, needle });
    }
  }
}

if (matches.length) {
  console.error("Forbidden strings found in client bundle:");
  for (const match of matches) {
    console.error(`- ${match.needle} in ${match.file}`);
  }
  process.exit(2);
}

console.log("Client bundle secret scan passed.");
