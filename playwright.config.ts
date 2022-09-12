import { PlaywrightTestConfig } from '@playwright/test'

const config: PlaywrightTestConfig = {
  testDir: './tests',
  timeout: 60000,
  retries: process.env.CI ? 2 : 0, // set to 2 when running on CI
  reporter: process.env.CI ? 'dot' : 'list',
  use: {
    trace: 'on-first-retry', // record traces on first retry of each test
  },
  expect: {
    toMatchSnapshot: { threshold: 0.2 },
  },
}

export default config
