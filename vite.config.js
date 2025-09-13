
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // remove this line if not using React

export default defineConfig({
  plugins: [react()],           // remove this line if not using React
  base: '/whereweatherugo/',    // MUST match your repo name
})
