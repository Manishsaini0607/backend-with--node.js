/**
 * ✅ Data Streams — Example 1: stdin, stdout, stderr
 *
 * Every process in Node.js (and Linux) has 3 default streams:
 *   - stdin  → Readable Stream (keyboard → process)
 *   - stdout → Writable Stream (process → monitor/display)
 *   - stderr → Writable Stream (process → monitor/error display)
 *
 * Run: node 1_stdin_stdout_stderr.js
 * Then type something and press Enter. Type "exit" to quit.
 */

// ──────────────────────────────────────────────
// 1️⃣  process.stdout — The Display Part
// ──────────────────────────────────────────────
// console.log() internally uses process.stdout.write()
// These two lines do the exact same thing:

console.log("Hello from console.log!");
process.stdout.write("Hello from process.stdout.write!\n");

// Proof: console uses process.stdout behind the scenes (NodeJS official docs)
// console.log(x) === process.stdout.write(x + '\n')

// ──────────────────────────────────────────────
// 2️⃣  process.stderr — The Error Part
// ──────────────────────────────────────────────
// stderr is a separate writable stream for errors
// It goes to the same terminal, but can be redirected separately

console.error("This goes to stderr via console.error!");
process.stderr.write("This also goes to stderr via process.stderr.write!\n");

// 💡 In terminal you can redirect stderr separately:
//    node 1_stdin_stdout_stderr.js 2> errors.log
//    This sends only stderr output to errors.log, stdout still shows on screen

// ──────────────────────────────────────────────
// 3️⃣  process.stdin — The Typing Part
// ──────────────────────────────────────────────
// stdin is a readable stream — it reads keyboard input

process.stdout.write("\n📝 Type something and press Enter (type 'exit' to quit):\n");

// Set encoding so we get strings instead of Buffer
process.stdin.setEncoding("utf-8");

// Listen for data events on stdin (each Enter press = one 'data' event)
process.stdin.on("data", (input) => {
  const trimmed = input.trim();

  if (trimmed === "exit") {
    process.stdout.write("👋 Goodbye!\n");
    process.exit(0);
  }

  // Echo what user typed — using stdout (not console.log)
  process.stdout.write(`✅ You typed: "${trimmed}"\n`);
  process.stderr.write(`📊 [LOG] Received ${trimmed.length} characters\n`);
});

// When stdin ends (e.g. piped input finishes, or Ctrl+D)
process.stdin.on("end", () => {
  process.stdout.write("📭 stdin stream ended.\n");
});
