import { parseMSE, exportMSE } from './mseParser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cesta k testovacímu souboru - opravená cesta o úroveň výš
const testFilePath = path.join(__dirname, '../../../fixtures/10kwaesok.mse');

try {
  const content = fs.readFileSync(testFilePath, 'utf-8');
  const data = parseMSE(content);
  const exported = exportMSE(data);

  console.log('--- Validace 1:1 Parseru ---');
  console.log('Parsování úspěšné!');
  console.log('Původní délka:', content.length);
  console.log('Exportovaná délka:', exported.length);

  // Uložíme export pro kontrolu
  fs.writeFileSync(path.join(__dirname, '../../../fixtures/10kwaesok_exported.mse'), exported);
  console.log('Export uložen do: fixtures/10kwaesok_exported.mse');
  
  // Základní porovnání struktur (jednoduchá kontrola obsahu)
  if (data.groups.length > 0) {
    console.log('Počet skupin částic:', data.groups.length);
    console.log('První skupina (Emitter):', data.groups[0].emitterProperty.MaxEmissionCount || 'Neznámý počet');
  }

} catch (err) {
  console.error('Chyba při validaci:', err);
}
