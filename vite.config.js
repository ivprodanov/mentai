import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(),VitePWA({
      registerType: 'autoUpdate', // Automatically updates the app when you push new code
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'audio/*.mp3', 'audio/*.wav'], // Cache your audio files!
      manifest: {
        name: 'TydalWave Binaural Beats',
        short_name: 'TydalWave',
        description: 'Binaural beats and ambient environments for deep focus, relaxation, and sleep.',
        theme_color: '#030712', // Matches Tailwind's gray-950
        background_color: '#030712',
        display: 'standalone', // This hides the browser address bar
        orientation: 'portrait',
        icons: [
          {
            src: 'icon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' // Recommended for Android icons
          }
        ]
      }
    })],
})
