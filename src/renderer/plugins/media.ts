/* eslint-disable import/named */
import { pathToFileURL } from 'url'
import { Dayjs } from 'dayjs'
import { ipcRenderer } from 'electron'
import { Plugin } from '@nuxt/types'
import { emptyDirSync, existsSync, readFileSync, statSync } from 'fs-extra'
import { NuxtAxiosInstance } from '@nuxtjs/axios'
import { basename, changeExt, extname, join, resolve } from 'upath'
import { Database } from 'sql.js'
import {
  MS_IN_SEC,
  HUNDRED_PERCENT,
  JAN_2008,
  MAX_PREFIX_LENGTH,
} from './../constants/general'
import { ImageFile, MeetingFile, VideoFile } from './../types/media.d'
import {
  MediaFile,
  MediaItemResult,
  MultiMediaExtract,
  MultiMediaItem,
  Publication,
  ShortJWLang,
  SmallMediaFile,
  MultiMediaExtractRef,
} from '~/types'

const plugin: Plugin = (
  {
    $pubPath,
    $pubMedia,
    $findAll,
    $log,
    $warn,
    $mediaPath,
    $axios,
    $rename,
    $setDb,
    $copy,
    $extractAllTo,
    $getPrefs,
    $mediaItems,
    $translate,
    $write,
    $findOne,
    $error,
    $getLocalJWLangs,
    $getDb,
    $getZipContentsByExt,
    $isVideo,
    $isImage,
    $query,
    $dayjs,
    $sanitize,
    store,
  },
  inject
) => {
  async function extractMediaItems(
    extract: MultiMediaExtract,
    setProgress?: (loaded: number, total: number, global?: boolean) => void
  ): Promise<MeetingFile[]> {
    extract.Lang = $getPrefs('media.lang') as string
    if (extract.Link) {
      try {
        const matches = extract.Link.match(/\/(.*)\//)
        if (matches && matches.length > 0) {
          extract.Lang = (matches.pop() as string).split(':')[0]
        }
      } catch (e: unknown) {
        $log.error(e)
      }
    }

    const symbol = extract.UniqueEnglishSymbol.replace(/\d/g, '')

    // Exclude the "old new songs" songbook, as we don't need images from that
    if (symbol !== 'snnw') {
      const extractDb = await getDbFromJWPUB(
        symbol,
        extract.IssueTagNumber,
        setProgress
      )
      if (extractDb) {
        return (
          await getDocumentMultiMedia(
            extractDb,
            null,
            extract.RefMepsDocumentId
          )
        )
          .filter((mmItem) => {
            if (
              mmItem?.queryInfo?.tableQuestionIsUsed &&
              mmItem.queryInfo.NextParagraphOrdinal &&
              !mmItem?.queryInfo?.TargetParagraphNumberLabel
            ) {
              mmItem.BeginParagraphOrdinal =
                mmItem.queryInfo.NextParagraphOrdinal
            }

            // Include videos with no specific paragraph for sign language, as they are sometimes used (ie the CBS chapter video)
            if (
              (
                $getLocalJWLangs().find(
                  (lang) => lang.langcode === $getPrefs('media.lang')
                ) as ShortJWLang
              ).isSignLanguage &&
              !!mmItem?.queryInfo?.FilePath &&
              $isVideo(mmItem?.queryInfo?.FilePath) &&
              !mmItem?.queryInfo?.TargetParagraphNumberLabel
            ) {
              return true
            } else if (
              mmItem.BeginParagraphOrdinal &&
              extract.RefBeginParagraphOrdinal &&
              extract.RefEndParagraphOrdinal
            ) {
              return (
                extract.RefBeginParagraphOrdinal <=
                  mmItem.BeginParagraphOrdinal &&
                mmItem.BeginParagraphOrdinal <= extract.RefEndParagraphOrdinal
              )
            } else {
              return true
            }
          })
          .map((mmItem) => {
            mmItem.BeginParagraphOrdinal = extract.BeginParagraphOrdinal
            return mmItem
          })
      }
    }
    return []
  }

  async function getDocumentExtract(
    db: Database,
    docId: number,
    setProgress?: (loaded: number, total: number, global?: boolean) => void
  ): Promise<MeetingFile[]> {
    const songPub = store.state.media.songPub as string
    const excludeTh = $getPrefs('media.excludeTh')
    let extractMultimediaItems: MeetingFile[] = []
    const extracts = $query(
      db,
      `SELECT DocumentExtract.BeginParagraphOrdinal,DocumentExtract.EndParagraphOrdinal,DocumentExtract.DocumentId,
        Extract.RefMepsDocumentId,Extract.RefPublicationId,Extract.RefMepsDocumentId,UniqueEnglishSymbol,IssueTagNumber,
        Extract.RefBeginParagraphOrdinal,Extract.RefEndParagraphOrdinal, Extract.Link
      FROM DocumentExtract
        INNER JOIN Extract ON DocumentExtract.ExtractId = Extract.ExtractId
        INNER JOIN RefPublication ON Extract.RefPublicationId = RefPublication.RefPublicationId
        INNER JOIN Document ON DocumentExtract.DocumentId = Document.DocumentId
      WHERE DocumentExtract.DocumentId = ${docId}
        ${songPub === 'sjjm' ? "AND NOT UniqueEnglishSymbol = 'sjj' " : ''}
        AND NOT UniqueEnglishSymbol = 'mwbr'
        ${excludeTh ? "AND NOT UniqueEnglishSymbol = 'th' " : ''}
      ORDER BY DocumentExtract.BeginParagraphOrdinal`
    ) as MultiMediaExtract[]

    const promises: Promise<MeetingFile[]>[] = []

    extracts.forEach((extract) => {
      promises.push(extractMediaItems(extract, setProgress))
    })

    const result = await Promise.allSettled(promises)

    result.forEach((mediaItems) => {
      if (mediaItems.status === 'fulfilled') {
        extractMultimediaItems = extractMultimediaItems.concat(mediaItems.value)
      }
    })

    return extractMultimediaItems
  }

  async function addMediaItemToPart(
    date: string,
    par: number,
    media: MeetingFile,
    source?: string
  ): Promise<void> {
    const mediaList = (await store.dispatch('media/get', {
      date,
      par,
    })) as MeetingFile[]

    media.uniqueId = [par, source, media.checksum, media.filepath]
      .filter(Boolean)
      .toString()

    if (
      !media.uniqueId ||
      (!mediaList
        .flat()
        .map((item) => item.uniqueId)
        .filter(Boolean)
        .includes(media.uniqueId) &&
        !mediaList
          .flat()
          .map((item) => item.checksum)
          .filter(Boolean)
          .includes(media.checksum))
    ) {
      media.folder = date
      store.commit('media/set', {
        date,
        par,
        media,
      })
    }
  }

  async function processMultiMediaItem(
    db: Database,
    mmItem: MultiMediaItem,
    targetParNrExists: boolean,
    silent: boolean,
    keySymbol: string,
    issueTagNumber: string,
    memOnly: boolean
  ) {
    if (targetParNrExists) {
      const result = $query(
        db,
        `SELECT TargetParagraphNumberLabel From Question WHERE DocumentId = ${mmItem.DocumentId} AND TargetParagraphOrdinal = ${mmItem.BeginParagraphOrdinal}`
      )
      if (result.length === 1) Object.assign(mmItem, result[0])
      if (
        (
          $query(db, 'SELECT COUNT(*) as Count FROM Question') as {
            Count: number
          }[]
        )[0].Count > 0
      ) {
        mmItem.tableQuestionIsUsed = true
        const result = $query(
          db,
          `SELECT TargetParagraphNumberLabel, TargetParagraphOrdinal From Question WHERE DocumentId = ${mmItem.DocumentId} AND TargetParagraphOrdinal > ${mmItem.BeginParagraphOrdinal} LIMIT 1`
        ) as {
          TargetParagraphNumberLabel: string
          TargetParagraphOrdinal: number
        }[]
        if (result.length > 0)
          mmItem.NextParagraphOrdinal = result[0].TargetParagraphOrdinal
      }
    }
    try {
      // Get Video file
      if (
        mmItem.MimeType.includes('audio') ||
        mmItem.MimeType.includes('video')
      ) {
        const json =
          ((
            await getMediaLinks(
              {
                pubSymbol: mmItem.KeySymbol as string,
                track: mmItem.Track as number,
                issue: (mmItem.IssueTagNumber as number)?.toString(),
                docId: mmItem.MultiMeps as number,
              },
              silent
            )
          )[0] as VideoFile) ?? {}
        json.queryInfo = mmItem
        json.BeginParagraphOrdinal = mmItem.BeginParagraphOrdinal
        return json as VideoFile
      } else {
        if (!mmItem.KeySymbol) {
          mmItem.KeySymbol = keySymbol
          mmItem.IssueTagNumber = +issueTagNumber
          if (!memOnly) {
            mmItem.LocalPath = join(
              $pubPath(),
              mmItem.KeySymbol as string,
              mmItem.IssueTagNumber.toString(),
              '0',
              mmItem.FilePath
            )
          }
        }
        mmItem.FileName = $sanitize(
          mmItem.Caption.length > mmItem.Label.length
            ? mmItem.Caption
            : mmItem.Label
        )
        const picture = {
          BeginParagraphOrdinal: mmItem.BeginParagraphOrdinal,
          title: mmItem.FileName,
          queryInfo: mmItem,
          filepath: memOnly ? undefined : mmItem.LocalPath,
          filesize: memOnly
            ? undefined
            : statSync(mmItem.LocalPath as string).size,
        } as ImageFile

        return picture
      }
    } catch (e: unknown) {
      $warn(
        'errorJwpubMediaExtract',
        {
          identifier: `${keySymbol}-${issueTagNumber}`,
        },
        e
      )
    }
    return null
  }

  async function getDocumentMultiMedia(
    db: Database,
    docId: number | null,
    mepsId?: number,
    memOnly?: boolean,
    silent?: boolean
  ): Promise<MeetingFile[]> {
    const result = $query(
      db,
      "SELECT * FROM sqlite_master WHERE type='table' AND name='DocumentMultimedia'"
    )

    const mmTable = result.length === 0 ? 'Multimedia' : 'DocumentMultimedia'

    const keySymbol = (
      $query(db, 'SELECT UniqueEnglishSymbol FROM Publication') as {
        UniqueEnglishSymbol: string
      }[]
    )[0].UniqueEnglishSymbol.replace(/\d*/g, '') as string

    const issueTagNumber = (
      $query(db, 'SELECT IssueTagNumber FROM Publication') as {
        IssueTagNumber: string
      }[]
    )[0].IssueTagNumber

    const targetParNrExists = (
      $query(db, "PRAGMA table_info('Question')") as { name: string }[]
    )
      .map((item) => item.name)
      .includes('TargetParagraphNumberLabel')

    const suppressZoomExists = (
      $query(db, "PRAGMA table_info('Multimedia')") as { name: string }[]
    )
      .map((item) => item.name)
      .includes('SuppressZoom') as boolean

    const mmItems: MeetingFile[] = []

    const excludeLffi = $getPrefs('media.excludeLffi')
    const excludeLffiImages = $getPrefs('media.excludeLffiImages')

    if (!(keySymbol === 'lffi' && excludeLffi && excludeLffiImages)) {
      let select = `SELECT ${mmTable}.DocumentId, ${mmTable}.MultimediaId, Multimedia.MimeType, Multimedia.DataType, Multimedia.MajorType, Multimedia.FilePath, Multimedia.Label, Multimedia.Caption, Multimedia.CategoryType`
      let from = `FROM ${mmTable} INNER JOIN Document ON ${mmTable}.DocumentId = Document.DocumentId`
      let where = `WHERE ${
        docId || docId === 0
          ? `${mmTable}.DocumentId = ${docId}`
          : `Document.MepsDocumentId = ${mepsId}`
      }`
      let groupAndSort = ''

      if (mmTable === 'DocumentMultimedia') {
        select += `, ${mmTable}.BeginParagraphOrdinal, ${mmTable}.EndParagraphOrdinal, Multimedia.KeySymbol, Multimedia.MepsDocumentId AS MultiMeps, Document.MepsDocumentId, Multimedia.Track, Multimedia.IssueTagNumber`
        from += ` INNER JOIN Multimedia ON Multimedia.MultimediaId = ${mmTable}.MultimediaId`
        groupAndSort = `GROUP BY ${mmTable}.MultimediaId ORDER BY BeginParagraphOrdinal`

        if (targetParNrExists) {
          select += `, Question.TargetParagraphNumberLabel`
          from += ` LEFT JOIN Question ON Question.DocumentId = ${mmTable}.DocumentId AND Question.TargetParagraphOrdinal = ${mmTable}.BeginParagraphOrdinal`
        }
      }

      if (suppressZoomExists) {
        select += `, Multimedia.SuppressZoom`
        where += ` AND Multimedia.SuppressZoom <> 1`
      }

      const lffiString = `(Multimedia.MimeType LIKE '%video%' OR Multimedia.MimeType LIKE '%audio%')`
      const lffiImgString = `(Multimedia.MimeType LIKE '%image%' AND Multimedia.CategoryType <> 6 AND Multimedia.CategoryType <> 9 AND Multimedia.CategoryType <> 10 AND Multimedia.CategoryType <> 25)`

      if (keySymbol !== 'lffi')
        where += ` AND (${lffiString} OR ${lffiImgString})`
      if (keySymbol === 'lffi') {
        if (!excludeLffi && !excludeLffiImages) {
          where += ` AND (${lffiString} OR ${lffiImgString})`
        } else if (!excludeLffi) {
          where += ` AND ${lffiString}`
        } else if (!excludeLffiImages) {
          where += ` AND ${lffiImgString}`
        }
      }

      const promises: Promise<VideoFile | ImageFile | null>[] = []

      const items = $query(
        db,
        `${select} ${from} ${where} ${groupAndSort}`
      ) as MultiMediaItem[]

      items.forEach((mmItem) => {
        promises.push(
          processMultiMediaItem(
            db,
            mmItem,
            targetParNrExists,
            !!silent,
            keySymbol,
            issueTagNumber,
            !!memOnly
          )
        )
      })

      const results = await Promise.allSettled(promises)
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          if (result.value) {
            mmItems.push(result.value)
          }
        }
      })
    }
    return mmItems
  }
  inject('getDocumentMultiMedia', getDocumentMultiMedia)

  async function getAdditionalData(item: SmallMediaFile, id: string) {
    const result = (await $mediaItems.$get(
      `${$getPrefs('media.lang')}/${id}_VIDEO`
    )) as MediaItemResult

    if (result?.media?.length > 0) {
      item.thumbnail = result?.media[0]?.images?.wss?.sm
      item.primaryCategory = result?.media[0]?.primaryCategory
    }
  }

  async function getMediaLinks(
    mediaItem: {
      pubSymbol: string
      docId?: number
      track?: number
      issue?: string
      format?: string
      lang?: string
    },
    silent?: boolean
  ): Promise<SmallMediaFile[]> {
    if (mediaItem.lang) {
      $log.debug(mediaItem)
      $log.debug($getPrefs('media.lang'))
    }
    let mediaFiles: MediaFile[] = []
    let smallMediaFiles: SmallMediaFile[] = []

    try {
      // From 2008 onward the watchtower has a public and study release
      if (
        mediaItem.pubSymbol === 'w' &&
        mediaItem.issue &&
        parseInt(mediaItem.issue) >= JAN_2008 &&
        mediaItem.issue.toString().slice(-2) === '01'
      ) {
        mediaItem.pubSymbol = 'wp'
      }

      // Set correct song publication (e.g. sjj for sign language)
      if (mediaItem.pubSymbol === 'sjjm') {
        mediaItem.pubSymbol = store.state.media.songPub
      }

      const mediaLang = mediaItem.lang || $getPrefs('media.lang')

      // Get publication from jw api
      let result = null

      const params: any = {}
      if (mediaItem.pubSymbol) {
        params.pub = mediaItem.pubSymbol
        params.issue = mediaItem.issue
        params.track = mediaItem.track
        params.fileformat = mediaItem.format
      } else {
        params.docid = mediaItem.docId
      }
      params.langwritten = mediaLang

      try {
        result = await $pubMedia.get('', {
          params,
        })
      } catch (e: unknown) {
        $log.debug(params, mediaItem)
        try {
          result = await $pubMedia.get('', {
            params: {
              pub: mediaItem.pubSymbol + 'm',
              track: mediaItem.track,
              issue: mediaItem.issue,
              fileformat: mediaItem.format,
              langwritten: mediaLang,
            },
          })
        } catch (e: unknown) {
          $log.debug(`pub: ${mediaItem.pubSymbol + 'm'}`, mediaItem)
          try {
            result = await $pubMedia.get('', {
              params: {
                pub: mediaItem.pubSymbol.slice(0, -1),
                track: mediaItem.track,
                issue: mediaItem.issue,
                fileformat: mediaItem.format,
                langwritten: mediaLang,
              },
            })
          } catch (e: unknown) {
            $log.debug(`pub: ${mediaItem.pubSymbol.slice(0, -1)}`, mediaItem)
          }
        }
      }

      const publication = result?.data as Publication
      if (publication?.files) {
        const categories = Object.values(publication.files)[0]
        mediaFiles = categories.MP4 ?? Object.values(categories)[0]

        // Filter on max resolution
        mediaFiles = mediaFiles.filter((file) => {
          return (
            parseRes(file.label) <=
            parseRes($getPrefs('media.maxRes') as string)
          )
        })

        const mappedFiles = new Map(
          mediaFiles.map((file) => [file.title, file])
        )

        // Keep highest resolution of each media file without subtitles
        mediaFiles.forEach((item) => {
          const file = mappedFiles.get(item.title)
          if (file) {
            const { label, subtitled } = file
            if (
              (parseRes(item.label) - parseRes(label) ||
                +!!subtitled - +!!item.subtitled) > 0
            )
              mappedFiles.set(item.title, item)
          }
        })

        smallMediaFiles = Array.from(mappedFiles.values()).map(
          ({
            title,
            file,
            filesize,
            duration,
            trackImage,
            track,
            pub,
            markers,
          }) => {
            return {
              title,
              issue: mediaItem.issue,
              url: file.url,
              checksum: file.checksum,
              filesize,
              duration,
              trackImage: trackImage.url,
              track,
              pub,
              markers,
            }
          }
        ) as SmallMediaFile[]

        const promises: Promise<void>[] = []

        // Get thumbnail and primaryCategory
        smallMediaFiles.forEach((item) => {
          if (item.duration > 0 && (!item.trackImage || !item.pub)) {
            const id = mediaItem.docId
              ? `docid-${mediaItem.docId}_1`
              : `pub-${[
                  mediaItem.pubSymbol,
                  mediaItem.issue?.toString().replace(/(\d{6})00$/gm, '$1'),
                  mediaItem.track,
                ]
                  .filter(Boolean)
                  .join('_')}`

            promises.push(getAdditionalData(item, id))
          }
        })

        await Promise.allSettled(promises)
      } else if (!silent) {
        $warn('infoPubIgnored', {
          identifier: Object.values(mediaItem).filter(Boolean).join('_'),
        })
      }
    } catch (e: unknown) {
      if (silent) {
        $log.warn(e)
      } else {
        $warn(
          'infoPubIgnored',
          {
            identifier: Object.values(mediaItem).filter(Boolean).join('_'),
          },
          e
        )
      }
    }
    $log.debug(smallMediaFiles)
    return smallMediaFiles
  }
  inject('getMediaLinks', getMediaLinks)

  function parseRes(res?: string): number {
    if (!res) return 0
    return +res.replace(/\D/g, '')
  }

  async function getDbFromJWPUB(
    pub?: string,
    issue?: string,
    setProgress?: (loaded: number, total: number, global?: boolean) => void,
    localPath = ''
  ): Promise<Database | null> {
    let db: Database | null
    try {
      // Extract db from local JWPUB file
      if (localPath) {
        db = (await $getDb({
          pub,
          issue,
          file: $getZipContentsByExt(localPath, '.db') ?? undefined,
        })) as Database

        try {
          const jwpubInfo: {
            UniqueEnglishSymbol: string
            IssueTagNumber: string
          } = (
            $query(
              db,
              'SELECT UniqueEnglishSymbol, IssueTagNumber FROM Publication'
            ) as { UniqueEnglishSymbol: string; IssueTagNumber: string }[]
          )[0]
          pub = jwpubInfo.UniqueEnglishSymbol.replace(/\d/g, '')
          issue = jwpubInfo.IssueTagNumber
          $setDb(pub, issue, db)
        } catch (e: unknown) {
          $log.error(e)
        }
      } else if (pub) {
        const jwpub = (
          await getMediaLinks({
            pubSymbol: pub,
            issue,
            format: 'JWPUB',
          })
        )[0] as VideoFile
        if (jwpub) {
          await downloadIfRequired(jwpub, setProgress)
          db = await $getDb({
            pub,
            issue,
            file: readFileSync($findOne(join($pubPath(jwpub), '*.db'))),
          })
        } else {
          return null
        }
      } else return null
    } catch (e: unknown) {
      $warn('errorJwpubDbFetch', { identifier: `${pub}-${issue}` }, e)
      return null
    }
    return db
  }

  inject('getDbFromJWPUB', getDbFromJWPUB)

  async function downloadIfRequired(
    file: VideoFile,
    setProgress?: (loaded: number, total: number, global?: boolean) => void
  ): Promise<string> {
    // Set extra properties
    file.downloadRequired = true
    file.cacheFilename = basename(file.url || '') || file.safeName
    file.cacheDir = $pubPath(file) as string
    file.cacheFile = join(file.cacheDir, file.cacheFilename as string)
    file.destFilename = file.folder ? file.safeName : file.cacheFilename
    if (existsSync(file.cacheFile)) {
      file.downloadRequired = file.filesize !== statSync(file.cacheFile).size
    }

    if (file.downloadRequired) {
      if (extname(file.cacheFile) === '.jwpub') {
        emptyDirSync(file.cacheDir)
      }
      const downloadedFile = Buffer.from(
        new Uint8Array(
          await ($axios as NuxtAxiosInstance).$get(file.url, {
            responseType: 'arraybuffer',
            onDownloadProgress: (progressEvent) => {
              if (setProgress) {
                setProgress(progressEvent.loaded, progressEvent.total)
              }
            },
          })
        )
      )

      $write(file.cacheFile, downloadedFile)

      if (file.folder) {
        const filePath = $mediaPath(file)
        if (filePath) $write(filePath, downloadedFile)
      }
      store.commit('stats/setDownloads', {
        origin: 'jworg',
        source: 'live',
        file,
      })
      if (extname(file.cacheFile) === '.jwpub') {
        $extractAllTo(file.cacheFile, 'contents', file.cacheDir)
      }
    } else {
      if (file.folder) {
        const filePath = $mediaPath(file)
        if (filePath) $copy(file.cacheFile, filePath)
      }
      store.commit('stats/setDownloads', {
        origin: 'jworg',
        source: 'cache',
        file,
      })
    }
    return file.cacheFile
  }

  inject('downloadIfRequired', downloadIfRequired)

  async function processInternalRefs(
    db: Database,
    ref: MultiMediaExtractRef,
    date: string
  ) {
    const promises: Promise<void>[] = []

    const refMedia = await getDocumentMultiMedia(db, ref.DocumentId)

    refMedia.forEach((refMediaFile) => {
      promises.push(
        addMediaItemToPart(
          date,
          ref.BeginParagraphOrdinal,
          refMediaFile,
          'internal'
        )
      )
    })

    await Promise.allSettled(promises)
  }

  inject(
    'getMwMedia',
    async (
      date: string,
      setProgress?: (loaded: number, total: number, global?: boolean) => void
    ): Promise<void> => {
      const mwDay = $dayjs(
        date,
        $getPrefs('app.outputFolderDateFormat') as string
      )
      const baseDate = mwDay.startOf('week')

      let issue = baseDate.format('YYYYMM') + '00'
      if (parseInt(baseDate.format('M')) % 2 === 0) {
        issue = baseDate.subtract(1, 'month').format('YYYYMM') + '00'
      }

      // Get document id of this weeks mwb issue
      const db = (await getDbFromJWPUB('mwb', issue, setProgress)) as Database
      if (!db) throw new Error(`No MW media data found for ${date}!`)
      const docId = (
        $query(
          db,
          `SELECT DocumentId FROM DatedText WHERE FirstDateOffset = ${baseDate.format(
            'YYYYMMDD'
          )}`
        ) as { DocumentId: number }[]
      )[0].DocumentId

      // Get document multimedia and add them to the media list
      const mms = await getDocumentMultiMedia(db, docId)
      const promises: Promise<void>[] = []

      mms.forEach((mm) => {
        promises.push(
          addMediaItemToPart(
            date,
            mm.BeginParagraphOrdinal as number,
            mm,
            'internal'
          )
        )
      })

      // Get document extracts and add them to the media list
      const extracts = await getDocumentExtract(db, docId, setProgress)

      extracts.forEach((extract) => {
        promises.push(
          addMediaItemToPart(
            date,
            extract.BeginParagraphOrdinal as number,
            extract,
            'external'
          )
        )
      })

      // Get document multimedia of internal references
      const internalRefs = $query(
        db,
        `SELECT DocumentInternalLink.DocumentId AS SourceDocumentId, DocumentInternalLink.BeginParagraphOrdinal, Document.DocumentId FROM DocumentInternalLink INNER JOIN InternalLink ON DocumentInternalLink.InternalLinkId = InternalLink.InternalLinkId INNER JOIN Document ON InternalLink.MepsDocumentId = Document.MepsDocumentId WHERE DocumentInternalLink.DocumentId = ${docId} AND Document.Class <> 94`
      ) as MultiMediaExtractRef[]

      internalRefs.forEach((ref) => {
        promises.push(processInternalRefs(db, ref, date))
      })

      await Promise.allSettled(promises)
    }
  )

  inject(
    'getWeMedia',
    async (
      date: string,
      setProgress?: (loaded: number, total: number, global?: boolean) => void
    ): Promise<void> => {
      const weDay = $dayjs(
        date,
        $getPrefs('app.outputFolderDateFormat') as string
      )
      const baseDate = weDay.startOf('week')

      // Get week nr from db
      const getWeekNr = (database: Database) => {
        if (!db) return -1
        return $query(
          database,
          'SELECT FirstDateOffset FROM DatedText'
        ).findIndex((weekItem: any) => {
          return $dayjs(
            weekItem.FirstDateOffset.toString(),
            'YYYYMMDD'
          ).isBetween(baseDate, baseDate.add(6, 'days'), null, '[]')
        })
      }

      // eslint-disable-next-line no-magic-numbers
      let issue = baseDate.subtract(8, 'weeks').format('YYYYMM') + '00'
      let db = (await getDbFromJWPUB('w', issue, setProgress)) as Database
      let weekNr = getWeekNr(db)

      if (weekNr < 0) {
        // eslint-disable-next-line no-magic-numbers
        issue = baseDate.subtract(9, 'weeks').format('YYYYMM') + '00'
        db = (await getDbFromJWPUB('w', issue, setProgress)) as Database
        weekNr = getWeekNr(db)
      }
      if (weekNr < 0) throw new Error(`No WE meeting data found for ${date}!`)

      const docId = (
        $query(
          db,
          `SELECT Document.DocumentId FROM Document WHERE Document.Class=40 LIMIT 1 OFFSET ${weekNr}`
        ) as { DocumentId: number }[]
      )[0].DocumentId

      const images = $query(
        db,
        `SELECT DocumentMultimedia.MultimediaId,Document.DocumentId, Multimedia.CategoryType,Multimedia.KeySymbol,Multimedia.Track,Multimedia.IssueTagNumber,Multimedia.MimeType, DocumentMultimedia.BeginParagraphOrdinal,Multimedia.FilePath,Label,Caption, Question.TargetParagraphNumberLabel
    FROM DocumentMultimedia
      INNER JOIN Document ON Document.DocumentId = DocumentMultimedia.DocumentId
      INNER JOIN Multimedia ON DocumentMultimedia.MultimediaId = Multimedia.MultimediaId
      LEFT JOIN Question ON Question.DocumentId = DocumentMultimedia.DocumentId AND Question.TargetParagraphOrdinal = DocumentMultimedia.BeginParagraphOrdinal
    WHERE Document.DocumentId = ${docId} AND Multimedia.CategoryType <> 9 GROUP BY DocumentMultimedia.MultimediaId`
      ) as MultiMediaItem[]

      const promises: Promise<void>[] = []

      images.forEach((img) => promises.push(addImgToPart(date, issue, img)))

      const songs = $query(
        db,
        `SELECT * FROM Multimedia INNER JOIN DocumentMultimedia ON Multimedia.MultimediaId = DocumentMultimedia.MultimediaId WHERE DataType = 2 ORDER BY BeginParagraphOrdinal LIMIT 2 OFFSET ${
          2 * weekNr
        }`
      ) as MultiMediaItem[]

      let songLangs = songs.map(() => $getPrefs('media.lang') as string)

      try {
        songLangs = (
          $query(
            db,
            `SELECT Extract.ExtractId, Extract.Link, DocumentExtract.BeginParagraphOrdinal FROM Extract INNER JOIN DocumentExtract ON Extract.ExtractId = DocumentExtract.ExtractId WHERE Extract.RefMepsDocumentClass = 31 ORDER BY Extract.ExtractId LIMIT 2 OFFSET ${
              2 * weekNr
            }`
          ) as {
            ExtractId: number
            Link: string
            BeginParagraphOrdinal: number
          }[]
        )
          .sort((a, b) => a.BeginParagraphOrdinal - b.BeginParagraphOrdinal)
          .map((item) => {
            const match = item.Link.match(/\/(.*)\//)
            if (match) {
              return (
                match.pop()?.split(':')[0] ??
                ($getPrefs('media.lang') as string)
              )
            } else {
              return $getPrefs('media.lang') as string
            }
          })
      } catch (e: unknown) {
        $log.error(e)
      }

      songs.forEach((song, i) => {
        promises.push(addSongToPart(date, songLangs, song, i))
      })

      await Promise.allSettled(promises)
    }
  )

  async function addImgToPart(
    date: string,
    issue: string,
    img: MultiMediaItem
  ): Promise<void> {
    if ($isImage(img.FilePath)) {
      const LocalPath = join($pubPath(), 'w', issue, '0', img.FilePath)
      const FileName = $sanitize(
        img.Caption.length > img.Label.length ? img.Caption : img.Label
      )
      const pictureObj = {
        title: FileName,
        filepath: LocalPath,
        filesize: statSync(LocalPath).size,
        queryInfo: img,
      } as ImageFile
      await addMediaItemToPart(date, 1, pictureObj)
    } else {
      const media = await getMediaLinks({
        pubSymbol: img.KeySymbol ?? '',
        track: img.Track as number,
        issue: img.IssueTagNumber?.toString(),
      })
      if (media?.length > 0) addMediaItemToPart(date, 1, media[0] as VideoFile)
    }
  }

  async function addSongToPart(
    date: string,
    songLangs: string[],
    song: MultiMediaItem,
    i: number
  ): Promise<void> {
    const songMedia = await getMediaLinks({
      pubSymbol: song.KeySymbol as string,
      track: song.Track as number,
      lang: songLangs[i],
    })
    if (songMedia?.length > 0) {
      const songObj = songMedia[0] as VideoFile
      songObj.queryInfo = song
      await addMediaItemToPart(date, 2 * i, songObj)
    } else {
      $error('errorGetWeMedia', new Error('No WE songs found!'))
    }
  }

  inject('createMediaNames', (): void => {
    store.commit('stats/startPerf', {
      func: 'createMediaNames',
      start: performance.now(),
    })
    const meetings = store.getters['media/meetings'] as Map<
      string,
      Map<number, MeetingFile[]>
    >

    meetings.forEach((parts) => {
      let i = 1
      const sorted = [...parts.entries()].sort((a, b) => a[0] - b[0])

      sorted.forEach(([, media]) => {
        media
          .filter((m) => !m.safeName)
          .forEach((item, j) => {
            item.safeName = `${i.toString().padStart(2, '0')}-${(j + 1)
              .toString()
              .padStart(2, '0')} -`
            if (!item.congSpecific) {
              if (item.queryInfo?.TargetParagraphNumberLabel) {
                item.safeName += ` ${$translate('paragraph')} ${
                  item.queryInfo?.TargetParagraphNumberLabel
                } -`
              }
              if (item.pub?.includes('sjj')) {
                item.safeName += ` ${$translate('song')}`
              }
              item.safeName = $sanitize(
                `${item.safeName} ${item.title || ''}${extname(
                  item.url || item.filepath || ''
                )}`,
                true
              )
            }
          })
        i++
      })
    })
    $log.debug(meetings)
    store.commit('stats/stopPerf', {
      func: 'createMediaNames',
      stop: performance.now(),
    })
  })

  inject('syncLocalRecurringMedia', (baseDate: Dayjs): void => {
    const meetings = store.getters['media/meetings'] as Map<
      string,
      Map<number, MeetingFile[]>
    >
    const dates = [...meetings.keys()].filter((date) => {
      if (date === 'Recurring') return false
      const day = $dayjs(
        date,
        $getPrefs('app.outputFolderDateFormat') as string
      )
      return (
        day.isValid() &&
        day.isBetween(baseDate, baseDate.add(6, 'days'), null, '[]')
      )
    })
    $findAll(join($mediaPath(), 'Recurring', '*')).forEach(
      (recurringItem: string) => {
        dates.forEach((date) => {
          $copy(
            recurringItem,
            join($mediaPath(), date, basename(recurringItem))
          )
        })
      }
    )
  })

  let progress = 0
  let total = 0

  function initProgress(amount: number): void {
    progress = 0
    total = amount
  }

  function increaseProgress(
    setProgress: (loaded: number, total: number, global?: boolean) => void
  ): void {
    progress++
    setProgress(progress, total, true)
  }

  inject(
    'syncJWMedia',
    async (
      dryrun: boolean,
      baseDate: Dayjs,
      setProgress: (loaded: number, total: number, global?: boolean) => void
    ): Promise<void> => {
      const meetings = new Map(
        Array.from(
          store.getters['media/meetings'] as Map<
            string,
            Map<number, MeetingFile[]>
          >
        )
          .filter(([date, _parts]) => {
            if (date === 'Recurring') return false
            const dateObj = $dayjs(
              date,
              $getPrefs('app.outputFolderDateFormat') as string
            )
            return (
              dateObj.isValid() &&
              dateObj.isBetween(baseDate, baseDate.add(6, 'days'), null, '[]')
            )
          })
          .map(([date, parts]) => {
            const newParts = new Map(
              Array.from(parts).map(([part, media]) => {
                const newMedia = media.filter(
                  ({ congSpecific, hidden, isLocal }) =>
                    !congSpecific && !hidden && !isLocal // Filter out cong specific media, hidden media and local media
                )
                return [part, newMedia]
              })
            )
            return [date, newParts]
          })
      )

      let total = 0
      meetings.forEach((parts) =>
        parts.forEach((media) => (total += media.length))
      )

      initProgress(total)
      const promises: Promise<void>[] = []

      meetings.forEach((parts, date) => {
        parts.forEach((media) => {
          media.forEach((item) => {
            if (!dryrun) {
              promises.push(syncMediaItem(date, item, setProgress))
            }
          })
        })
      })

      await Promise.allSettled(promises)
    }
  )

  async function syncMediaItem(
    date: string,
    item: MeetingFile,
    setProgress: (loaded: number, total: number, global?: boolean) => void
  ): Promise<void> {
    if (item.filesize && (item.url || item.filepath)) {
      $log.info(
        `%c[jwOrg] [${date}] ${item.safeName}`,
        'background-color: #cce5ff; color: #004085;'
      )
      // Set markers for sign language videos
      const mediaPath = $mediaPath()
      if (item.markers && mediaPath) {
        const markers = Array.from(
          new Set(
            item.markers.markers.map(
              ({ duration, label, startTime, endTransitionDuration }) =>
                JSON.stringify({
                  duration,
                  label,
                  startTime,
                  endTransitionDuration,
                })
            )
          )
        ).map((m) => JSON.parse(m))
        $write(
          join(
            mediaPath,
            item.folder as string,
            changeExt(item.safeName as string, 'json')
          ),
          JSON.stringify(markers)
        )
      }

      // Prevent duplicates
      const duplicate = mediaPath
        ? $findOne(
            join(
              mediaPath,
              item.folder as string,
              '*' +
                item.safeName
                  ?.substring(MAX_PREFIX_LENGTH)
                  .replace('.svg', '.png')
            )
          )
        : null

      if (
        duplicate &&
        basename(duplicate) !== item.safeName &&
        (statSync(duplicate).size === item.filesize ||
          extname(item.safeName as string) === '.svg')
      ) {
        $rename(
          duplicate,
          basename(duplicate),
          (item.safeName as string).replace('.svg', '.png')
        )
      } else if (item.url) {
        await downloadIfRequired(
          JSON.parse(JSON.stringify(item as SmallMediaFile)),
          setProgress
        )
      } else if (item.filepath && item.folder && item.safeName) {
        const dest = join($mediaPath(), item.folder, item.safeName)
        if (!existsSync(dest) || statSync(dest).size !== item.filesize) {
          $copy(item.filepath, dest)
        }
      }
    } else {
      $warn(
        'warnFileNotAvailable',
        {
          persistent: true,
          identifier: [
            item.queryInfo?.KeySymbol,
            item.queryInfo?.Track,
            item.queryInfo?.IssueTagNumber,
          ]
            .filter(Boolean)
            .join('_'),
        },
        item
      )
    }
    increaseProgress(setProgress)
  }

  async function shuffleMusic(
    stop = false,
    immediately = false
  ): Promise<void> {
    if (stop) {
      ipcRenderer.removeAllListeners('videoProgress')
      ipcRenderer.removeAllListeners('videoEnd')

      if (store.state.media.songPub === 'sjjm') {
        const audio = document.querySelector(
          '#meetingMusic'
        ) as HTMLAudioElement

        if (!audio) return

        if (!immediately) {
          // Fade out audio
          const MS_TO_STOP = 3 * MS_IN_SEC // Let fadeout last 3 seconds
          const TOTAL_VOL = audio.volume
          while (audio.volume > 0) {
            audio.volume -= Math.min(
              audio.volume,
              (10 * TOTAL_VOL) / MS_TO_STOP
            )
            await new Promise((resolve) => setTimeout(resolve, 10))
          }
        }
        audio.remove()
      } else {
        ipcRenderer.send('hideMedia')
      }

      store.commit('media/setMusicFadeOut', '')
    } else {
      if ($getPrefs('meeting.enableMusicFadeOut')) {
        const now = $dayjs()
        if ($getPrefs('meeting.musicFadeOutType') === 'smart') {
          const today = now.day() === 0 ? 6 : now.day() - 1 // Day is 0 indexed and starts with Sunday
          if (
            today === $getPrefs('meeting.mwDay') ||
            today === $getPrefs('meeting.weDay')
          ) {
            // Set stop time depending on mw or we day
            let meetingStarts = null
            if (today === $getPrefs('meeting.mwDay')) {
              meetingStarts = (
                $getPrefs('meeting.mwStartTime') as string
              ).split(':')
            } else {
              meetingStarts = (
                $getPrefs('meeting.weStartTime') as string
              ).split(':')
            }
            const timeToStop = now
              .hour(+meetingStarts[0])
              .minute(+meetingStarts[1])
              .second(0)
              .millisecond(0)
              .subtract($getPrefs('meeting.musicFadeOutTime') as number, 's')
              .subtract(6, 's')

            if (timeToStop.isAfter(now)) {
              store.commit('media/setMusicFadeOut', timeToStop)
            }
          }
        } else {
          store.commit(
            'media/setMusicFadeOut',
            now.add($getPrefs('meeting.musicFadeOutTime') as number, 'm')
          )
        }
      }

      // Get songs from jw.org or from local cache
      const isOnline = store.state.stats.online && !$getPrefs('app.offline')
      const signLanguage =
        store.state.media.songPub === 'sjj' &&
        $getPrefs('media.enableMediaDisplayButton')

      let songPub = 'sjjm'
      let mediaFormat = 'mp4'
      let mediaLang = 'E'

      if (signLanguage) {
        songPub = 'sjj'
        mediaFormat = 'mp4'
        mediaLang = $getPrefs('media.lang') as string
      }

      const songs = (
        isOnline
          ? (
              (await getMediaLinks({
                pubSymbol: songPub,
                format: mediaFormat.toUpperCase(),
                lang: mediaLang,
              })) as VideoFile[]
            ).filter((item) => extname(item.url) === `.${mediaFormat}`)
          : $findAll(
              join(
                $pubPath(),
                '..',
                mediaLang,
                songPub,
                '**',
                `*.${mediaFormat}`
              )
            ).map((item) => ({
              title: basename(item),
              track: basename(resolve(item, '..')),
              path: item,
            }))
      ).sort(() => 0.5 - Math.random())

      if (signLanguage) {
        playSignLanguageSong(
          songs,
          0,
          !!store.state.media.musicFadeOut,
          isOnline
        )
      } else {
        createAudioElement(songs, 0, !!store.state.media.musicFadeOut, isOnline)
      }
    }
  }

  inject('shuffleMusic', shuffleMusic)

  async function playSignLanguageSong(
    songs: (VideoFile | { title: string; track: string; path: string })[],
    index: number,
    fadeOut: boolean,
    isOnline: boolean
  ) {
    if (!store.state.present.mediaScreenVisible) {
      ipcRenderer.send('toggleMediaWindowFocus')
    }

    const path = isOnline
      ? await downloadIfRequired(songs[index] as VideoFile)
      : (songs[index] as { title: string; track: string; path: string }).path

    ipcRenderer.on('videoProgress', (_e, progress) => {
      if (store.state.media.musicFadeOut && !fadeOut) {
        store.commit(
          'media/setMusicFadeOut',
          $dayjs.duration(progress[1] - progress[0], 's').format('mm:ss')
        )
      }
    })

    ipcRenderer.send('showMedia', { path })

    if (!fadeOut) {
      store.commit('media/setMusicFadeOut', '00:00')
    }

    ipcRenderer.on('videoEnd', () => {
      ipcRenderer.removeAllListeners('videoProgress')
      ipcRenderer.removeAllListeners('videoEnd')
      playSignLanguageSong(
        songs,
        index < songs.length - 1 ? ++index : 0,
        fadeOut,
        isOnline
      )
    })
  }

  async function createAudioElement(
    songs: (VideoFile | { title: string; track: string; path: string })[],
    index: number,
    fadeOut: boolean,
    isOnline: boolean
  ): Promise<void> {
    const audio = document.createElement('audio')
    audio.autoplay = true
    audio.id = 'meetingMusic'
    audio.setAttribute('track', songs[index]?.track.toString() ?? 'Unknown')
    audio.onended = () => {
      audio.remove()
      createAudioElement(
        songs,
        index < songs.length - 1 ? ++index : 0,
        fadeOut,
        isOnline
      )
    }
    audio.oncanplay = () => {
      audio.volume =
        ($getPrefs('meeting.musicVolume') as number) / HUNDRED_PERCENT
      if (!fadeOut) {
        store.commit('media/setMusicFadeOut', '00:00')
      }
    }
    audio.ontimeupdate = () => {
      const duration = $dayjs
        .duration(audio.duration - audio.currentTime, 's')
        .format('mm:ss')

      if (store.state.media.musicFadeOut && !fadeOut) {
        store.commit('media/setMusicFadeOut', duration)
      }
    }

    const source = document.createElement('source')
    source.type = 'audio/mpeg'
    if (isOnline) {
      source.src = pathToFileURL(
        await downloadIfRequired(songs[index] as VideoFile)
      ).href
    } else {
      source.src = pathToFileURL(
        (songs[index] as { title: string; track: string; path: string }).path
      ).href
    }
    audio.appendChild(source)
    document.body.appendChild(audio)
  }
}

export default plugin
