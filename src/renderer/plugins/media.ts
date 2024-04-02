/* eslint-disable import/named */
import { pathToFileURL } from 'url'
import {
  existsSync,
  readFileSync,
  statSync,
  emptyDirSync,
  writeJsonSync,
} from 'fs-extra'
import { Dayjs } from 'dayjs'
import { ipcRenderer } from 'electron'
import { Plugin } from '@nuxt/types'
import { basename, changeExt, extname, join, resolve } from 'upath'
import { Database } from 'sql.js'
import {
  MS_IN_SEC,
  THV_POSTER,
  JAN_2008,
  MAX_PREFIX_LENGTH,
  BIBLE_READING_PAR_NR,
  FEB_2023,
  KINGDOM_SONGS_MAX,
} from './../constants/general'
import {
  MediaFile,
  ImageFile,
  MeetingFile,
  VideoFile,
  MediaItemResult,
  MultiMediaExtract,
  MultiMediaItem,
  Publication,
  ShortJWLang,
  SmallMediaFile,
  MultiMediaExtractRef,
} from '~/types'
import { MEPS_IDS } from '~/constants/lang'
const MEPS_IDS_TYPED: { [key: string]: string } = MEPS_IDS as {
  [key: string]: string
}

const plugin: Plugin = (
  {
    $pubPath,
    $pubMedia,
    $findAll,
    $log,
    $isMeetingDay,
    $warn,
    $mediaPath,
    $axios,
    $rename,
    $setDb,
    $copy,
    $strip,
    $rm,
    $extractAllTo,
    $isCoWeek,
    $getPrefs,
    $mediaItems,
    $translate,
    $write,
    $getJWLangs,
    $findOne,
    $error,
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
    setProgress?: (loaded: number, total: number, global?: boolean) => void,
    imagesOnly = false
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

    const symbol = /[^a-zA-Z0-9]/.test(extract.UniqueEnglishSymbol)
      ? extract.UniqueEnglishSymbol
      : extract.UniqueEnglishSymbol.replace(/\d/g, '')

    // Exclude the "old new songs" songbook, as we don't need images from that
    if (symbol === 'snnw') return []
    const mediaLang = $getPrefs('media.lang') as string
    const fallbackLang = $getPrefs('media.langFallback') as string

    let extractDb = await getDbFromJWPUB(
      symbol,
      extract.IssueTagNumber,
      setProgress,
      fallbackLang ? mediaLang : extract.Lang
    )

    if (!extractDb && fallbackLang) {
      extractDb = await getDbFromJWPUB(
        symbol,
        extract.IssueTagNumber,
        setProgress,
        extract.Lang === mediaLang ? fallbackLang : extract.Lang ?? fallbackLang
      )
    }

    if (!extractDb) return []

    return (
      await getDocumentMultiMedia(
        extractDb,
        null,
        extract.RefMepsDocumentId,
        extract.Lang
      )
    )
      .filter((mmItem) => {
        if (imagesOnly && $isVideo(mmItem?.queryInfo?.FilePath ?? '')) {
          return false
        }

        if (
          mmItem?.queryInfo?.tableQuestionIsUsed &&
          mmItem.queryInfo.NextParagraphOrdinal &&
          !mmItem?.queryInfo?.TargetParagraphNumberLabel
        ) {
          mmItem.BeginParagraphOrdinal = mmItem.queryInfo.NextParagraphOrdinal
        }

        // Include videos with no specific paragraph for sign language, as they are sometimes used (ie the CBS chapter video)
        const mediaLang = store.state.media.mediaLang as ShortJWLang
        if (
          mediaLang.isSignLanguage &&
          !!mmItem?.queryInfo?.FilePath &&
          $isVideo(mmItem?.queryInfo?.FilePath) &&
          !mmItem?.queryInfo?.TargetParagraphNumberLabel
        ) {
          return true
        }
        // Always include header image of Love People lesson
        else if (
          extract.UniqueEnglishSymbol === 'lmd' &&
          mmItem.BeginParagraphOrdinal === 1
        ) {
          return true
        } else if (
          mmItem.BeginParagraphOrdinal &&
          extract.RefBeginParagraphOrdinal &&
          extract.RefEndParagraphOrdinal
        ) {
          return (
            extract.RefBeginParagraphOrdinal <= mmItem.BeginParagraphOrdinal &&
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

  async function getDocumentExtract(
    db: Database,
    docId: number,
    baseDate: Dayjs,
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
        AND NOT RefPublication.PublicationCategorySymbol = 'web'
        ${songPub === 'sjjm' ? "AND NOT UniqueEnglishSymbol = 'sjj' " : ''}
        AND NOT UniqueEnglishSymbol LIKE 'mwbr%'
        ${excludeTh ? "AND NOT UniqueEnglishSymbol = 'th' " : ''}
      ORDER BY DocumentExtract.BeginParagraphOrdinal`
    ) as MultiMediaExtract[]

    const promises: Promise<MeetingFile[]>[] = []

    extracts.forEach((extract) => {
      let imagesOnly = false
      const excludeLffImages = $getPrefs('media.excludeLffImages')
      if (
        extract.UniqueEnglishSymbol === 'lffi' ||
        extract.UniqueEnglishSymbol === 'lff'
      ) {
        imagesOnly = true
      }

      const skipCBS =
        $isCoWeek(baseDate) && extract.UniqueEnglishSymbol === 'bt'

      if (!skipCBS && (!imagesOnly || !excludeLffImages)) {
        promises.push(extractMediaItems(extract, setProgress, imagesOnly))
      }
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
    memOnly: boolean,
    lang?: string
  ) {
    if (mmItem.MepsLanguageIndex) {
      const mepsLang = MEPS_IDS_TYPED[mmItem.MepsLanguageIndex.toString()]
      if (mepsLang) lang = mepsLang
    } else if (mmItem.Link) {
      try {
        const matches = mmItem.Link.match(/\/(.*)\//)
        if (matches && matches.length > 0) {
          lang = (matches.pop() as string).split(':')[0]
        }
      } catch (e: unknown) {
        $log.error(e)
      }
    } else if (mmItem.FilePath) {
      const extractedLang = mmItem.FilePath.split('_')[1]
      const langs = await $getJWLangs()
      if (langs.find((l) => l.langcode === extractedLang)) {
        lang = extractedLang
      }
    }
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
    const mediaLang = $getPrefs('media.lang') as string
    const fallbackLang = $getPrefs('media.langFallback') as string
    try {
      // Get Video file
      if (
        mmItem.MimeType.includes('audio') ||
        mmItem.MimeType.includes('video')
      ) {
        let json = (
          await getMediaLinks(
            {
              pubSymbol: mmItem.KeySymbol as string,
              track: mmItem.Track as number,
              issue: (mmItem.IssueTagNumber as number)?.toString(),
              docId: mmItem.MultiMeps as number,
              lang: fallbackLang ? mediaLang : lang,
            },
            silent
          )
        )[0] as VideoFile

        if (!json && fallbackLang) {
          json =
            ((
              await getMediaLinks(
                {
                  pubSymbol: mmItem.KeySymbol as string,
                  track: mmItem.Track as number,
                  issue: (mmItem.IssueTagNumber as number)?.toString(),
                  docId: mmItem.MultiMeps as number,
                  lang:
                    lang === mediaLang ? fallbackLang : lang ?? fallbackLang,
                },
                silent
              )
            )[0] as VideoFile) ?? {}
        } else if (!json) {
          json = {} as VideoFile
        }
        json.queryInfo = mmItem
        json.BeginParagraphOrdinal = mmItem.BeginParagraphOrdinal
        return json as VideoFile
      } else {
        if (!mmItem.KeySymbol) {
          mmItem.KeySymbol = keySymbol
          mmItem.IssueTagNumber = +issueTagNumber
          if (!memOnly) {
            mmItem.LocalPath = join(
              $pubPath({
                BeginParagraphOrdinal: 0,
                title: '',
                queryInfo: mmItem,
              } as MeetingFile),
              mmItem.FilePath
            )

            // mmItem.Link is not always correct (e.x. treasure imgs for TPO)
            // See https://github.com/sircharlo/meeting-media-manager/issues/2259
            if (
              lang &&
              mmItem.Link &&
              lang !== mediaLang &&
              !existsSync(mmItem.LocalPath)
            ) {
              mmItem.LocalPath = join(
                $pubPath({
                  BeginParagraphOrdinal: 0,
                  title: '',
                  url: `url_${mediaLang}.jpg`,
                  queryInfo: mmItem,
                } as MeetingFile),
                mmItem.FilePath
              )
            }

            if (lang && !mmItem.Link && !existsSync(mmItem.LocalPath)) {
              mmItem.LocalPath = join(
                $pubPath({
                  BeginParagraphOrdinal: 0,
                  title: '',
                  url: `url_${lang}.jpg`,
                  queryInfo: mmItem,
                } as MeetingFile),
                mmItem.FilePath
              )
            }

            if (fallbackLang && !existsSync(mmItem.LocalPath)) {
              mmItem.LocalPath = join(
                $pubPath({
                  BeginParagraphOrdinal: 0,
                  title: '',
                  url: `url_${fallbackLang}.jpg`,
                  queryInfo: mmItem,
                } as MeetingFile),
                mmItem.FilePath
              )
            }
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
    lang?: string,
    memOnly?: boolean,
    silent?: boolean
  ): Promise<MeetingFile[]> {
    const result = $query(
      db,
      "SELECT * FROM sqlite_master WHERE type='table' AND name='DocumentMultimedia'"
    )

    const mmTable = result.length === 0 ? 'Multimedia' : 'DocumentMultimedia'

    const uniqueEnglishSymbol = (
      $query(db, 'SELECT UniqueEnglishSymbol FROM Publication') as {
        UniqueEnglishSymbol: string
      }[]
    )[0].UniqueEnglishSymbol as string

    const keySymbol = /[^a-zA-Z0-9]/.test(uniqueEnglishSymbol)
      ? uniqueEnglishSymbol
      : (uniqueEnglishSymbol.replace(/\d/g, '') as string)

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

    let select = `SELECT ${mmTable}.DocumentId, ${mmTable}.MultimediaId, Multimedia.MimeType, Multimedia.DataType, Multimedia.MajorType, Multimedia.FilePath, Multimedia.Label, Multimedia.Caption, Multimedia.CategoryType, Multimedia.MepsLanguageIndex`
    let from = `FROM ${mmTable} INNER JOIN Document ON ${mmTable}.DocumentId = Document.DocumentId`
    let where = `WHERE ${
      docId || docId === 0
        ? `${mmTable}.DocumentId = ${docId}`
        : `Document.MepsDocumentId = ${mepsId}`
    }`
    let groupAndSort = ''

    const includePrinted = $getPrefs('media.includePrinted')
    const videoString = `(Multimedia.MimeType LIKE '%video%' OR Multimedia.MimeType LIKE '%audio%')`
    const imgString = `(Multimedia.MimeType LIKE '%image%' ${
      includePrinted
        ? ''
        : 'AND Multimedia.CategoryType <> 4 AND Multimedia.CategoryType <> 6'
    } AND Multimedia.CategoryType <> 9 AND Multimedia.CategoryType <> 10 AND Multimedia.CategoryType <> 25)`

    where += ` AND (${videoString} OR ${imgString})`

    if (mmTable === 'DocumentMultimedia') {
      select += `, ${mmTable}.BeginParagraphOrdinal, ${mmTable}.EndParagraphOrdinal, Extract.Link, Multimedia.KeySymbol, Multimedia.MepsDocumentId AS MultiMeps, Document.MepsDocumentId, Multimedia.Track, Multimedia.IssueTagNumber`
      from += ` INNER JOIN Multimedia ON Multimedia.MultimediaId = ${mmTable}.MultimediaId LEFT JOIN DocumentExtract ON DocumentExtract.DocumentId = ${mmTable}.DocumentId AND DocumentExtract.BeginParagraphOrdinal = ${mmTable}.BeginParagraphOrdinal AND DocumentExtract.EndParagraphOrdinal = ${mmTable}.EndParagraphOrdinal LEFT JOIN Extract ON Extract.ExtractId = DocumentExtract.ExtractId`
      groupAndSort = `GROUP BY ${mmTable}.MultimediaId ORDER BY ${mmTable}.BeginParagraphOrdinal`

      if (targetParNrExists) {
        select += `, Question.TargetParagraphNumberLabel`
        from += ` LEFT JOIN Question ON Question.DocumentId = ${mmTable}.DocumentId AND Question.TargetParagraphOrdinal = ${mmTable}.BeginParagraphOrdinal`
      }
    }

    if (suppressZoomExists) {
      select += `, Multimedia.SuppressZoom`
      where += ` AND Multimedia.SuppressZoom <> 1`
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
          !!memOnly,
          lang
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
    return mmItems
  }
  inject('getDocumentMultiMedia', getDocumentMultiMedia)

  async function getAdditionalData(item: SmallMediaFile, id: string) {
    if (item.pub === 'thv') {
      item.thumbnail = THV_POSTER
    } else {
      const result = (await $mediaItems.$get(
        `E/${id}_VIDEO`
      )) as MediaItemResult

      if (result?.media?.length > 0) {
        item.thumbnail = result?.media[0]?.images?.wss?.sm
        item.primaryCategory = result?.media[0]?.primaryCategory
      }
    }
  }

  async function getSmallMediaFiles(
    mediaItem: {
      pubSymbol?: string
      docId?: number
      track?: number
      issue?: string
      format?: string
      lang?: string
    },
    silent?: boolean
  ): Promise<SmallMediaFile[]> {
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

      const mediaLang = mediaItem.lang || $getPrefs('media.lang')

      // Set correct song publication (e.g. sjj for sign language)
      const mediaLangObj = store.state.media.mediaLang as ShortJWLang | null
      const fallbackObj = store.state.media.fallbackLang as ShortJWLang | null
      if (mediaItem.pubSymbol === 'sjj' || mediaItem.pubSymbol === 'sjjm') {
        if (mediaLangObj?.langcode === mediaLang) {
          mediaItem.pubSymbol = mediaLangObj?.isSignLanguage ? 'sjj' : 'sjjm'
        } else if (fallbackObj?.langcode === mediaLang) {
          mediaItem.pubSymbol = fallbackObj?.isSignLanguage ? 'sjj' : 'sjjm'
        }
      }

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
      const fallbackLang = $getPrefs('media.langFallback') as string

      if (fallbackLang) {
        if (
          params.pub === 'w' &&
          store.state.media.mediaLang?.wAvailable === false
        ) {
          params.langwritten = fallbackLang
        } else if (
          params.pub === 'mwb' &&
          store.state.media.mediaLang?.mwbAvailable === false
        ) {
          params.langwritten = fallbackLang
        }
      }

      try {
        result = await $pubMedia.get('', {
          params,
        })
      } catch (e: any) {
        if (!silent && !fallbackLang) {
          $log.error(e)
        }

        try {
          const validOptions = ['iasn'] // Has an alternative pub with an extra m
          if (
            mediaItem.pubSymbol &&
            !validOptions.includes(mediaItem.pubSymbol)
          ) {
            throw e
          }
          $log.debug('result1', result ?? e.message)

          result = await $pubMedia.get('', {
            params: {
              pub: mediaItem.pubSymbol + 'm',
              track: mediaItem.track,
              issue: mediaItem.issue,
              fileformat: mediaItem.format,
              langwritten: mediaLang,
            },
          })
        } catch (e: any) {
          $log.debug('result2', result ?? e.message)
          if (fallbackLang && !mediaItem.lang) {
            if (params.pub === 'sjj' || params.pub === 'sjjm') {
              params.pub = fallbackObj?.isSignLanguage ? 'sjj' : 'sjjm'
            }
            try {
              result = await $pubMedia.get('', {
                params: {
                  ...params,
                  langwritten: fallbackLang,
                },
              })
            } catch (e: any) {
              if (!silent) {
                $log.error(e)
              }

              try {
                const validOptions = ['iasn'] // Has an alternative pub with an extra m
                if (
                  mediaItem.pubSymbol &&
                  !validOptions.includes(mediaItem.pubSymbol)
                ) {
                  throw e
                }
                $log.debug('result3', result ?? e.message)

                result = await $pubMedia.get('', {
                  params: {
                    pub: mediaItem.pubSymbol + 'm',
                    track: mediaItem.track,
                    issue: mediaItem.issue,
                    fileformat: mediaItem.format,
                    langwritten: fallbackLang,
                  },
                })
              } catch (e: any) {
                $log.debug('result4', result ?? e.message)
              }
            }
          }
        }
      }

      const publication = result?.data as Publication
      $log.debug('publication', result, publication)
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
            subtitled,
            subtitles,
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
              subtitled,
              subtitles: $getPrefs('media.enableSubtitles') ? subtitles : null,
              markers,
            }
          }
        ) as SmallMediaFile[]
      } else if (!silent && (!fallbackLang || !mediaItem.lang)) {
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
    $log.debug('smf', smallMediaFiles)
    return smallMediaFiles
  }

  async function getMediaLinks(
    mediaItem: {
      pubSymbol?: string
      docId?: number
      track?: number
      issue?: string
      format?: string
      lang?: string
    },
    silent?: boolean
  ): Promise<SmallMediaFile[]> {
    if (mediaItem.lang) {
      $log.debug('mi', mediaItem)
      $log.debug('ml', $getPrefs('media.lang'))
    }
    let smallMediaFiles: SmallMediaFile[] = []

    try {
      const mediaPromises: Promise<SmallMediaFile[]>[] = [
        getSmallMediaFiles(mediaItem, silent),
      ]

      const mediaLang = mediaItem.lang || ($getPrefs('media.lang') as string)
      const subsLang = $getPrefs('media.langSubs') as string
      const subtitlesEnabled =
        !!$getPrefs('media.enableSubtitles') && !!subsLang

      if (subtitlesEnabled && mediaLang !== subsLang) {
        mediaPromises.push(
          getSmallMediaFiles(
            {
              ...mediaItem,
              lang: subsLang,
            },
            silent
          )
        )
      }
      const result = await Promise.allSettled(mediaPromises)

      smallMediaFiles = result[0].status === 'fulfilled' ? result[0].value : []
      const subsResult = result[1]

      if (
        subtitlesEnabled &&
        mediaLang !== subsLang &&
        subsResult?.status === 'fulfilled'
      ) {
        smallMediaFiles.forEach((file) => {
          const matchingFile = subsResult.value.find(
            (sub) => file.pub === sub.pub && file.track === sub.track
          )
          if (
            matchingFile &&
            Math.abs(file.duration - matchingFile.duration) < 2
          ) {
            file.subtitles = matchingFile.subtitles
          } else {
            file.subtitles = null
          }
        })
      }

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
                .filter((v) => !!v && v !== '0')
                .join('_')}`

          promises.push(getAdditionalData(item, id))
        }
      })

      await Promise.allSettled(promises)
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
    $log.debug('smf', smallMediaFiles)
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
    lang?: string,
    localPath = ''
  ): Promise<Database | null> {
    let db: Database | null
    try {
      // Extract db from local JWPUB file
      if (localPath) {
        db = (await $getDb({
          pub,
          issue,
          lang,
          file: (await $getZipContentsByExt(localPath, '.db')) ?? undefined,
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
          pub = /[^a-zA-Z0-9]/.test(jwpubInfo.UniqueEnglishSymbol)
            ? jwpubInfo.UniqueEnglishSymbol
            : (jwpubInfo.UniqueEnglishSymbol.replace(/\d/g, '') as string)
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
            lang,
          })
        )[0] as VideoFile

        if (!jwpub) {
          $log.debug(`No JWPUB file found for ${pub} ${issue}`)
          return null
        }

        store.commit('media/setProgress', {
          key: jwpub.url,
          promise: downloadIfRequired(jwpub, setProgress),
        })
        await (store.state.media.progress as Map<string, Promise<string>>).get(
          jwpub.url
        )
        const pubPath = $pubPath(jwpub)
        if (!pubPath) {
          $log.debug(`No path for jwpub file`, jwpub)
          return null
        }
        const dbPath = $findOne(join(pubPath, '*.db'))
        if (!dbPath) {
          $log.debug('No db file found in pubPath', pubPath)
          return null
        }
        db = await $getDb({
          pub,
          issue,
          lang,
          file: readFileSync(dbPath),
        })
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
    const progressMap = store.state.media.progress as Map<
      string,
      Promise<string>
    >
    const downloadInProgress = progressMap.get(file.url)
    if (downloadInProgress) await downloadInProgress

    // Set extra properties
    file.downloadRequired = true
    file.cacheFilename = basename(file.url || '') || file.safeName
    file.cacheDir = $pubPath(file) as string
    file.cacheFile = join(file.cacheDir, file.cacheFilename as string)
    file.destFilename = file.folder ? file.safeName : file.cacheFilename
    if (existsSync(file.cacheFile)) {
      file.downloadRequired = file.filesize !== statSync(file.cacheFile).size
    }

    const subtitlesEnabled = $getPrefs('media.enableSubtitles')
    const subsLang = $getPrefs('media.langSubs') as string
    let subtitle = null

    if (subtitlesEnabled && subsLang && file.subtitles) {
      try {
        subtitle = $axios.$get(file.subtitles.url, {
          responseType: 'arraybuffer',
        })
      } catch (e: unknown) {
        $warn('errorDownloadSubs', { identifier: file.destFilename }, e)
      }
    }

    if (file.downloadRequired) {
      try {
        const downloadedFile = Buffer.from(
          new Uint8Array(
            await $axios.$get(file.url, {
              responseType: 'arraybuffer',
              onDownloadProgress: (progressEvent) => {
                if (setProgress) {
                  setProgress(progressEvent.loaded, progressEvent.total)
                }
              },
            })
          )
        )

        if (extname(file.cacheFile) === '.jwpub') {
          emptyDirSync(file.cacheDir)
        }
        $write(file.cacheFile, downloadedFile)

        if (file.folder) {
          const filePath = $mediaPath(file)
          if (filePath) {
            $write(filePath, downloadedFile)
            if (subtitle) {
              $write(
                changeExt(filePath, '.vtt'),
                Buffer.from(new Uint8Array(await subtitle))
              )
            } else {
              $rm(changeExt(filePath, '.vtt'))
            }
          }
        }
        store.commit('stats/setDownloads', {
          origin: 'jworg',
          source: 'live',
          file,
        })
        if (extname(file.cacheFile) === '.jwpub') {
          await $extractAllTo(file.cacheFile, file.cacheDir)
        }
      } catch (e: unknown) {
        $warn('errorDownload', { identifier: file.destFilename }, e)
      }
    } else {
      if (file.folder) {
        const filePath = $mediaPath(file)
        if (filePath) {
          $copy(file.cacheFile, filePath)
          if (subtitle) {
            $write(
              changeExt(filePath, '.vtt'),
              Buffer.from(new Uint8Array(await subtitle))
            )
          } else {
            $rm(changeExt(filePath, '.vtt'))
          }
        }
      }
      if (
        extname(file.cacheFile) === '.jwpub' &&
        !$findOne(join(file.cacheDir, '*.db'))
      ) {
        await $extractAllTo(file.cacheFile, file.cacheDir)
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

    // Process internalRefs of the internalRefs
    const internalRefs = $query(
      db,
      `SELECT DocumentInternalLink.DocumentId AS SourceDocumentId, DocumentInternalLink.BeginParagraphOrdinal, Document.DocumentId FROM DocumentInternalLink INNER JOIN InternalLink ON DocumentInternalLink.InternalLinkId = InternalLink.InternalLinkId INNER JOIN Document ON InternalLink.MepsDocumentId = Document.MepsDocumentId WHERE DocumentInternalLink.DocumentId = ${ref.DocumentId} AND Document.Class <> 94`
    ) as MultiMediaExtractRef[]

    internalRefs.forEach((ref) => {
      promises.push(processInternalRefs(db, ref, date))
    })

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
      )[0]?.DocumentId

      // Return without error if no document id was found (e.g. memorial week)
      if (!docId) return

      const treasures = $query(
        db,
        'SELECT FeatureTitle FROM Document WHERE Class = 21'
      )[0] as { FeatureTitle: string }
      const apply = $query(
        db,
        'SELECT FeatureTitle FROM Document WHERE Class = 94'
      )[0] as { FeatureTitle: string }
      const living = $query(
        db,
        'SELECT FeatureTitle FROM Document WHERE Class = 10 ORDER BY FeatureTitle'
      ) as { FeatureTitle: string }[]
      let livingTitle = living[0]?.FeatureTitle
      if (living.length > 1) {
        livingTitle = living[Math.floor(living.length / 2)]?.FeatureTitle
      }

      if (treasures?.FeatureTitle && apply?.FeatureTitle && livingTitle) {
        try {
          writeJsonSync(
            join($pubPath(), 'mwb', 'headings.json'),
            {
              treasures: treasures.FeatureTitle,
              apply: apply.FeatureTitle,
              living: livingTitle,
            },
            { spaces: 2 }
          )
        } catch (error) {
          $log.error(error)
        }
      }

      // Get document multimedia and add them to the media list
      const mms = await getDocumentMultiMedia(db, docId)
      const promises: Promise<void>[] = []

      // remove the last song if it's the co week
      if ($isCoWeek(baseDate)) {
        const SONG_MIN_PAR = 22
        let lastSongIdLookup = mms
          .reverse()
          .findIndex(
            (m) =>
              m.BeginParagraphOrdinal && m.BeginParagraphOrdinal >= SONG_MIN_PAR
          )
        if (lastSongIdLookup === -1) {
          lastSongIdLookup = mms
            .reverse()
            .findIndex((m) => m.pub === store.state.media.songPub)
        }
        mms.splice(lastSongIdLookup, 1)
      }
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
      const extracts = await getDocumentExtract(
        db,
        docId,
        baseDate,
        setProgress
      )

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

      let issue = baseDate.subtract(8, 'weeks').format('YYYYMM') + '00'
      let db = (await getDbFromJWPUB('w', issue, setProgress)) as Database
      let weekNr = getWeekNr(db)

      if (weekNr < 0) {
        issue = baseDate.subtract(10, 'weeks').format('YYYYMM') + '00'
        db = (await getDbFromJWPUB('w', issue, setProgress)) as Database
        weekNr = getWeekNr(db)
      }
      if (weekNr < 0) throw new Error(`No WE meeting data found for ${date}!`)

      const docId = (
        $query(
          db,
          `SELECT Document.DocumentId FROM Document WHERE Document.Class=40 LIMIT 1 OFFSET ${weekNr}`
        ) as { DocumentId: number }[]
      )[0]?.DocumentId

      // Return without error if no document id was found (e.g. memorial week)
      if (!docId) return

      const magazine = $query(
        db,
        `SELECT Title FROM PublicationIssueProperty LIMIT 1`
      )[0] as { Title: string }
      const article = $query(
        db,
        `SELECT Title FROM Document WHERE DocumentId = ${docId}`
      )[0] as { Title: string }
      $write(
        join(
          $mediaPath(),
          date,
          $strip(magazine.Title + ' - ' + article.Title, 'file') + '.title'
        ),
        ''
      )

      const promises: Promise<void>[] = []

      const videos = $query(
        db,
        `SELECT DocumentMultimedia.MultimediaId, DocumentMultimedia.DocumentId, MepsDocumentId, CategoryType, KeySymbol, Track, IssueTagNumber, MimeType, BeginParagraphOrdinal, TargetParagraphNumberLabel
             FROM DocumentMultimedia
             INNER JOIN Multimedia
               ON DocumentMultimedia.MultimediaId = Multimedia.MultimediaId
             LEFT JOIN Question
               ON Question.DocumentId = DocumentMultimedia.DocumentId 
               AND Question.TargetParagraphOrdinal = DocumentMultimedia.BeginParagraphOrdinal
             WHERE DocumentMultimedia.DocumentId = ${docId}
               AND CategoryType = -1
             GROUP BY DocumentMultimedia.MultimediaId`
      ) as MultiMediaItem[]
      const videosInParagraphs = videos.filter(
        (video) => !!video.TargetParagraphNumberLabel
      )
      const videosNotInParagraphs = videos.filter(
        (video) => !video.TargetParagraphNumberLabel
      )
      const FOOTNOTE_TAR_PAR = 9999

      const excludeFootnotes = $getPrefs('media.excludeFootnotes') as boolean

      const media = $query(
        db,
        `SELECT DocumentMultimedia.MultimediaId, DocumentMultimedia.DocumentId, MepsDocumentId, CategoryType, MimeType, BeginParagraphOrdinal, FilePath, Label, Caption, TargetParagraphNumberLabel, KeySymbol, Track, IssueTagNumber
             FROM DocumentMultimedia
             INNER JOIN Multimedia
               ON DocumentMultimedia.MultimediaId = Multimedia.MultimediaId
             LEFT JOIN Question
               ON Question.DocumentId = DocumentMultimedia.DocumentId 
               AND Question.TargetParagraphOrdinal = DocumentMultimedia.BeginParagraphOrdinal
             WHERE DocumentMultimedia.DocumentId = ${docId}
               AND CategoryType <> 9 
               AND CategoryType <> -1
               AND (KeySymbol != "sjjm" OR KeySymbol IS NULL)
             GROUP BY DocumentMultimedia.MultimediaId
             ORDER BY BeginParagraphOrdinal` // pictures
      )
        .concat(videosInParagraphs)
        .concat(
          // exclude the first two videos if wt is after FEB_2023, since these are the songs
          videosNotInParagraphs
            .slice(+issue < FEB_2023 ? 0 : 2)
            .map((mediaObj) =>
              mediaObj.TargetParagraphNumberLabel === null
                ? { ...mediaObj, TargetParagraphNumberLabel: FOOTNOTE_TAR_PAR } // assign special number so we know videos are referenced by a footnote
                : mediaObj
            )
            .filter((v) => {
              return (
                !excludeFootnotes ||
                v.TargetParagraphNumberLabel < FOOTNOTE_TAR_PAR
              )
            })
        ) as MultiMediaItem[]

      media.forEach((m) => promises.push(addMediaToPart(date, issue, m)))

      let songs: MultiMediaItem[] = []

      // Watchtowers before Feb 2023 don't include songs in DocumentMultimedia
      if (+issue < FEB_2023) {
        songs = $query(
          db,
          `SELECT *
              FROM Multimedia
              INNER JOIN DocumentMultimedia
                ON Multimedia.MultimediaId = DocumentMultimedia.MultimediaId
              WHERE DataType = 2
              ORDER BY BeginParagraphOrdinal
              LIMIT 2 OFFSET ${2 * weekNr}`
        ) as MultiMediaItem[]
      } else {
        songs = videosNotInParagraphs.slice(0, 2) // after FEB_2023, the first two videos from DocumentMultimedia are the songs
      }

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
        if (!($isCoWeek(baseDate) && i > 0)) {
          promises.push(addSongToPart(date, songLangs, song, i))
        }
      })

      await Promise.allSettled(promises)
    }
  )

  async function addMediaToPart(
    date: string,
    issue: string,
    mediaItem: MultiMediaItem
  ): Promise<void> {
    if ($isImage(mediaItem.FilePath)) {
      let LocalPath = join($pubPath(), 'w', issue, '0', mediaItem.FilePath)
      if (!existsSync(LocalPath)) {
        LocalPath = join(
          $pubPath({
            pub: 'w',
            issue,
            url: `url_${$getPrefs('media.langFallback')}.jpg`,
          } as MeetingFile),
          mediaItem.FilePath
        )
      }
      const FileName = $sanitize(
        mediaItem.Caption.length > mediaItem.Label.length
          ? mediaItem.Caption
          : mediaItem.Label
      )
      const pictureObj = {
        title: FileName,
        filepath: LocalPath,
        filesize: statSync(LocalPath).size,
        queryInfo: mediaItem,
      } as ImageFile
      await addMediaItemToPart(date, 1, pictureObj)
    } else {
      const media = await getMediaLinks({
        pubSymbol: mediaItem.KeySymbol ?? undefined,
        docId: mediaItem.MepsDocumentId ?? undefined,
        track: mediaItem.Track!,
        issue: mediaItem.IssueTagNumber?.toString(),
      })
      if (media?.length > 0)
        addMediaItemToPart(date, 1, { ...media[0], queryInfo: mediaItem })
    }
  }

  async function addSongToPart(
    date: string,
    songLangs: string[],
    song: MultiMediaItem,
    i: number
  ): Promise<void> {
    const mediaLang = $getPrefs('media.lang') as string
    const fallbackLang = $getPrefs('media.langFallback') as string
    let songMedia = await getMediaLinks({
      pubSymbol: song.KeySymbol as string,
      track: song.Track as number,
      lang: fallbackLang ? mediaLang : songLangs[i],
    })

    if (fallbackLang && (!songMedia || songMedia.length === 0)) {
      songMedia = await getMediaLinks({
        pubSymbol: song.KeySymbol as string,
        track: song.Track as number,
        lang: mediaLang === songLangs[i] ? fallbackLang : songLangs[i],
      })
    }

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

    meetings.forEach((parts, date) => {
      let i = 1
      const day = $dayjs(
        date,
        $getPrefs('app.outputFolderDateFormat') as string
      )
      const isWeDay = $isMeetingDay(day) === 'we'
      const sorted = [...parts.entries()].sort((a, b) => a[0] - b[0])

      let heading = '01'
      sorted.forEach(([par, media]) => {
        if (heading === '01' && par > BIBLE_READING_PAR_NR) {
          heading = '02'
          i = 1
        }
        media
          .filter((m) => !m.safeName)
          .forEach((item, j) => {
            if (heading === '02' && item.pub?.includes('sjj')) {
              heading = '03'
              i = 1
            }
            item.safeName = `${isWeDay ? '' : heading + '-'}${(isWeDay
              ? i + 2
              : i
            )
              .toString()
              .padStart(2, '0')}-${(j + 1).toString().padStart(2, '0')} -`
            if (!item.congSpecific) {
              if (item.queryInfo?.TargetParagraphNumberLabel) {
                // eslint-disable-next-line no-magic-numbers
                if (item.queryInfo.TargetParagraphNumberLabel === 9999) {
                  item.safeName += ` ${$translate('footnote')} -`
                } else {
                  item.safeName += ` ${$translate('paragraph')} ${
                    item.queryInfo?.TargetParagraphNumberLabel
                  } -`
                }
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
    $log.debug('meetings', meetings)
    store.commit('stats/stopPerf', {
      func: 'createMediaNames',
      stop: performance.now(),
    })
  })

  inject('syncLocalRecurringMedia', (baseDate: Dayjs): void => {
    const mediaPath = $mediaPath()
    if (!mediaPath) return

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

    $findAll(join(mediaPath, 'Recurring', '*')).forEach(
      (recurringItem: string) => {
        dates.forEach((date) => {
          $copy(recurringItem, join(mediaPath, date, basename(recurringItem)))
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
        try {
          writeJsonSync(
            join(
              mediaPath,
              item.folder as string,
              changeExt(item.safeName as string, 'json')
            ),
            markers,
            { spaces: 2 }
          )
        } catch (error) {
          $log.error(error)
        }
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
        const newItem = JSON.parse(
          JSON.stringify(item as SmallMediaFile)
        ) as SmallMediaFile
        store.commit('media/setProgress', {
          key: newItem.url,
          promise: downloadIfRequired(newItem, setProgress),
        })
        await (store.state.media.progress as Map<string, Promise<string>>).get(
          newItem.url
        )
      } else if (mediaPath && item.filepath && item.folder && item.safeName) {
        const dest = join(mediaPath, item.folder, item.safeName)
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
        const fadeOutTime = $getPrefs('meeting.musicFadeOutTime') as number
        if ($getPrefs('meeting.musicFadeOutType') === 'smart') {
          const day = $isMeetingDay()

          if (day && !$getPrefs('meeting.specialCong')) {
            // Set stop time depending on mw or we day
            const meetingStarts = (
              $getPrefs(`meeting.${day}StartTime`) as string
            )?.split(':') ?? ['0', '0']

            const timeToStop = now
              .hour(+meetingStarts[0])
              .minute(+meetingStarts[1])
              .second(0)
              .millisecond(0)
              .subtract(fadeOutTime, 's')
              .subtract(6, 's')

            if (timeToStop.isAfter(now)) {
              store.commit('media/setMusicFadeOut', timeToStop)
            }
          }
        } else {
          store.commit('media/setMusicFadeOut', now.add(fadeOutTime, 'm'))
        }
      }

      // Get songs from jw.org or from local cache
      const isOnline = store.state.stats.online && !$getPrefs('app.offline')
      const signLanguage =
        store.state.media.songPub === 'sjj' &&
        $getPrefs('media.enableMediaDisplayButton')

      let songPub = 'sjjm'
      let mediaFormat = 'mp3'
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
            ).filter(
              (item) =>
                item.track < KINGDOM_SONGS_MAX &&
                extname(item.url) === `.${mediaFormat}`
            )
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

      if (songs.length === 0) {
        $warn('errorNoShuffleSongs')
      } else if (signLanguage) {
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
      : (songs[index] as { title: string; track: string; path: string })?.path

    ipcRenderer.on('videoProgress', (_e, progress) => {
      if (store.state.media.musicFadeOut && !fadeOut) {
        store.commit(
          'media/setMusicFadeOut',
          $dayjs.duration(progress[1] - progress[0], 's').format('mm:ss')
        )
      }
    })

    ipcRenderer.send('showMedia', { src: path })

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
      audio.volume = ($getPrefs('meeting.musicVolume') as number) / 100
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
        (songs[index] as { title: string; track: string; path: string })
          ?.path ?? ''
      ).href
    }
    audio.appendChild(source)
    document.body.appendChild(audio)
  }

  inject('getSongs', async (): Promise<VideoFile[]> => {
    const result = (
      await getMediaLinks({
        pubSymbol: store.state.media.songPub,
        format: 'MP4',
      })
    ).filter((song) => song.track < KINGDOM_SONGS_MAX) as VideoFile[]

    store.commit('media/setNrOfSongs', result.length)

    const fallbackLang = $getPrefs('media.langFallback') as string

    if (fallbackLang && result.length < store.state.media.nrOfSongs) {
      const fallback = (await getMediaLinks({
        pubSymbol: store.state.media.songPub,
        format: 'MP4',
        lang: fallbackLang,
      })) as VideoFile[]

      fallback.forEach((song) => {
        if (!result.find((s) => s.track === song.track)) {
          result.push(song)
        }
      })
      result.sort((a, b) => a.track - b.track)
    }

    result.forEach((song) => {
      song.safeName =
        $sanitize(`- ${$translate('song')} ${song.title}`) + '.mp4'
    })

    return result
  })
}

export default plugin
