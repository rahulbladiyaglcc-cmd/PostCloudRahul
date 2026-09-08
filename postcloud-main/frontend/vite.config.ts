import { fileURLToPath, URL } from 'node:url'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

import { defineConfig, type PluginOption } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import vuetify from 'vite-plugin-vuetify'

function pdfParserPlugin(): PluginOption {
  return {
    name: 'pdf-parser-middleware',
    configureServer(server) {
      server.middlewares.use('/api/parse-pdf', (req, res, next) => {
        if (req.method !== 'POST') {
          return next()
        }

        const chunks: Buffer[] = []
        req.on('data', (chunk) => chunks.push(chunk))
        req.on('end', () => {
          try {
            const buffer = Buffer.concat(chunks)
            const baseDir = fileURLToPath(new URL('.', import.meta.url))
            const tempDir = path.resolve(baseDir, 'scripts', 'temp')
            fs.mkdirSync(tempDir, { recursive: true })
            const tempPdfPath = path.join(tempDir, `upload_${Date.now()}.pdf`)
            fs.writeFileSync(tempPdfPath, buffer)

            const scriptPath = path.resolve(baseDir, 'scripts', 'parse_electoral_roll.py')
            const py = spawn('python', [scriptPath, tempPdfPath])

            let stdout = ''
            let stderr = ''
            py.stdout.on('data', (d) => { stdout += d.toString() })
            py.stderr.on('data', (d) => { stderr += d.toString() })

            py.on('close', (code) => {
              try { fs.unlinkSync(tempPdfPath) } catch {}
              if (code === 0 && stdout.trim()) {
                res.setHeader('Content-Type', 'application/json; charset=utf-8')
                res.end(stdout)
              } else {
                console.error('Python PDF extraction failed:', stderr)
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: stderr || 'Failed to extract voters from PDF' }))
              }
            })
          } catch (err: any) {
            console.error('Parse PDF route error:', err)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: err.message }))
          }
        })
      })
    }
  }
}

const plugins: PluginOption[] = [
  vue({
    template: {
      compilerOptions: {
        isCustomElement: (tag) => ['v-list-recognize-title'].includes(tag)
      }
    }
  }),
  vuetify({
    autoImport: true
  }),
  pdfParserPlugin()
]

if (process.env.NODE_ENV !== 'production') {
  plugins.push(vueDevTools())
}

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: ['posta-cloud.onrender.com']
  },
  plugins,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  css: {
    preprocessorOptions: {
      scss: {}
    }
  },
  build: {
    chunkSizeWarningLimit: 1024 * 1024 // Set the limit to 1 MB
  },
  optimizeDeps: {
    exclude: ['vuetify'],
    entries: ['./src/**/*.vue']
  }
})
