import { platform } from 'os'
import { ipcRenderer } from 'electron'
/* eslint-disable import/named */
import {
  existsSync,
  readdirSync,
  renameSync,
  copyFileSync,
  ensureDirSync,
  ensureFileSync,
  removeSync,
  writeFileSync,
} from 'fs-extra'
import { join, extname, basename, dirname, joinSafe } from 'upath'
import { Context } from '@nuxt/types'
import { sync, Options } from 'fast-glob'
import Zipper from 'adm-zip'
import { FileStat, WebDAVClient } from 'webdav/web'
import { MeetingFile } from '~/types'

export default function (
  { $getPrefs, $log, store, $appPath, $dayjs, i18n }: Context,
  inject: (argument0: string, argument1: unknown) => void
) {
  // Paths
  inject('pubPath', (file?: MeetingFile) => {
    const pubPath = join($appPath(), 'Publications', $getPrefs('media.lang'))
    ensureDirSync(pubPath)
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
      return join(pubPath, pubFolder, issueFolder, trackFolder)
    } else {
      return pubPath
    }
  })

  function mediaPath(file?: MeetingFile) {
    const mediaPath = join(
      $getPrefs('app.localOutputPath'),
      $getPrefs('media.lang')
    )
    ensureDirSync(mediaPath)
    if (file)
      return join(mediaPath, file.folder as string, file.destFilename as string)
    return mediaPath
  }
  inject('mediaPath', mediaPath)

  inject('wtFontPath', async () => {
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

  inject('ytPath', (lang?: string) => {
    return join(
      $appPath(),
      'Publications',
      lang ?? $getPrefs('media.lang'),
      `yeartext-${lang ?? $getPrefs('media.lang')}-${new Date()
        .getFullYear()
        .toString()}`
    )
  })

  // Improved fs/glob functions
  inject('findOne', (path: string | string[], options?: Options) => {
    return sync(path, options)[0]
  })

  inject('findAll', (path: string | string[], options?: Options) => {
    const results = sync(path, options)
    $log.debug(path, results)
    return results
  })

  inject('rm', (files: string | string[]) => {
    if (!Array.isArray(files)) files = [files]
    files.forEach((file) => removeSync(file))
  })

  inject('write', (file: string, data: string | NodeJS.ArrayBufferView) => {
    ensureFileSync(file)
    writeFileSync(file, data)
  })

  inject('copy', (src: string, dest: string) => {
    ensureFileSync(dest)
    copyFileSync(src, dest)
  })

  function rename(
    path: string,
    oldName: string,
    newName: string,
    action: string = 'rename',
    type: string = 'string'
  ) {
    if (existsSync(path)) {
      const dir = dirname(path)
      const file = basename(path)
      switch (action) {
        case 'rename':
          if (type === 'date') {
            const date = $dayjs(file, oldName)
            if (date.isValid())
              renameSync(join(dir, file), join(dir, date.format(newName)))
          } else if (file === oldName) {
            renameSync(join(dir, file), join(dir, newName))
          }
          break
        case 'replace':
          if (file.includes(oldName)) {
            renameSync(
              join(dir, file),
              join(dir, file.replace(oldName, newName))
            )
          }
          break
        default:
          throw new Error('Invalid type for renameAll() function: ' + type)
      }
    }
  }

  inject('rename', rename)

  inject(
    'renameAll',
    (
      dir: string,
      search: string,
      newName: string,
      action: string = 'rename',
      type: string = 'string'
    ) => {
      if (existsSync(dir)) {
        readdirSync(dir).forEach((file) => {
          rename(join(dir, file), search, newName, action, type)
        })
      }
    }
  )

  inject('renamePubs', async (oldVal: string, newVal: string) => {
    readdirSync(mediaPath()).forEach((dir) => {
      const date = $dayjs(
        dir,
        $getPrefs('app.outputFolderDateFormat') as string,
        oldVal.split('-')[0]
      )
      if (date.isValid()) {
        readdirSync(join(mediaPath(), dir)).forEach((file) => {
          renameSync(
            join(mediaPath(), dir, file),
            join(
              mediaPath(),
              dir,
              file
                .replace(
                  (' - ' + i18n.t('song', oldVal)) as string,
                  (' - ' + i18n.t('song', newVal)) as string
                )
                .replace(
                  (' - ' + i18n.t('paragraph', oldVal)) as string,
                  (' - ' + i18n.t('paragraph', newVal)) as string
                )
            )
          )
        })
        const newPath = join(
          mediaPath(),
          date
            .locale(newVal.split('-')[0])
            .format($getPrefs('app.outputFolderDateFormat') as string)
        )
        if (!existsSync(newPath)) {
          renameSync(join(mediaPath(), dir), newPath)
        }
      }
    })

    const client = store.state.cong.client as WebDAVClient
    if (client) {
      for (const file of store.state.cong.contents as FileStat[]) {
        if (
          file.basename.includes((' - ' + i18n.t('song', oldVal)) as string)
        ) {
          await client.moveFile(
            file.filename,
            file.filename.replace(
              (' - ' + i18n.t('song', oldVal)) as string,
              (' - ' + i18n.t('song', newVal)) as string
            )
          )
        } else if (
          file.basename.includes(
            (' - ' + i18n.t('paragraph', oldVal)) as string
          )
        ) {
          await client.moveFile(
            file.filename,
            file.filename.replace(
              (' - ' + i18n.t('paragraph', oldVal)) as string,
              (' - ' + i18n.t('paragraph', newVal)) as string
            )
          )
        } else if (file.type === 'directory') {
          const date = $dayjs(
            file.basename,
            $getPrefs('app.outputFolderDateFormat') as string,
            oldVal.split('-')[0]
          )

          const newName = file.filename.replace(
            file.basename,
            date
              .locale(newVal)
              .format($getPrefs('app.outputFolderDateFormat') as string)
          )
          if (date.isValid() && newName !== file.filename) {
            const contents = store.state.cong.contents as FileStat[]
            if (!contents.find(({filename}) => filename === newName)) {
              await client.moveFile(file.filename, newName)
            }
          }
        }
      }
    }
  })

  inject('isVideo', (filepath: string) => {
    return ['mov', 'mp4', 'mpeg', 'mpg', 'ogg', 'ogv', 'webm'].includes(
      extname(filepath).slice(1).toLowerCase()
    )
  })

  inject('isImage', (filepath: string) => {
    return ['jpg', 'png', 'gif', 'jpeg', 'svg'].includes(
      extname(filepath).slice(1).toLowerCase()
    )
  })

  inject('isAudio', (filepath: string) => {
    return ['mp3', 'ogg', 'wav'].includes(
      extname(filepath).slice(1).toLowerCase()
    )
  })

  inject('sanitize', (name: string, isFile: boolean = false) => {
    const ext = isFile ? extname(name).toLowerCase() : ''

    // Remove special characters from filename
    name =
      basename(name, ext)
        // eslint-disable-next-line no-control-regex
        .replace(/["»“”‘’'«(){}№+[\]$<>,/\\:*\x00-\x1F\x80-\x9F]/g, '')
        .replace(/ *[—?;:|.!?] */g, ' - ')
        .replace(/\u00A0/g, ' ')
        .trim()
        .replace(/[ -]+$/g, '') + ext

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
      while (currentBytes > 200) {
        name = basename(name, ext).slice(0, -1).trim() + ext
        currentBytes = Buffer.byteLength(name, 'utf8')
      }
    }

    return name
  })

  // Zipper functions
  inject('extractAllTo', (zip: string, file: string, dest: string) => {
    const zipFile = new Zipper(zip).readFile(file)
    if (zipFile) new Zipper(zipFile).extractAllTo(dest)
  })

  inject('getZipContentsByExt', (zip: string, ext: string) => {
    const contents = new Zipper(zip).readFile('contents')
    if (contents) {
      const entryName = new Zipper(contents)
        .getEntries()
        .filter((entry) => extname(entry.entryName) === ext)[0].entryName
      return new Zipper(contents).readFile(entryName)
    }
    return contents
  })

  inject('getZipContentsByName', (zip: string, name: string) => {
    const contents = new Zipper(zip).readFile('contents')
    if (contents) {
      const entryName = new Zipper(contents)
        .getEntries()
        .filter((entry) => entry.name === name)[0].entryName
      return new Zipper(contents).readFile(entryName)
    }
    return contents
  })
}
