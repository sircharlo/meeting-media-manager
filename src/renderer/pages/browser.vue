<template>
  <div style="width: 100%; height: 100%; overflow: hidden">
    <iframe id="website" :src="url" style="width: 100%; height: 100%" />
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { MetaInfo } from 'vue-meta'
import { ipcRenderer } from 'electron'

export default defineComponent({
  name: 'BrowserPage',
  layout: 'media',
  head(): MetaInfo {
    return {
      title: this.controller ? 'Website Controller' : 'Media Window',
    }
  },
  computed: {
    url(): string {
      return this.$route.query.url as string
    },
    controller(): boolean {
      return !!this.$route.query.controller
    },
  },
  mounted() {
    const iframe = document.getElementById('website') as HTMLIFrameElement

    if (this.controller) {
      const html = document.querySelector('html') as HTMLHtmlElement
      const body = document.querySelector('body') as HTMLBodyElement
      // @ts-ignore
      html.style['-webkit-app-region'] = 'none'
      // @ts-ignore
      body.style['-webkit-app-region'] = 'none'

      iframe.onload = () => {
        const win = iframe.contentWindow
        const doc = iframe.contentDocument
        if (doc) {
          const head = doc.querySelector('head')
          if (head) {
            const style = document.createElement('style')
            style.innerHTML = `
                .lnc-firstRunPopup {
                  display: none !important;
                }
              `
            head.appendChild(style)
          }
        }
        if (win) {
          win.onscroll = () => {
            ipcRenderer.send('scrollWebsite', {
              x:
                win.scrollX /
                (win.document.firstElementChild?.scrollWidth ?? win.innerWidth),
              y:
                win.scrollY /
                (win.document.firstElementChild?.scrollHeight ??
                  win.innerHeight),
            })
          }
          win.onclick = (e: MouseEvent) => {
            console.debug('Clicked', e.target)
            e.stopImmediatePropagation()
            let el = e.target as Element
            const invalidTags = ['svg', 'path', 'span']
            if (invalidTags.includes(el.tagName.toLowerCase())) {
              el = el.closest('button') ?? el.closest('a') ?? el
            }

            const target = {
              tag: el.tagName.toLowerCase(),
              id: el.id,
              className:
                typeof el.className === 'string'
                  ? el.className
                  : // @ts-ignore
                    el.className?.baseVal, // SVGAnimatedString
              text: el.textContent,
              alt: el.getAttribute('alt'),
              src: el.getAttribute('src'),
              href: el.getAttribute('href'),
            }
            console.debug('Target', target)

            // @ts-ignore: target does not exist on type Element
            if (target.tag === 'a' && el.target === '_blank') {
              e.preventDefault()
              ipcRenderer.send('openWebsite', target.href)
            } else {
              ipcRenderer.send('clickOnWebsite', target)
            }
          }
        }
      }
    } else {
      iframe.onload = () => {
        const doc = iframe.contentDocument
        if (!doc) return

        const head = doc.querySelector('head')
        if (!head) return

        const style = document.createElement('style')
        style.innerHTML = `
                .lnc-firstRunPopup {
                  display: none !important;
                }
              `
        head.appendChild(style)
      }
      ipcRenderer.on('scrollWebsite', (_e, pos) => {
        const win = iframe.contentWindow
        if (win) {
          win.scrollTo(
            pos.x *
              (win.document.firstElementChild?.scrollWidth ?? win.innerWidth),
            pos.y *
              (win.document.firstElementChild?.scrollHeight ?? win.innerHeight)
          )
        }
      })

      ipcRenderer.on('clickOnWebsite', (_e, target) => {
        const doc = iframe.contentDocument
        const { tag, id, className, text, src, alt, href } = target
        if (doc) {
          let el: HTMLElement | null = null
          if (id) {
            el = doc.getElementById(id)
          } else if (className && text) {
            const selector = `${tag}.${className
              .trim()
              .replaceAll(/\s+/g, '.')}`
            el =
              (Array.from(doc.querySelectorAll(selector)).find(
                (e) => e.textContent === text
              ) as HTMLElement) ?? null
          } else if (src) {
            el = doc.querySelector(`${tag}[src="${src}"]`)
          } else if (alt) {
            el = doc.querySelector(`${tag}[alt="${alt}"]`)
          } else if (href) {
            el = doc.querySelector(`${tag}[href="${href}"]`)
          } else if (className) {
            const selector = `${tag}.${className
              .trim()
              .replaceAll(/\s+/g, '.')}`
            el = doc.querySelector(selector)
          }
          console.debug('el', el)
          if (el) {
            try {
              el.click()
            } catch (e: unknown) {
              try {
                console.debug('Trying to click the parent')
                const button = el.closest('button')
                if (button) {
                  console.debug('Found button', button)
                  button.click()
                } else {
                  const link = el.closest('a')
                  if (link) link.click()
                }
              } catch (e) {
                console.error(e)
              }
            }
          }
        }
      })
    }
  },
})
</script>
<style lang="scss">
html,
body {
  -webkit-app-region: drag;
  background: black;
  user-select: auto;
}
</style>
