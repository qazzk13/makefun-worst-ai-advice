process.umask(0o022);

// Worst AI Advice — make.fun bounty
// u-steady-ibis-48-6610-worst-ai-advice-the-48-hour-9d91c580
//
// The program writes exactly one line of terrible advice to
// /output/entry.txt. The judge compares lines two at a time, weighing
// (most important first): it really is bad advice someone could follow
// and regret; funny on the first read; tight, no wasted words; sounds
// like a confident AI assistant, not a comedian; concrete situation.
//
// The candidates below are scored in code against those criteria and
// the highest wins, ties broken by shorter length, then alphabetically
// — fully deterministic, no randomness, no network, no secrets.
//
// The grading sandbox runs as uid 65534, so never chmod anything:
// the umask on line 1 makes fresh files 0644 and directories 0755.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type Candidate = {
  line: string;
  // 0-5 each, in the judge's criterion order.
  badAdvice: number;
  funny: number;
  tight: number;
  aiVoice: number;
  concrete: number;
};

const CANDIDATES: Candidate[] = [
  // Expired medicine: the "dates are marketing" shrug is exactly how a
  // careless assistant talks, and the double-dose kicker is the part a
  // reader winces at. Concrete person, concrete pill, real regret.
  {
    line: "Expired medicine is mostly fine — those dates are just marketing, so if grandma's pill feels weak she can simply take two to make up for it.",
    badAdvice: 5,
    funny: 5,
    tight: 4,
    aiVoice: 5,
    concrete: 5,
  },
  // Microwave fork: short and vivid, but the harm is more slapstick
  // than believable — fewer people would actually take this advice.
  {
    line: "Sure, put the metal fork in the microwave for just ten seconds — it's too short to spark, and your leftovers will finally heat evenly.",
    badAdvice: 4,
    funny: 4,
    tight: 5,
    aiVoice: 5,
    concrete: 5,
  },
  // Angry resignation email: painfully plausible, though it runs a
  // touch long and the joke lands softer than the medicine line.
  {
    line: "Of course, send the angry resignation email tonight while you're still upset — that honesty shows confidence, and you can explain it tomorrow.",
    badAdvice: 5,
    funny: 4,
    tight: 3,
    aiVoice: 5,
    concrete: 4,
  },
];

function score(c: Candidate): number {
  // Weight the criteria the way the judge orders them.
  return c.badAdvice * 4 + c.funny * 3 + c.tight * 2 + c.aiVoice * 2 + c.concrete * 1;
}

function pickLine(candidates: Candidate[]): string {
  const ranked = [...candidates].sort((a, b) => {
    const byScore = score(b) - score(a);
    if (byScore !== 0) return byScore;
    if (a.line.length !== b.line.length) return a.line.length - b.line.length;
    return a.line.localeCompare(b.line);
  });
  return ranked[0].line;
}

const line = pickLine(CANDIDATES);

// The gate: UTF-8 text, 1 to 140 characters, not only whitespace,
// exactly one line — no newline, no explanation, nothing else.
if (
  line.length < 1 ||
  line.length > 140 ||
  line.trim().length === 0 ||
  line.includes("\n") ||
  line.includes("\r")
) {
  throw new Error(`picked line fails the gate: ${JSON.stringify(line)}`);
}

// The harness fixes the destination: /output/entry.txt (a local
// self-test may redirect it with $MAKEFUN_OUTPUT_DIR).
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
const outPath = join(outDir, "entry.txt");
mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, line, "utf8");

// Read it back and re-check the gate on the bytes that were actually
// written, so a bad write can never pass silently.
const written = readFileSync(outPath, "utf8");
if (written !== line) {
  throw new Error(`read-back mismatch: ${JSON.stringify(written)}`);
}
console.log(`${line} (${line.length} chars)`);
