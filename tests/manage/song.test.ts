import { expect, test } from '@playwright/test'
import { ElectronApplication, Page } from 'playwright'
import { startApp, openHomePage } from './../helpers/electronHelpers'
import { delay } from './../helpers/generalHelpers'
import locale from './../../src/renderer/locales/en.json'

let electronApp: ElectronApplication

test.beforeAll(async () => {
  electronApp = await startApp()
})

test.afterAll(async () => {
  await electronApp.close()
})

let page: Page
let filename: string

test('render the add media page correctly', async () => {
  page = await openHomePage(electronApp)

  // Open add page
  await page.locator('.v-card', { hasText: locale.recurring }).click()

  // Check for correct heading
  expect(await page.locator('h1').innerText()).toBe(`Recurring`)

  // Test if title is correct
  const title = await page.title()
  expect(title).toBe('Manage Recurring - M³')
})

test('add song', async () => {
  // Click song tab
  await page.locator('button', { hasText: locale.song }).click()

  // Wait for songs to be loaded
  await delay(1500)

  // Click song dropdown
  await page.locator('.v-select').click()

  // Get song title
  filename = (await page.locator('text=1. ').first().innerText())
    .replace(/[^a-zA-Z0-9 \-_]/g, '')
    .replace(/ *[—?;:|!?] */g, ' - ')

  // Select first song
  await page.locator('text=1. ').first().click()

  // Fill in prefix
  await page.locator('.otp-field-box--0').first().fill('0')
  await page.locator('.otp-field-box--1').first().fill('1')
  await page.locator('.otp-field-box--0').nth(1).fill('2')
  await page.locator('.otp-field-box--1').nth(1).fill('3')
  await page.locator('.otp-field-box--0').nth(2).fill('4')
  await page.locator('.otp-field-box--1').nth(2).fill('5')

  // Expect song to be present in media list
  expect(
    await page.locator(`text=01-23-45 - ${locale.song} ${filename}.mp4`).count()
  ).toBe(1)

  // Click save button
  await page.locator('svg.fa-floppy-disk').click()

  // Wait for home button to appear
  await page.waitForSelector('svg.fa-house')

  // Expect song to be present in media list
  expect(
    await page.locator(`text=01-23-45 - ${locale.song} ${filename}.mp4`).count()
  ).toBe(1)
})

test('rename song', async () => {
  // Click on rename button
  await page.locator('svg.fa-pen').click()

  // Expect check button to be visible
  expect(await page.locator('svg.fa-check').isVisible()).toBe(true)

  // Clear name input
  await page.locator('input[type=text]').fill('')

  // Rename song to 'new song name with special characters'
  filename = 'new song name with ()!@#$%^&'
  await page.locator('input[type=text]').fill(filename)

  filename = filename
    .replace(/[^a-zA-Z0-9 \-_]/g, '')
    .replace(/ *[—?;:|!?] */g, ' - ')
    .trim()

  // Click check button
  await page.locator('svg.fa-check').click()

  // Expect cleaned, renamed song to be present
  expect(await page.locator(`text=${filename}.mp4`).count()).toBe(1)
})

test('remove song', async () => {
  // Click on remove button
  await page.locator('svg.fa-square-minus').click()

  // Verify red color
  expect(
    await page.locator('svg.fa-square-minus').getAttribute('class')
  ).toContain('error')

  // Click on remove button again
  await page.locator('svg.fa-square-minus').click()

  // Verify song has been removed
  expect(await page.locator(`text=${filename}.mp4`).count()).toBe(0)
})
