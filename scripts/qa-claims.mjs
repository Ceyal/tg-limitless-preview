import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

/** Positive forbidden claims only — negated truth-boundary lines are allowed. */
const RULES = [
  { id: 'production_ready', re: /\bproduction\s+ready\b/i, allow: [/not\s+production/i, /\*\*Forbidden:\*\*/i] },
  { id: 'perfect_claim', re: /\bperfect\b/i, allow: [/not\s+perfect/i, /\*\*Forbidden:\*\*/i] },
  { id: '2027_achieved', re: /\b2027\s+achieved\b/i, allow: [/not\s+2027/i, /\*\*Forbidden:\*\*/i] },
  { id: '2033_achieved', re: /\b2033\s+achieved\b/i, allow: [/not\s+2033/i, /not\s+2027\/2033/i, /\*\*Forbidden:\*\*/i] },
  { id: 'safari_green', re: /Safari\/iOS\s+GREEN/i, allow: [/not\s+Safari/i, /no\s+Safari/i, /\*\*Forbidden:\*\*/i] },
  { id: 'at_green', re: /\bAT\s+GREEN\b/i, allow: [/not\s+AT\s+GREEN/i, /no\s+AT\s+GREEN/i, /\*\*Forbidden:\*\*/i] },
  { id: 'wav_green', re: /product\s+WAV\s+GREEN/i, allow: [/not\s+product\s+WAV/i, /\*\*Forbidden:\*\*/i] },
  { id: 'aw_live', re: /AudioWorklet\s+product-live/i, allow: [/not\s+AudioWorklet/i, /\*\*Forbidden:\*\*/i] },
  { id: 'opfs_default', re: /OPFS\s+default-on/i, allow: [/\*\*Forbidden:\*\*/i] },
  { id: 'silent_sw', re: /silent\s+Service\s+Worker/i, allow: [/no\s+silent/i, /not\s+silent/i, /\*\*Forbidden:\*\*/i] },
  {
    id: 'medical_claim',
    re: /\b(healing|therapy|entrainment)\b/i,
    allow: [
      /no\s+medical/i,
      /not\s+medical/i,
      /no\s+healing/i,
      /no\s+therapy/i,
      /no\s+entrainment/i,
      /not\s+a\s+medical/i,
      /not\s+a\s+therapeutic/i,
      /not:\s*'/i,
      /\*\*Forbidden:\*\*/i,
    ],
  },
];

const SCAN = ['index.html', 'daily-driver.html', 'tech-diagnostics.html', 'preview', 'README.md'];

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (/\.(html|js|css|md)$/.test(ent.name)) acc.push(p);
  }
  return acc;
}

const hits = [];
for (const g of SCAN) {
  const p = path.join(root, g);
  if (!fs.existsSync(p)) continue;
  const files = fs.statSync(p).isDirectory() ? walk(p) : [p];
  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, i) => {
      for (const rule of RULES) {
        if (!rule.re.test(line)) continue;
        if (rule.allow.some((a) => a.test(line))) continue;
        hits.push({ file: path.relative(root, file), line: i + 1, rule: rule.id, text: line.trim().slice(0, 120) });
      }
    });
  }
}

const out = { forbiddenHits: hits, ok: hits.length === 0 };
const outPath = path.join(root, 'qa-artifacts', 'claims-check.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
process.exit(hits.length ? 1 : 0);
