import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// Libraries change far less often than the app code, so each group gets its
// own file: after a deploy, browsers keep the cached libraries and only
// download the (smaller) app chunk again.
const vendorChunks = {
  react: ['react', 'react-dom', 'react-router', 'scheduler'],
  gsap: ['gsap', '@gsap/react'],
  motion: ['framer-motion', 'motion-dom', 'motion-utils'],
  axios: ['axios'],
}

function vendorChunk(id) {
  const match = id.match(/node_modules\/((?:@[^/]+\/)?[^/]+)/)
  if (!match) return undefined
  return Object.keys(vendorChunks).find((chunk) => vendorChunks[chunk].includes(match[1]))
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: vendorChunk,
      },
    },
  },
})
