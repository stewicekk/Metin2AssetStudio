import { parseMSE, exportMSE, type MSEBlock, type MSEDocument } from '../core/mseParser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const analyzeDir = path.resolve(__dirname, '..', '..', 'fixtures');

const FILES_TO_FUZZ = 100;
const MUTATIONS_PER_FILE = 20;

function cloneNode(node: MSEBlock): MSEBlock {
  return {
    ...node,
    values: node.values ? [...node.values] : undefined,
    children: node.children.map(cloneNode),
  };
}

function collectNumericProps(node: MSEBlock): { node: MSEBlock; parent: MSEBlock }[] {
  const out: { node: MSEBlock; parent: MSEBlock }[] = [];
  function walk(n: MSEBlock, parent: MSEBlock) {
    if (n.type === 'Property' && n.values && n.values.length > 0 && Number.isFinite(parseFloat(n.values[0]))) {
      out.push({ node: n, parent });
    }
    n.children.forEach(c => walk(c, n));
  }
  walk(node, node);
  return out;
}

function countNodes(node: MSEBlock): number {
  let c = 1;
  for (const child of node.children) c += countNodes(child);
  return c;
}

interface FuzzResult {
  file: string;
  ok: boolean;
  detail: string;
}

let results: FuzzResult[] = [];
let totalMutations = 0;

console.log(`\n🧪 MSE Fuzz Test Runner — Parse Stability`);
console.log(`============================================\n`);

const files = fs.readdirSync(analyzeDir)
  .filter((f: string) => f.endsWith('.mse'))
  .sort(() => Math.random() - 0.5)
  .slice(0, FILES_TO_FUZZ);

for (const file of files) {
  const content = fs.readFileSync(path.join(analyzeDir, file), 'utf-8');

  let refCount = 0;
  try {
    const refAst = parseMSE(content);
    if (refAst.diagnostics.length > 0) {
      console.log(`⏭ ${file}: skipped (${refAst.diagnostics.length} diagnostic(s))`);
      continue;
    }
    refCount = countNodes(refAst);
  } catch {
    results.push({ file, ok: false, detail: 'CRASH on initial parse' });
    continue;
  }

  for (let m = 0; m < MUTATIONS_PER_FILE; m++) {
    totalMutations++;

    try {
      const ast = parseMSE(content);
      const props = collectNumericProps(ast);
      if (props.length === 0) continue;

      const { node: prop } = props[Math.floor(Math.random() * props.length)];
      const orig = prop.values![0];
      const origNum = parseFloat(orig);

      const ops = ['zero', 'negate', 'double', 'halve', 'random', 'shift'];
      const op = ops[Math.floor(Math.random() * ops.length)];
      let newVal: number;
      switch (op) {
        case 'zero': newVal = 0; break;
        case 'negate': newVal = -origNum; break;
        case 'double': newVal = origNum * 2; break;
        case 'halve': newVal = origNum / 2; break;
        case 'random': newVal = Math.random() * 2000 - 1000; break;
        case 'shift': newVal = origNum + (Math.random() * 20 - 10); break;
        default: newVal = origNum;
      }
      if (!Number.isFinite(newVal)) newVal = 0;
      prop.values![0] = String(newVal);

      const text = exportMSE(ast);
      const reparsed = parseMSE(text);

      if (reparsed.diagnostics.length > 0) {
        results.push({ file, ok: false, detail: `mutation #${m + 1} on "${prop.name}": ${reparsed.diagnostics.length} diagnostic(s)` });
        continue;
      }

      const reCount = countNodes(reparsed);
      if (Math.abs(reCount - refCount) > 10) {
        results.push({ file, ok: false, detail: `mutation #${m + 1} on "${prop.name}": node count ${refCount} → ${reCount}` });
        continue;
      }

      const reProps = collectNumericProps(reparsed);
      const survived = reProps.some(rp => rp.node.name === prop.name && Math.abs(parseFloat(rp.node.values![0]) - newVal) < 0.001);

      results.push({ file, ok: true, detail: `"${prop.name}": ${orig}→${newVal} ${survived ? '✓' : '↻'}` });
    } catch (err) {
      results.push({ file, ok: false, detail: `mutation #${m}: CRASH - ${err}` });
    }
  }
}

const passed = results.filter(r => r.ok).length;
const failed = results.filter(r => !r.ok).length;

const byFile: Record<string, { ok: number; fail: number }> = {};
results.forEach(r => {
  if (!byFile[r.file]) byFile[r.file] = { ok: 0, fail: 0 };
  byFile[r.file][r.ok ? 'ok' : 'fail']++;
});

Object.entries(byFile).forEach(([file, counts]) => {
  if (counts.fail === 0) {
    console.log(`✅ ${file}: ${counts.ok} mutations OK`);
  } else {
    console.log(`⚠ ${file}: ${counts.ok} OK, ${counts.fail} FAIL`);
  }
});

if (failed > 0) {
  console.log(`\n--- Failed mutations ---`);
  results.filter(r => !r.ok).slice(0, 20).forEach(r => console.log(`  ${r.file}: ${r.detail}`));
  if (results.filter(r => !r.ok).length > 20) {
    console.log(`  ... and ${results.filter(r => !r.ok).length - 20} more`);
  }
}

const survived = results.filter(r => r.ok && r.detail.includes('✓')).length;
const reformatted = results.filter(r => r.ok && r.detail.includes('↻')).length;

console.log(`\n============================================`);
console.log(`Fuzz: ${passed} passed, ${failed} failed (${totalMutations} total)`);
console.log(`Roundtrip values: ${survived} preserved, ${reformatted} reformatted (floating-point rounding)`);
console.log(`============================================\n`);
process.exit(failed > 0 ? 1 : 0);
