/**
 * ✅ Data Streams — Example 4: console vs process.stdout
 *
 * From the notes:
 * "console uses process.stdout behind the scenes (NodeJS official Docs Says)"
 *
 * This example proves it and shows the differences.
 *
 * Run: node 4_console_vs_stdout.js
 */

import { Console } from "console";

// ──────────────────────────────────────────────
// 1️⃣  console.log === process.stdout.write (almost)
// ──────────────────────────────────────────────

console.log("=== Using console.log ===");
process.stdout.write("=== Using process.stdout.write ===\n");

// Difference: console.log adds \n automatically, stdout.write does NOT
process.stdout.write("This ");
process.stdout.write("is ");
process.stdout.write("on ");
process.stdout.write("one ");
process.stdout.write("line!\n");

// console.log also does string formatting
console.log("Name: %s, Age: %d", "Manish", 25); // %s = string, %d = number
// stdout.write only takes strings or buffers
process.stdout.write("Name: Manish, Age: 25\n");

// ──────────────────────────────────────────────
// 2️⃣  console.error === process.stderr.write
// ──────────────────────────────────────────────

console.log("\n--- Error streams ---");
console.error("Error via console.error");
process.stderr.write("Error via process.stderr.write\n");

// ──────────────────────────────────────────────
// 3️⃣  Creating a custom Console with different streams
// ──────────────────────────────────────────────

console.log("\n--- Custom Console ---");

// You can create a Console that writes to ANY writable stream!
// Here we redirect stdout → stderr (just to demonstrate)
const customConsole = new Console({
  stdout: process.stderr, // "log" will go to stderr
  stderr: process.stderr, // "error" also goes to stderr
});

customConsole.log("This 'log' is actually going to stderr!");

// ──────────────────────────────────────────────
// 4️⃣  Writing to a file using Console + streams
// ──────────────────────────────────────────────

import { createWriteStream } from "fs";

const logFile = createWriteStream("./app.log", { flags: "w" });
const errorFile = createWriteStream("./error.log", { flags: "w" });

const fileLogger = new Console({
  stdout: logFile,
  stderr: errorFile,
});

fileLogger.log("This message goes to app.log file");
fileLogger.log("Timestamp: %s", new Date().toISOString());
fileLogger.error("This error goes to error.log file");

// Clean up
logFile.end();
errorFile.end();

console.log("\n✅ Check app.log and error.log — written via Console + Streams!");
console.log('💡 This proves: console is just a wrapper around stdout/stderr streams');
