import { defineConfig } from '@playwright/test'

export default defineConfig({
  use: {
    baseURL: 'http://localhost:5173'
  },
  webServer: [
    {
      command: 'cd ../server && bun run dev',
      stderr: 'pipe',
      stdout: 'pipe',
      url: 'http://localhost:3000/health'
    },
    {
      command: 'cd ../web && bun run dev',
      stderr: 'pipe',
      stdout: 'ignore',
      url: 'http://localhost:5173/'
    }
  ]
})
