import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub project Pages serves this repository below `/Fun-Work/`; local
// development and ordinary builds stay rooted at `/`.
const base = process.env.VITE_BASE_PATH ?? '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  server: {
    // Vite otherwise always takes 5173, which collides when another dev server
    // is already holding it. Honouring PORT lets a launcher assign a free one.
    ...(process.env.PORT ? { port: Number(process.env.PORT) } : {}),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      workbox: {
        // Battle artwork lives in public/assets and must remain available when
        // the installed PWA is offline.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
      },
      manifest: {
        name: 'Fun-Work',
        short_name: 'Fun-Work',
        description: 'Gamified habit and activity tracker',
        theme_color: '#241e49',
        background_color: '#17142d',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
