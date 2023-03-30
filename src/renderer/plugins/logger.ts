import { type, release, arch } from 'os'
import { Plugin } from '@nuxt/types'
import { MeetingFile, Perf, Stats } from '~/types'
import { BYTES_IN_KIBIBYTE } from '~/constants/general'

const plugin: Plugin = ({ $getAllPrefs, $config, $sentry, store }, inject) => {
  interface Log {
    [key: number]: any[]
  }

  interface Logs {
    error: Log
    warn: Log
    info: Log
    debug: Log
  }

  const logs: Logs = {
    error: {},
    warn: {},
    info: {},
    debug: {},
  }

  function logger(type: keyof Logs, args: [msg: any, ...args: any[]]): void {
    const now = +new Date()
    if (!logs[type][now]) logs[type][now] = []
    logs[type][now].push(
      typeof args[0] === 'string'
        ? args[0]
        : args[0]?.message ?? args[0]?.description
    )
    console[type](...args)
  }

  const IGNORED_ERRORS = [
    'Network Error',
    'timeout of 0ms exceeded',
    'timeout exceeded',
  ]

  const log = {
    debug: function (msg: any, ...args: any[]) {
      logger('debug', [msg, ...args])
    },
    info: function (msg: any, ...args: any[]) {
      logger('info', [msg, ...args])
    },
    warn: function (msg: any, ...args: any[]) {
      logger('warn', [msg, ...args])
    },
    error: function (msg: any, ...args: any[]) {
      logger('error', [msg, ...args])
      if (typeof msg !== 'string' && !IGNORED_ERRORS.includes(msg.message)) {
        if (
          Object.values(logs.error).includes('Network Error') &&
          (msg.message.startsWith('No WE meeting data found') ||
            msg.message.startsWith('No MW meeting data found'))
        ) {
          return
        }
        $sentry.captureException(msg)
      }
    },
  }

  inject('log', log)

  const bugURL = (): string => {
    const prefs = JSON.stringify(
      Object.fromEntries(
        Object.entries($getAllPrefs()).map(([scope, prefs]) => {
          if (!prefs) return [scope, {}]
          return [
            scope,
            Object.fromEntries(
              Object.entries(prefs).map(
                ([key, value]: [key: string, value: any]) => {
                  if (value) {
                    if (scope === 'cong') value = '***'
                    if (key === 'localOutputPath') value = '***'
                    if (key === 'customCachePath') value = '***'
                    if (key === 'password' || key === 'port') value = '***'
                    if (key === 'obs' || key === 'zoom') {
                      if (value.password) value.password = '***'
                      if (value.id) value.id = '***'
                      if (value.autoRename) value.autoRename = '***'
                    }
                  }
                  return [key, value]
                }
              )
            ),
          ]
        })
      ),
      null,
      2
    )
    return (
      `${
        $config.repo
      }/issues/new?template=bug_report.yml&title=[App][Bug]%3A+<title>&version=${
        $config.version
      }&logs=${JSON.stringify(logs.error, null, 2).replace(
        /\n/g,
        '%0D%0A'
      )}&additional-context=` +
      encodeURIComponent(
        `${type()} ${release()} ${arch()}
### Anonymized \`prefs.json\`
\`\`\`
${prefs}
\`\`\``
      ).replace(/\n/g, '%0D%0A')
    )
  }

  inject('bugURL', bugURL)

  inject('printStats', (): void => {
    const performance = store.state.stats.performance as Map<string, Perf>
    const downloads = store.state.stats.downloads as Stats
    for (const [func, perf] of [...performance.entries()].sort(
      (a, b) => a[1].stop - b[1].stop
    )) {
      log.info(
        `%c[perf] [${func}] ${(perf.stop - perf.start).toFixed(1)}ms`,
        'background-color: #e2e3e5; color: #41464b;'
      )
    }

    for (const [origin, sources] of Object.entries(downloads)) {
      for (const [source, files] of Object.entries(sources)) {
        if ((files as MeetingFile[]).length > 0) {
          log.info(
            `%c[perf] [${origin} Fetch] from ${source}: ${(
              (files as MeetingFile[])
                .map((file) => file.filesize as number)
                .reduce((a, b) => a + b, 0) /
              BYTES_IN_KIBIBYTE /
              BYTES_IN_KIBIBYTE
            ).toFixed(1)}MB`,
            'background-color: #fbe9e7; color: #000;'
          )
        }
      }
    }
  })
}

export default plugin
