import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const isGitHubPages = process.env.GITHUB_PAGES === 'true' || process.env.CF_PAGES === '1';

export default defineConfig({
  base: isGitHubPages ? '/Metin2AssetStudio/' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Metin2 Asset Studio',
        short_name: 'Metin2 Studio',
        description: 'Particle Effect Editor for Metin2',
        theme_color: '#c89b3c',
        background_color: '#04060a',
        display: 'standalone',
        icons: [
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        maximumFileSizeToCacheInBytes: 1024 * 1024,
      },
      devOptions: { enabled: false },
    }),
  ],
})
