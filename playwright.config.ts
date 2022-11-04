import { PlaywrightTestConfig } from '@playwright/test'

const config: PlaywrightTestConfig = {
  testDir: './tests',
  timeout: 60000,
  workers: 1,
  retries: process.env.CI ? 2 : 0, // set to 2 when running on CI
  reporter: process.env.CI ? 'github' : 'list',
  maxFailures: process.env.CI ? 2 : 1,
  use: {
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure', // record traces of failed tests
    video: 'retain-on-failure', // record traces of failed tests
  },
  expect: {
    toMatchSnapshot: { threshold: 0.2 },
  },
}

export default config
