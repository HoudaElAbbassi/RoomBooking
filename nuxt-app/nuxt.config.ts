// Als TypeScript
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
        { name: 'description', content: 'Einfaches Raumbelegungssystem mit MongoDB Integration' }
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

  alias: {
    '~': '/stores',
    '@': '/'
  },

  // Runtimeconfig für Umgebungsvariablen
  runtimeConfig: {
    // Server-seitige Umgebungsvariablen
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
      dbName: process.env.MONGODB_DB || 'VestRoom_volumedish'
    },
    // Öffentliche Variablen (nicht sensible Daten)
    public: {
      apiBase: '/api'
    }
  },

  mongoose: {
    uri: process.env.MONGODB_URI,
    options: {
      directConnection: true,
      serverSelectionTimeoutMS: 500000,
      appName: 'Raumbelegungssystem'
    }
  },

  compatibilityDate: '2025-04-28'
})