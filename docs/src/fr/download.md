---
title: Téléchargements
---

<!-- markdownlint-disable MD025 MD033 -->

# Téléchargements

Utilisez les liens ci-dessous pour télécharger la dernière version de Meeting Media Manager pour votre système d'exploitation. Ces liens pointent toujours vers la version stable la plus récente.

<script setup lang="ts">
importer { data as downloads } from '../../data/version.data. ts'
import { computed, onMounted, ref } from 'vue'
import { useData } from 'vitepress'
import messages from '. /../locales/index.ts'
importer { kebabToCamelCase } de '../.. utils/general.ts'

const { lang } = useData()
const msg = computed(() => {
  const key = kebabToCamelCase(lang. alue)
  // @ts-expect-error index dynamique des locales
  messages de retour[key] || messages. n
})

const daysAgoText = computed(() => {
  if (!downloads. ublishedAt) retour ''
  const released = new Date(downloads.publishedAt).getTime()
  const now = Date. ow()
  jours const = Math.floor(maintenant - libéré) / (1000 * 60 * 60 * 24))
  si (Nombre. sNaN(jours) || jours < 0) retour ''
  jours de retour === 0
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

## Dernière version

- **Version** : {{ downloads.version }} <span v-if="daysAgoText">({{ daysAgoText }})</span>

<div v-if="recommended" style="margin: 1rem 0; padding: 1rem; border: 1px solid var(--vp-c-brand-1); border-radius: 8px; background: var(--vp-c-brand-soft);"><strong>{{ msg.recommendedFor }} {{ recommended.label }}</strong>
  <div style="margin-top: .5rem;"><a :href="recommended.href" style="display:inline-block; padding:.5rem 1rem; border-radius:6px; background: var(--vp-c-brand-1); color: white; text-decoration:none;">{{ msg.download }}</a>
  </div>
  <div style="margin-top:.5rem; font-size: .9em; opacity:.8;">Si cela ne correspond pas à votre système, choisissez parmi les options ci-dessous.</div>
</div>

## Windows

- **Windows 64-bit (.exe)** : <a :href="downloads.win64">Télécharger</a>
- **Windows 32-bit (.exe)** : <a :href="downloads.win32">Télécharger</a>
- **Windows Portable (.exe)** : <a :href="downloads.winPortable">Télécharger</a>

## macOS

- **macOS (universel) (.dmg)** : <a :href="downloads.macUniversal">Télécharger</a>

## Linux

- **x86_64 (AppImage)** : <a :href="downloads.linux">Télécharger</a>
