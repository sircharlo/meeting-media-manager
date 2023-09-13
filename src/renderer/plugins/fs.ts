/* eslint-disable import/named */
import { platform } from 'os'
import {
  existsSync,
  readdirSync,
  renameSync,
  copyFileSync,
  writeFileSync,
  statSync,
  readFileSync,
  ensureDirSync,
  ensureFileSync,
  removeSync,
  readJsonSync,
} from 'fs-extra'
import { LocaleObject } from '@nuxtjs/i18n'
import { Entry, sync, Options } from 'fast-glob'
import { ipcRenderer } from 'electron'
import { join, extname, basename, dirname, joinSafe } from 'upath'
import { Plugin } from '@nuxt/types'
import { FileStat, WebDAVClient } from 'webdav/dist/web/types'
import JSZip from 'jszip'
import { MeetingFile, ShortJWLang } from '~/types'
import { MAX_BYTES_IN_FILENAME } from '~/constants/general'
import { FALLBACK_SITE_LANGS } from '~/constants/lang'

const plugin: Plugin = (
  { $getPrefs, $log, store, $appPath, $dayjs, $translate, $strip, i18n, $warn },
  inject
) => {
  // Paths
  inject('pubPath', (file?: MeetingFile): string | undefined => {
    // url: something/{pub}_{lang}.jwpub or something/{pub}_{lang}_{track}.mp4
    let validMediaLangs: ShortJWLang[] = []
    if (file) {
      $log.debug('pubPath file', file)
    }
    try {
      validMediaLangs = readJsonSync(
        join($appPath(), 'langs.json')
      ) as ShortJWLang[]
    } catch (e: unknown) {
      $log.error(e)
      $log.debug('Error parsing langs file; falling back to fallback langs')
      validMediaLangs = FALLBACK_SITE_LANGS as ShortJWLang[]
    }

    let mediaFolder = basename(file?.url || '_')
      .split('_')[1]
      .split('.')[0]

    if (
      !mediaFolder ||
      !validMediaLangs.find((l) => l.langcode === mediaFolder)
    ) {
      mediaFolder = basename(file?.queryInfo?.FilePath || '_').split('_')[1]
    }

    if (
      !mediaFolder ||
      !validMediaLangs.find((l) => l.langcode === mediaFolder)
    ) {
      try {
        const matches = file?.queryInfo?.Link?.match(/\/(.*)\//)
        if (matches && matches.length > 0) {
          mediaFolder = (matches.pop() as string).split(':')[0]
        }
      } catch (e: unknown) {
        $log.error(e)
      }
    }

    if (
      !mediaFolder ||
      !validMediaLangs.find((l) => l.langcode === mediaFolder)
    ) {
      mediaFolder = $getPrefs('media.lang') as string
    }
    if (!mediaFolder) return

    const pubPath = joinSafe(
      $getPrefs('app.customCachePath') || $appPath(),
      'Publications',
      mediaFolder
    )
    try {
      ensureDirSync(pubPath)
    } catch (e: unknown) {
      $warn('errorSetVars', { identifier: pubPath }, e)
    }

    if (!file) return pubPath

    // Get path for specific file
    const pubFolder = (
      file.pub ||
      file.queryInfo?.KeySymbol ||
      file.queryInfo?.MultiMeps ||
      file.primaryCategory ||
      'unknown'
    ).toString()

    const issueFolder = (
      file.issue ||
      file.queryInfo?.IssueTagNumber ||
      0
    ).toString()
    const trackFolder = (file.track || file.queryInfo?.Track || 0).toString()
    return joinSafe(pubPath, pubFolder, issueFolder, trackFolder)
  })

  function mediaPath(file?: MeetingFile): string | undefined {
    const mediaLang = $getPrefs('media.lang') as string
    const outputPath = $getPrefs('app.localOutputPath') as string
    if (!outputPath || !mediaLang) return undefined

    const mediaPath = joinSafe(outputPath, mediaLang)

    try {
      ensureDirSync(mediaPath)
    } catch (e: unknown) {
      $warn('errorSetVars', { identifier: mediaPath }, e)
    }

    if (!file) return mediaPath

    return joinSafe(
      mediaPath,
      file.folder as string,
      file.destFilename ?? file.safeName
    )
  }
  inject('mediaPath', mediaPath)

  inject('localFontPath', (font: string) => {
    return join(
      $getPrefs('app.customCachePath') || $appPath(),
      'Fonts',
      basename(font)
    )
  })

  inject('wtFontPath', async (): Promise<string> => {
    const appDataPath = await ipcRenderer.invoke('appData')
    const localAppData = sync(joinSafe(appDataPath, '../local'), {
      onlyDirectories: true,
    })
    let path = appDataPath
    if (platform() === 'win32' && localAppData.length > 0) {
      path = localAppData[0]
    }
    return join(
      path,
      'Packages',
      '*WatchtowerBibleandTractSo*',
      'LocalState',
      'www',
      'webapp',
      'fonts'
    )
  })

  inject('ytPath', (lang?: string): string => {
    const ytLang =
      lang || $getPrefs('media.lang') || $getPrefs('media.langFallback') || 'E'
    return joinSafe(
      $getPrefs('app.customCachePath') || $appPath(),
      'Publications',
      ytLang,
      `yeartext-${ytLang}-${new Date().getFullYear().toString()}`
    )
  })

  // Improved fs/glob functions
  inject('findOne', (path: string | string[], options?: Options): string => {
    try {
      return sync(path, options)[0]
    } catch (e: unknown) {
      const identifier = path instanceof Array ? path[0] : path
      $warn('errorSetVars', { identifier }, e)
    }
    return ''
  })

  inject('findAll', (path: string | string[], options?: Options): string[] => {
    try {
      const results = sync(path, options)
      $log.debug(path, results)
      return results
    } catch (e: any) {
      if (e.message?.includes('operation not permitted')) {
        const identifier = e.message.split("'")[1]
        $warn('errorSetVars', { identifier }, e)
      } else {
        const identifier = path instanceof Array ? path[0] : path
        $warn('errorSetVars', { identifier }, e)
      }
    }
    return []
  })

  inject(
    'findAllStats',
    (path: string | string[], options?: Options): Entry[] => {
      try {
        const results = sync(path, {
          ...options,
          stats: true,
        })
        $log.debug(path, results)
        return results
      } catch (e: any) {
        if (e.message?.includes('operation not permitted')) {
          const identifier = e.message.split("'")[1]
          $warn('errorSetVars', { identifier }, e)
        } else {
          const identifier = path instanceof Array ? path[0] : path
          $warn('errorSetVars', { identifier }, e)
        }
      }
      return []
    }
  )

  inject('rm', (files: string | string[]): void => {
    if (!Array.isArray(files)) files = [files]
    files.forEach((file) => {
      try {
        removeSync(file)
      } catch (e: unknown) {
        $warn('errorWebdavRm', { identifier: file }, e)
      }
    })
  })

  inject(
    'write',
    (file: string, data: string | NodeJS.ArrayBufferView): void => {
      try {
        ensureFileSync(file)
        writeFileSync(file, data)
      } catch (e: unknown) {
        $warn('errorSetVars', { identifier: dirname(file) }, e)
      }
    }
  )

  inject('copy', (src: string, dest: string): void => {
    try {
      ensureFileSync(dest)
      copyFileSync(src, dest)
    } catch (e: unknown) {
      $warn('errorSetVars', { identifier: dirname(dest) }, e)
    }
  })

  inject('move', (src: string, dest: string, overwrite = false): void => {
    if (!existsSync(src)) return
    if (existsSync(dest)) {
      if (overwrite) {
        removeSync(dest)
      } else {
        $warn('errorDestExists', { identifier: dest })
        return
      }
    }

    try {
      renameSync(src, dest)
    } catch (e: unknown) {
      $warn('errorSetVars', { identifier: dest }, e)
    }
  })

  function rename(
    path: string,
    oldName: string,
    newName: string,
    action = 'rename',
    type = 'string'
  ): void {
    if (!existsSync(path)) return

    const dir = dirname(path)
    const file = basename(path)

    try {
      switch (action) {
        case 'rename':
          if (type === 'date') {
            // Convert date folder to new format
            const date = $dayjs(file, oldName)
            if (!date.isValid()) return
            if (file !== date.format(newName)) {
              renameSync(path, join(dir, date.format(newName)))
            }
          } else if (file === oldName) {
            // Rename a file
            if (file !== newName) {
              renameSync(path, join(dir, newName))
            }
          }
          break
        case 'replace': // Replace a string within a filename (e.g. song or paragraph)
          if (oldName !== newName && file.includes(oldName)) {
            renameSync(path, join(dir, file.replace(oldName, newName)))
          }
          break
        default:
          throw new Error('Invalid type for rename() function: ' + type)
      }
    } catch (e: unknown) {
      $warn('errorRename', { identifier: path }, e)
    }
  }

  inject('rename', rename)

  // Search for all occurrence inside a folder and rename them
  inject(
    'renameAll',
    (
      dir: string,
      search: string,
      newName: string,
      action = 'rename',
      type = 'string'
    ): void => {
      if (!existsSync(dir)) return

      readdirSync(dir).forEach((file) => {
        rename(join(dir, file), search, newName, action, type)
      })
    }
  )

  inject(
    'renamePubs',
    async (oldVal: string, newVal: string): Promise<void> => {
      const mPath = mediaPath()
      if (!mPath) return

      const locales = i18n.locales as LocaleObject[]
      const oldLocale = locales.find((l) => l.code === oldVal)
      const newLocale = locales.find((l) => l.code === newVal)

      readdirSync(mPath).forEach((dir) => {
        const path = join(mPath, dir)
        const date = $dayjs(
          dir,
          $getPrefs('app.outputFolderDateFormat') as string,
          oldLocale?.dayjs ?? oldVal
        )

        if (statSync(path).isDirectory() && date.isValid()) {
          // Rename all files that include the localized 'song' or 'paragraph' strings
          readdirSync(path).forEach((file) => {
            const newName = file
              .replace(
                ' - ' + $translate('song', oldVal),
                ' - ' + $translate('song', newVal)
              )
              .replace(
                ' - ' + $translate('paragraph', oldVal),
                ' - ' + $translate('paragraph', newVal)
              )

            rename(join(path, file), file, newName)
          })

          // Rename the date folder to the new localized format
          rename(
            path,
            dir,
            date
              .locale(newLocale?.dayjs ?? newVal)
              .format($getPrefs('app.outputFolderDateFormat') as string)
          )
        }
      })

      // Rename files containing localized 'song' or 'paragraph' strings and date folders on cong server
      const client = store.state.cong.client as WebDAVClient
      if (client) {
        const promises: Promise<void>[] = []

        store.state.cong.contents.forEach((file: FileStat) => {
          promises.push(renameCongFile(client, file, oldVal, newVal))
        })

        await Promise.allSettled(promises)
      }
    }
  )

  async function renameCongFile(
    client: WebDAVClient,
    file: FileStat,
    oldVal: string,
    newVal: string
  ): Promise<void> {
    if (file.basename.includes(' - ' + $translate('song', oldVal))) {
      const newName = file.filename.replace(
        ' - ' + $translate('song', oldVal),
        ' - ' + $translate('song', newVal)
      )

      if (file.filename !== newName) {
        await client.moveFile(file.filename, newName)
      }
    } else if (
      file.basename.includes(' - ' + $translate('paragraph', oldVal))
    ) {
      const newName = file.filename.replace(
        ' - ' + $translate('paragraph', oldVal),
        ' - ' + $translate('paragraph', newVal)
      )
      if (file.filename !== newName) {
        await client.moveFile(file.filename, newName)
      }
    } else if (file.type === 'directory') {
      const locales = i18n.locales as LocaleObject[]
      const oldLocale = locales.find((l) => l.code === oldVal)
      const date = $dayjs(
        file.basename,
        $getPrefs('app.outputFolderDateFormat') as string,
        oldLocale?.dayjs ?? oldVal
      )

      if (date.isValid()) {
        const newName = file.filename.replace(
          file.basename,
          date
            .locale(newVal)
            .format($getPrefs('app.outputFolderDateFormat') as string)
        )
        if (file.filename !== newName) {
          const contents = store.state.cong.contents as FileStat[]
          if (!contents.find(({ filename }) => filename === newName)) {
            await client.moveFile(file.filename, newName)
          }
        }
      }
    }
  }

  inject('isVideo', (filepath: string) => {
    if (!filepath) return false
    return ['mov', 'mp4', 'm4v', 'mpeg', 'mpg', 'ogg', 'ogv', 'webm'].includes(
      extname(filepath).slice(1).toLowerCase()
    )
  })

  inject('isImage', (filepath: string) => {
    if (!filepath) return false
    return ['jpg', 'png', 'gif', 'bmp', 'jfif', 'jpeg', 'svg', 'webp'].includes(
      extname(filepath).slice(1).toLowerCase()
    )
  })

  inject('isAudio', (filepath: string) => {
    if (!filepath) return false
    return ['mp3', 'ogg', 'wav'].includes(
      extname(filepath).slice(1).toLowerCase()
    )
  })

  function sanitize(name: string, isFile = false, first = true): string {
    const ext = isFile ? extname(name).toLowerCase() : ''

    // Remove special characters from filename
    name = $strip(name.replace(extname(name), ''), 'file') + ext
    const mPath = mediaPath()

    if (isFile && mPath) {
      // Cutoff filename if path is longer than 245 characters
      const maxCharactersInPath = 245
      const projectedPathCharLength = join(
        mPath,
        '9999-99-99 - AAAAAAAAAA AAAAAAAAAA',
        name
      ).length
      if (projectedPathCharLength > maxCharactersInPath) {
        name =
          basename(name, ext)
            .slice(0, -(projectedPathCharLength - maxCharactersInPath))
            .trim() + ext
      }

      // Cutoff filename until path is smaller than 200 bytes
      let currentBytes = Buffer.byteLength(name, 'utf8')
      while (currentBytes > MAX_BYTES_IN_FILENAME) {
        name = basename(name, ext).slice(0, -1).trim() + ext
        currentBytes = Buffer.byteLength(name, 'utf8')
      }
    }

    return first ? sanitize(name, isFile, false) : name
  }

  inject('sanitize', sanitize)

  async function getContents(
    file: string,
    jwpub = true
  ): Promise<ArrayBuffer | undefined> {
    const zipFile = readFileSync(file)
    if (!jwpub) return zipFile
    const zipper = new JSZip()
    const zipContents = await zipper.loadAsync(zipFile)
    return zipContents.file('contents')?.async('arraybuffer')
  }

  // Zipper functions
  inject('extractAllTo', async (jwpub: string, dest: string): Promise<void> => {
    try {
      const zipper = new JSZip()
      const fileBuffer = await getContents(jwpub)
      if (!fileBuffer) throw new Error('Could not extract files from zip')
      const contents = await zipper.loadAsync(fileBuffer)
      for (const [filename, fileObject] of Object.entries(contents.files)) {
        const data = await fileObject.async('nodebuffer')
        writeFileSync(join(dest, filename), data)
      }
    } catch (e: unknown) {
      $warn('errorExtractFromJWPUB', { identifier: jwpub })
    }
  })

  inject(
    'getZipContentsByExt',
    async (zip: string, ext: string, jwpub = true): Promise<Buffer | null> => {
      try {
        const zipper = new JSZip()
        const fileBuffer = await getContents(zip, jwpub)
        if (!fileBuffer) throw new Error('Could not extract files from zip')
        const contents = await zipper.loadAsync(fileBuffer)
        for (const [filename, fileObject] of Object.entries(contents.files)) {
          if (extname(filename).toLowerCase() === ext) {
            return fileObject.async('nodebuffer')
          }
        }
      } catch (e: unknown) {
        $warn('errorExtractFromJWPUB', { identifier: zip })
      }
      return null
    }
  )

  inject(
    'getZipContentsByName',
    async (zip: string, name: string, jwpub = true): Promise<Buffer | null> => {
      try {
        const zipper = new JSZip()
        const fileBuffer = await getContents(zip, jwpub)
        if (!fileBuffer) throw new Error('Could not extract files from zip')
        const contents = await zipper.loadAsync(fileBuffer)
        for (const [filename, fileObject] of Object.entries(contents.files)) {
          if (filename === name) {
            return fileObject.async('nodebuffer')
          }
        }
      } catch (e: unknown) {
        $warn('errorExtractFromJWPUB', { identifier: zip })
      }
      return null
    }
  )
}

export default plugin
