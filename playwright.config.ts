import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e', timeout: 30_000, use: { baseURL: 'http://127.0.0.1:4187', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4187 --strictPort', url: 'http://127.0.0.1:4187', reuseExistingServer: false,
    env: { ...process.env, VITE_SUPABASE_URL: '', VITE_SUPABASE_PUBLISHABLE_KEY: '', VITE_DISABLE_EXTERNAL_APIS: 'true' },
  },
  projects: [{ name: 'desktop-chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome' } }, { name: 'mobile-chrome', use: { ...devices['Pixel 7'], channel: 'chrome' } }],
})
