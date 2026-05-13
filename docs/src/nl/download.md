---
title: Downloads
---

<!-- markdownlint-disable MD025 MD033 -->

# Downloads

Gebruik de onderstaande links om de nieuwste versie van Meeting Media Manager voor je besturingssysteem te downloaden. Deze links verwijzen altijd naar de nieuwste stabiele versie.

<script setup lang="ts">
Importeer { data als downloads } van '../../data/version.data. ts'
import { computed, onMounted, ref } van 'vue'
importeer { useData } uit 'vitepress'
import berichten van '. /../locales/index.ts'
importeer { kebabToCamelCase } uit '../.. keer/general.ts'

const { lang } = useData()
const msg = berekend (() => {
  const key = kebabToCamelCase(lang. groet)
  // @ts-expect-error dynamische index van locales
  retourneert berichten[key] Oogstalleren berichten. n
})

const daysAgoText = berekend (() => {
  if (!downloads. ublishedAt) return ''
  const released = new Date(downloads.publishedAt).getTime()
  const now = Date. ow()
  const dagen = Math.floor((nu - uitgegeven) / (1000 * 60 * 60 * 24))
  als (getal. sNaN(dagen) 58 dagen retour ''
  retourdagen === 0
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

  const isIa32 = /\b(ia32|x86)\b/i.test(ua)

  function isAndroid(s: string) { return /Android/i.test(s) }

  if (isWindows) {
    const href = isIa32 ? downloads.win32 : downloads.win64
    recommended.value = { href, label: isIa32 ? msg.value.windows32Bit : msg.value.windows64Bit }
    return
  }

  if (isMac) {
    recommended.value = { href: downloads.macUniversal, label: msg.value.macUniversal }
    return
  }

  if (isLinux) {
    recommended.value = { href: downloads.linux, label: msg.value.linux }
    return
  }

  recommended.value = null
})
</script>

## Nieuwste release

- **Versie**: {{ downloads.version }} <span v-if="daysAgoText">({{ daysAgoText }})</span>

<div v-if="recommended" style="margin: 1rem 0; padding: 1rem; border: 1px solid var(--vp-c-brand-1); border-radius: 8px; background: var(--vp-c-brand-soft);"><strong>{{ msg.recommendedFor }} {{ recommended.label }}</strong>
  <div style="margin-top: .5rem;"><a :href="recommended.href" style="display:inline-block; padding:.5rem 1rem; border-radius:6px; background: var(--vp-c-brand-1); color: white; text-decoration:none;">{{ msg.download }}</a>
  </div>
  <div style="margin-top:.5rem; font-size: .9em; opacity:.8;">Als dit niet overeenkomt met je systeem, kies dan een van de onderstaande opties.</div>
</div>

## Windows

- **Windows 64-bits (.exe)**: <a :href="downloads.win64">Downloaden</a>
- **Windows 32-bits (.exe)**: <a :href="downloads.win32">Downloaden</a>
- **Windows Portable (.exe)**: <a :href="downloads.winPortable">Downloaden</a>

## macOS

- **macOS (Universeel) (.dmg)**: <a :href="downloads.macUniversal">Downloaden</a>

## Linux

- **x86_64 (AppImage)**: <a :href="downloads.linux">Downloaden</a>
