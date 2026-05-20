import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { pluginManager, ArchiveExportPlugin, EffExportPlugin, MdeExportPlugin, MseExportPlugin, JsonExportPlugin, JsonImportPlugin } from './plugins'

pluginManager.register(ArchiveExportPlugin);
pluginManager.register(EffExportPlugin);
pluginManager.register(MdeExportPlugin);
pluginManager.register(MseExportPlugin);
pluginManager.register(JsonExportPlugin);
pluginManager.register(JsonImportPlugin);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
