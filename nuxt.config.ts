// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@element-plus/nuxt'],
  elementPlus: {
    importStyle: false, // 停用自動注入，改由 main.css 統一控管
  },
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/png', href: '/images/page-link-icon.png' },
      ],
    },
  },
  css: [
    '~/assets/css/main.css',
    'leaflet/dist/leaflet.css',
    'cropperjs/dist/cropper.css',
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  runtimeConfig: {
    // Server only → NUXT_SUPABASE_SECRET_KEY
    supabaseSecretKey: '',
    // Server only → NUXT_GROQ_API_KEY
    groqApiKey: '',
    public: {
      // Client + Server → NUXT_PUBLIC_SUPABASE_URL / NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
      supabaseUrl: '',
      supabasePublishableKey: '',
    }
  }
})
