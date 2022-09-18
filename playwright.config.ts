import { PlaywrightTestConfig } from '@playwright/test'

const config: PlaywrightTestConfig = {
  testDir: './tests',
  timeout: 60000,
  workers: 1,
  retries: process.env.CI ? 2 : 0, // set to 2 when running on CI
  reporter: process.env.CI ? 'github' : 'list',
  maxFailures: process.env.CI ? 0 : 1,
  use: {
    trace: 'on-first-retry', // record traces on first retry of each test
  },
  expect: {
    toMatchSnapshot: { threshold: 0.2 },
  },
}

export default config
