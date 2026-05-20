import { parseMSE, exportMSE } from './src/core/mseParser.ts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const analyzeDir = path.join(__dirname, 'public', 'analyze-mse');

const files = fs.readdirSync(analyzeDir).filter(f => f.endsWith('.mse'));
const results = { passed: 0, failed: 0, errors: [] };

console.log(`\n🧪 MSE Parser Test Runner`);
console.log(`==========================\n`);
console.log(`Found ${files.length} .mse files to test\n`);

for (const file of files) {
  const filePath = path.join(analyzeDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  try {
    const ast = parseMSE(content);
    const exported = exportMSE(ast);
    
    if (ast.diagnostics.length > 0) {
      results.failed++;
      results.errors.push({ file, errors: ast.diagnostics });
      console.log(`❌ ${file}: ${ast.diagnostics.length} diagnostic(s)`);
    } else {
      results.passed++;
      console.log(`✅ ${file} (${ast.groups.length} groups, ${ast.dependencies.length} deps)`);
    }
  } catch (err) {
    results.failed++;
    results.errors.push({ file, errors: [err.message] });
    console.log(`❌ ${file}: ${err.message}`);
  }
}

console.log(`\n==========================`);
console.log(`Results: ${results.passed} passed, ${results.failed} failed\n`);

if (results.failed > 0) {
  console.log('Failed files:');
  results.errors.forEach(e => {
    console.log(`  - ${e.file}: ${e.errors.slice(0, 2).join(', ')}`);
  });
}