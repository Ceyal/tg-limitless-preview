import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const indexPath = path.join(root, 'daily-driver.html');
const html = fs.readFileSync(indexPath, 'utf8');

const refs = new Set();
for (const m of html.matchAll(/(?:href|src)=["'](\.\/[^"']+)["']/g)) refs.add(m[1]);
for (const m of html.matchAll(/from ["'](\.\/[^"']+)["']/g)) refs.add(m[1]);

const missing = [];
for (const ref of refs) {
  if (ref.startsWith('./')) {
    const p = path.normalize(path.join(root, ref.slice(2)));
    if (!fs.existsSync(p)) missing.push(ref);
  }
}

const out = { checked: refs.size, missing, ok: missing.length === 0 };
const outPath = path.join(root, 'qa-artifacts', 'link-check.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
process.exit(missing.length ? 1 : 0);
