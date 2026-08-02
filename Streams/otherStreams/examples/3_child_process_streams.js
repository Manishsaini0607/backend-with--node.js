/**
 * ✅ Data Streams — Example 3: child_process Streams
 *
 * From the notes:
 * "using child_process net module in NodeJS we can run process in other process
 *  and import the process stdout and bring to our main NodeJS application
 *  and play with it"
 *
 * When you spawn a child process, it gives you access to:
 *   - child.stdin  → Writable (send data TO the child)
 *   - child.stdout → Readable (read data FROM the child)
 *   - child.stderr → Readable (read errors FROM the child)
 *
 * Run: node 3_child_process_streams.js
 */

import { spawn } from "child_process";

// ──────────────────────────────────────────────
// 1️⃣  Spawn a child process and read its stdout
// ──────────────────────────────────────────────
// Running "ls -la" as a child process and capturing its output

console.log("═══════════════════════════════════════");
console.log("📂 Example 1: Reading child's stdout");
console.log("═══════════════════════════════════════\n");

const lsProcess = spawn("ls", ["-la", "."]);

// child.stdout is a Readable Stream — we can listen to 'data' events
lsProcess.stdout.setEncoding("utf-8");
lsProcess.stdout.on("data", (chunk) => {
  console.log("📤 Child stdout:\n", chunk);
});

// child.stderr is also a Readable Stream
lsProcess.stderr.setEncoding("utf-8");
lsProcess.stderr.on("data", (chunk) => {
  console.error("❌ Child stderr:", chunk);
});

lsProcess.on("close", (code) => {
  console.log(`✅ ls process exited with code: ${code}\n`);

  // After first example finishes, run the next ones
  runExample2();
});

// ──────────────────────────────────────────────
// 2️⃣  Write to child's stdin
// ──────────────────────────────────────────────
function runExample2() {
  console.log("═══════════════════════════════════════");
  console.log("✍️  Example 2: Writing to child's stdin");
  console.log("═══════════════════════════════════════\n");

  // "grep" reads from stdin and filters lines
  const grepProcess = spawn("grep", ["hello"]);

  grepProcess.stdout.setEncoding("utf-8");
  grepProcess.stdout.on("data", (output) => {
    console.log("🔍 grep matched:", output.trim());
  });

  // Write data TO the child process via its stdin (Writable Stream)
  grepProcess.stdin.write("hello world\n");
  grepProcess.stdin.write("goodbye world\n");
  grepProcess.stdin.write("hello again\n");
  grepProcess.stdin.write("see you later\n");
  grepProcess.stdin.end(); // Signal we're done writing

  grepProcess.on("close", () => {
    console.log("✅ grep process finished\n");
    runExample3();
  });
}

// ──────────────────────────────────────────────
// 3️⃣  Connecting two processes via streams (piping)
// ──────────────────────────────────────────────
function runExample3() {
  console.log("═══════════════════════════════════════");
  console.log("🔗 Example 3: Pipe two processes together");
  console.log("═══════════════════════════════════════\n");

  // This is like running: echo -e "apple\nbanana\napricot" | grep "ap"
  // Process 1 output → Process 2 input

  const echoProcess = spawn("echo", ["-e", "apple\\nbanana\\napricot\\ncherry\\napple pie"]);
  const grepProcess = spawn("grep", ["ap"]);

  // Pipe: echoProcess.stdout (Readable) → grepProcess.stdin (Writable)
  echoProcess.stdout.pipe(grepProcess.stdin);

  grepProcess.stdout.setEncoding("utf-8");
  grepProcess.stdout.on("data", (data) => {
    console.log("🔗 Piped result (lines containing 'ap'):");
    data.trim().split("\n").forEach((line) => {
      console.log(`   → ${line}`);
    });
  });

  grepProcess.on("close", () => {
    console.log("\n✅ Both processes finished!");
    console.log("\n💡 This is how we connect any two processes");
    console.log("   and do data sharing using streams!\n");
  });
}
