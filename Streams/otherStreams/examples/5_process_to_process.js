/**
 * ✅ Data Streams — Example 5: Process-to-Process Communication
 *
 * From the notes:
 * "Help of this we can connect any two process and do data sharing
 *  and build connection"
 *
 * This example runs a child Node.js script, sends data to it via stdin,
 * receives processed results via its stdout, and handles errors via stderr.
 *
 * Run: node 5_process_to_process.js
 */

import { spawn } from "child_process";

// ──────────────────────────────────────────────
// 1️⃣  Spawn a Node.js child process that does some "work"
// ──────────────────────────────────────────────

console.log("🚀 Main Process (PID: %d) starting...\n", process.pid);

// We use -e to pass inline JavaScript to the child node process
const workerCode = `
  process.stdin.setEncoding('utf-8');

  process.stderr.write('[Worker PID: ' + process.pid + '] Ready!\\n');

  process.stdin.on('data', (data) => {
    const input = data.trim();

    // "Transform" the data and send it back via stdout
    const result = {
      original: input,
      uppercase: input.toUpperCase(),
      reversed: input.split('').reverse().join(''),
      length: input.length,
      timestamp: new Date().toISOString()
    };

    // Send processed result back to parent via stdout
    process.stdout.write(JSON.stringify(result) + '\\n');
  });

  process.stdin.on('end', () => {
    process.stderr.write('[Worker] Shutting down.\\n');
  });
`;

const worker = spawn("node", ["-e", workerCode]);

// ──────────────────────────────────────────────
// 2️⃣  Read the worker's stdout (its output/results)
// ──────────────────────────────────────────────

worker.stdout.setEncoding("utf-8");
worker.stdout.on("data", (data) => {
  const lines = data.trim().split("\n");
  lines.forEach((line) => {
    try {
      const result = JSON.parse(line);
      console.log("📥 Result from worker:");
      console.log("   Original : %s", result.original);
      console.log("   Uppercase: %s", result.uppercase);
      console.log("   Reversed : %s", result.reversed);
      console.log("   Length   : %d", result.length);
      console.log("   Time     : %s\n", result.timestamp);
    } catch {
      console.log("📥 Raw output:", line);
    }
  });
});

// ──────────────────────────────────────────────
// 3️⃣  Read the worker's stderr (its logs/errors)
// ──────────────────────────────────────────────

worker.stderr.setEncoding("utf-8");
worker.stderr.on("data", (data) => {
  console.log("📋 Worker log:", data.trim());
});

// ──────────────────────────────────────────────
// 4️⃣  Send data TO the worker via its stdin
// ──────────────────────────────────────────────

const messages = ["Hello Streams", "Node.js is awesome", "Data sharing works"];

// Send messages one by one with a delay
let index = 0;
const interval = setInterval(() => {
  if (index < messages.length) {
    const msg = messages[index];
    console.log("📤 Sending to worker: '%s'", msg);
    worker.stdin.write(msg + "\n");
    index++;
  } else {
    clearInterval(interval);
    worker.stdin.end(); // Done sending — close the child's stdin
  }
}, 1000);

// ──────────────────────────────────────────────
// 5️⃣  Handle worker exit
// ──────────────────────────────────────────────

worker.on("close", (code) => {
  console.log("═══════════════════════════════════════");
  console.log("✅ Worker process exited with code:", code);
  console.log("💡 We successfully:");
  console.log("   → Ran a process inside our process");
  console.log("   → Sent data via child.stdin (Writable)");
  console.log("   → Received results via child.stdout (Readable)");
  console.log("   → Captured logs via child.stderr (Readable)");
  console.log("═══════════════════════════════════════");
});
