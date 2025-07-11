// nuxt.config.ts
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss'
  ],

  app: {
    head: {
      title: 'Raumbelegungssystem',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Einfaches Raumbelegungssystem mit Neon Database Integration' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css' }
      ]
    }
  },

  // TypeScript-Konfiguration
  typescript: {
    strict: true,
    typeCheck: true
  },

  // Für Netlify optimiert
  nitro: {
    preset: 'netlify'
  },

  // Static Site Generation für bessere Performance
  ssr: false,

  // Runtimeconfig für öffentliche Variablen
  runtimeConfig: {
    public: {
      apiBase: '/.netlify/functions'
    }
  },

  compatibilityDate: '2025-04-28'
})