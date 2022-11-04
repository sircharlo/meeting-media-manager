import { platform } from 'os'
import { Entry, sync, Options } from 'fast-glob'
/* eslint-disable import/named */
import { ipcRenderer } from 'electron'
import {
  existsSync,
  readdirSync,
  renameSync,
  copyFileSync,
  ensureDirSync,
  ensureFileSync,
  removeSync,
  writeFileSync,
  statSync,
  readFileSync,
} from 'fs-extra'
import { join, extname, basename, dirname, joinSafe } from 'upath'
import { Plugin } from '@nuxt/types'
import { FileStat, WebDAVClient } from 'webdav/dist/web/types'
import JSZip from 'jszip'
import { MeetingFile } from '~/types'
import { MAX_BYTES_IN_FILENAME } from '~/constants/general'

const plugin: Plugin = (
  { $getPrefs, $log, store, $appPath, $dayjs, $translate, $strip, $warn },
  inject
) => {
  // Paths
  inject('pubPath', (file?: MeetingFile): string | undefined => {
    if (!$getPrefs('media.lang')) return undefined

    let mediaFolder = $getPrefs('media.lang')
    if (/sjjm_E_\d+.mp3/g.test(basename(file?.url || ''))) {
      mediaFolder = 'E'
    }

    const pubPath = joinSafe($appPath(), 'Publications', mediaFolder)
    try {
      ensureDirSync(pubPath)
    } catch (e: unknown) {
      $warn('errorSetVars', { identifier: pubPath })
    }

    // Get path for specific file
    if (file) {
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
    } else {
      return pubPath
    }
  })

  function mediaPath(file?: MeetingFile): string | undefined {
    if (!$getPrefs('app.localOutputPath') || !$getPrefs('media.lang')) {
      return undefined
    }

    const mediaPath = joinSafe(
      $getPrefs('app.localOutputPath'),
      $getPrefs('media.lang')
    )

    try {
      ensureDirSync(mediaPath)
    } catch (e: unknown) {
      $warn('errorSetVars', { identifier: mediaPath })
    }

    if (file) {
      return joinSafe(
        mediaPath,
        file.folder as string,
        file.destFilename as string
      )
    }

    return mediaPath
  }
  inject('mediaPath', mediaPath)

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
    return joinSafe(
      $appPath(),
      'Publications',
      lang ?? $getPrefs('media.lang') ?? 'E',
      `yeartext-${lang ?? $getPrefs('media.lang') ?? 'E'}-${new Date()
        .getFullYear()
        .toString()}`
    )
  })

  // Improved fs/glob functions
  inject('findOne', (path: string | string[], options?: Options): string => {
    return sync(path, options)[0]
  })

  inject('findAll', (path: string | string[], options?: Options): string[] => {
    const results = sync(path, options)
    $log.debug(path, results)
    return results
  })

  inject(
    'findAllStats',
    (path: string | string[], options?: Options): Entry[] => {
      const results = sync(path, {
        ...options,
        stats: true,
      })
      $log.debug(path, results)
      return results
    }
  )

  inject('rm', (files: string | string[]): void => {
    if (!Array.isArray(files)) files = [files]
    files.forEach((file) => removeSync(file))
  })

  inject(
    'write',
    (file: string, data: string | NodeJS.ArrayBufferView): void => {
      try {
        ensureFileSync(file)
        writeFileSync(file, data)
      } catch (e: unknown) {
        $warn('errorSetVars', { identifier: dirname(file) })
      }
    }
  )

  inject('copy', (src: string, dest: string): void => {
    try {
      ensureFileSync(dest)
      copyFileSync(src, dest)
    } catch (e: unknown) {
      $warn('errorSetVars', { identifier: dirname(dest) })
    }
  })

  function rename(
    path: string,
    oldName: string,
    newName: string,
    action = 'rename',
    type = 'string'
  ): void {
    if (existsSync(path)) {
      const dir = dirname(path)
      const file = basename(path)

      try {
        switch (action) {
          case 'rename':
            if (type === 'date') {
              // Convert date folder to new format
              const date = $dayjs(file, oldName)
              if (date.isValid())
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
      if (existsSync(dir)) {
        readdirSync(dir).forEach((file) => {
          rename(join(dir, file), search, newName, action, type)
        })
      }
    }
  )

  inject(
    'renamePubs',
    async (oldVal: string, newVal: string): Promise<void> => {
      const path = mediaPath()
      if (!path) return
      readdirSync(path).forEach((dir) => {
        const path = join(mediaPath(), dir)
        const date = $dayjs(
          dir,
          $getPrefs('app.outputFolderDateFormat') as string,
          oldVal.split('-')[0]
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

            if (file !== newName) {
              renameSync(join(path, file), join(path, newName))
            }
          })

          // Rename the date folder to the new localized format
          const newPath = join(
            mediaPath(),
            date
              .locale(newVal.split('-')[0])
              .format($getPrefs('app.outputFolderDateFormat') as string)
          )
          if (!existsSync(newPath)) {
            renameSync(path, newPath)
          }
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
      const date = $dayjs(
        file.basename,
        $getPrefs('app.outputFolderDateFormat') as string,
        oldVal.split('-')[0]
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
    return ['mov', 'mp4', 'mpeg', 'mpg', 'ogg', 'ogv', 'webm'].includes(
      extname(filepath).slice(1).toLowerCase()
    )
  })

  inject('isImage', (filepath: string) => {
    if (!filepath) return false
    return ['jpg', 'png', 'gif', 'jpeg', 'svg'].includes(
      extname(filepath).slice(1).toLowerCase()
    )
  })

  inject('isAudio', (filepath: string) => {
    if (!filepath) return false
    return ['mp3', 'ogg', 'wav'].includes(
      extname(filepath).slice(1).toLowerCase()
    )
  })

  inject('sanitize', (name: string, isFile = false): string => {
    const ext = isFile ? extname(name).toLowerCase() : ''

    // Remove special characters from filename
    name = $strip(basename(name, ext), 'file') + ext

    if (isFile && mediaPath()) {
      // Cutoff filename if path is longer than 245 characters
      const maxCharactersInPath = 245
      const projectedPathCharLength = join(
        mediaPath(),
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

    return name
  })

  async function getContentsFromJWPUB(
    jwpub: string
  ): Promise<ArrayBuffer | undefined> {
    const zipFile = readFileSync(jwpub)
    const zipper = new JSZip()
    const zipContents = await zipper.loadAsync(zipFile)
    return zipContents.file('contents')?.async('arraybuffer')
  }

  // Zipper functions
  inject('extractAllTo', async (jwpub: string, dest: string): Promise<void> => {
    const zipper = new JSZip()
    const fileBuffer = await getContentsFromJWPUB(jwpub)
    if (!fileBuffer) throw new Error('Could not extract files from zip')
    const contents = await zipper.loadAsync(fileBuffer)
    for (const [filename, fileObject] of Object.entries(contents.files)) {
      const data = await fileObject.async('nodebuffer')
      writeFileSync(join(dest, filename), data)
    }
  })

  inject(
    'getZipContentsByExt',
    async (zip: string, ext: string): Promise<Buffer | null> => {
      const zipper = new JSZip()
      const fileBuffer = await getContentsFromJWPUB(zip)
      if (!fileBuffer) throw new Error('Could not extract files from zip')
      const contents = await zipper.loadAsync(fileBuffer)
      for (const [filename, fileObject] of Object.entries(contents.files)) {
        if (extname(filename).toLowerCase() === ext) {
          return fileObject.async('nodebuffer')
        }
      }
      return null
    }
  )

  inject(
    'getZipContentsByName',
    async (zip: string, name: string): Promise<Buffer | null> => {
      const zipper = new JSZip()
      const fileBuffer = await getContentsFromJWPUB(zip)
      if (!fileBuffer) throw new Error('Could not extract files from zip')
      const contents = await zipper.loadAsync(fileBuffer)
      for (const [filename, fileObject] of Object.entries(contents.files)) {
        if (filename === name) {
          return fileObject.async('nodebuffer')
        }
      }
      return null
    }
  )
}

export default plugin
