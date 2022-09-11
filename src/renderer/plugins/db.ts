import { Plugin } from '@nuxt/types'
import { Database, SqlJsStatic } from 'sql.js'

const plugin: Plugin = ({ store, $log }, inject) => {
  function executeQuery(db: Database, query: string) {
    const vals = db.exec(query)[0]
    const valObj: any[] = []
    if (vals) {
      for (let v = 0; v < vals.values.length; v++) {
        valObj[v] = {}
        for (let c = 0; c < vals.columns.length; c++) {
          valObj[v][vals.columns[c]] = vals.values[v][c]
        }
      }
    }
    $log.debug({ query, valObj })
    return valObj
  }

  inject(
    'getDb',
    async ({
      file,
      pub,
      issue,
    }: {
      file?: Buffer
      pub?: string
      issue?: string
    }) => {
      // Get saved db if available
      if (pub && issue) {
        const result = await store.dispatch('db/get', { pub, issue })
        if (result) return result
      }

      const sqljs = require('sql.js')
      try {
        const SQL = (await sqljs({
          locateFile: (filename: string) => `/${filename}`,
        })) as SqlJsStatic
        const db = new SQL.Database(file)
        if (pub && issue) store.commit('db/set', { pub, issue, db })
        return db
      } catch (e: any) {
        $log.error(e)
      }

      return undefined
    }
  )

  inject('setDb', (pub: string, issue: string, db: Database) => {
    if (pub && issue && db) {
      store.commit('db/set', { pub, issue, db })
    }
  })

  inject('query', executeQuery)
}

export default plugin
