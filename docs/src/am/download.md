---
title: Downloads
---

<!-- markdownlint-disable MD025 MD033 -->

# Downloads

Use the links below to download the latest version of Meeting Media Manager for your operating system. These links always point to the newest stable release.

<script setup lang="ts">
import { data as downloads } from '../../data/version.data.mts'
import { computed, onMounted, ref } from 'vue'
import { useData } from 'vitepress'
import messages from '../../locales'
import { kebabToCamelCase } from '../../utils/general'

const { lang } = useData()
const msg = computed(() => {
  const key = kebabToCamelCase(lang.value)
  // @ts-expect-error dynamic index from locales
  return messages[key] || messages.en
})

const daysAgoText = computed(() => {
  if (!downloads.publishedAt) return ''
  const released = new Date(downloads.publishedAt).getTime()
  const now = Date.now()
  const days = Math.floor((now - released) / (1000 * 60 * 60 * 24))
  if (Number.isNaN(days) || days < 0) return ''
  return days === 0
    ? msg.value.releasedToday
    : days === 1
      ? msg.value.released1DayAgo
      : msg.value.releasedXDaysAgo.replace('{days}', days.toString())
})

type Rec = { href: string; label: string }
const recommended = ref<Rec | null>(null)

onMounted(() => {
  const ua = navigator.userAgent || ''
  const platform = navigator.platform || ''
  const isMobile = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(ua)
  if (isMobile) {
    recommended.value = null
    return
  }

  const isWindows = /Windows/i.test(ua) || /Win/i.test(platform)
  const isMac = /Mac OS X|Macintosh|MacIntel/i.test(ua) || /Mac/i.test(platform)
  const isLinux = /Linux/i.test(ua) && !isAndroid(ua)

  const isArm = /arm64|aarch64|Apple\s*Silicon/i.test(ua)
  const isIa32 = /\b(ia32|x86)\b/i.test(ua)

  function isAndroid(s: string) { return /Android/i.test(s) }

  if (isWindows) {
    const href = isIa32 ? downloads.win32 : downloads.win64
    recommended.value = { href, label: isIa32 ? msg.value.windows32Bit : msg.value.windows64Bit }
    return
  }

  if (isMac) {
    const href = isArm ? downloads.macArm : downloads.macIntel
    recommended.value = { href, label: isArm ? msg.value.macArm : msg.value.macIntel }
    return
  }

  if (isLinux) {
    recommended.value = { href: downloads.linux, label: msg.value.linux }
    return
  }

  recommended.value = null
})
</script>

## Latest release

- **Version**: {{ downloads.version }} <span v-if="daysAgoText">({{ daysAgoText }})</span>

<div v-if="recommended" style="margin: 1rem 0; padding: 1rem; border: 1px solid var(--vp-c-brand-1); border-radius: 8px; background: var(--vp-c-brand-soft);"><strong>{{ msg.recommendedFor }} {{ recommended.label }}</strong>
  <div style="margin-top: .5rem;"><a :href="recommended.href" style="display:inline-block; padding:.5rem 1rem; border-radius:6px; background: var(--vp-c-brand-1); color: white; text-decoration:none;">{{ msg.download }}</a>
  </div>
  <div style="margin-top:.5rem; font-size: .9em; opacity:.8;">If this doesn’t match your system, pick from the options below.</div>
</div>

## Windows

- **Windows 64-bit (.exe)**: <a :href="downloads.win64">Download</a>
- **Windows 32-bit (.exe)**: <a :href="downloads.win32">Download</a>
- **Windows Portable (.exe)**: <a :href="downloads.winPortable">Download</a>

## macOS

- **Apple Silicon (arm64) (.dmg)**: <a :href="downloads.macArm">Download</a>
- **Intel (x64) (.dmg)**: <a :href="downloads.macIntel">Download</a>

## Linux

- **x86_64 (AppImage)**: <a :href="downloads.linux">Download</a>
