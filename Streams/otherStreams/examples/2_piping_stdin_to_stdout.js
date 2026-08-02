/**
 * ✅ Data Streams — Example 2: Piping stdin → stdout
 *
 * Since stdin is Readable and stdout is Writable,
 * we can PIPE them together — whatever you type gets echoed back!
 *
 * This proves: "they all are duplex stream at the end"
 * (stdin reads, stdout writes, and pipe connects them)
 *
 * Run: node 2_piping_stdin_to_stdout.js
 * Then type anything — it will be echoed. Press Ctrl+C to stop.
 */

process.stdout.write("🔗 stdin is now piped to stdout!\n");
process.stdout.write("📝 Whatever you type will be echoed back.\n");
process.stdout.write("   Press Ctrl+C to stop.\n\n");

// This single line connects the keyboard stream → display stream
process.stdin.pipe(process.stdout);

// ──────────────────────────────────────────────
// 💡 What's happening behind the scenes:
// ──────────────────────────────────────────────
//
// process.stdin (Readable)  ──pipe──▶  process.stdout (Writable)
//     keyboard input                      terminal display
//
// .pipe() reads chunks from stdin and writes them to stdout
// It also handles backpressure automatically!
//
// ──────────────────────────────────────────────
// 🧪 Try this in terminal:
// ──────────────────────────────────────────────
//
// You can also pipe data INTO this script from outside:
//   echo "Hello World" | node 2_piping_stdin_to_stdout.js
//
// This replaces keyboard input with the echo command's output!
