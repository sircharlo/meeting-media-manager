import { Context } from '@nuxt/types'

import sqljs, { Database } from 'sql.js'

export default function (
  { store, $log }: Context,
  inject: (argument0: string, argument1: unknown) => void
) {
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
      if (pub && issue) {
        const result = await store.dispatch('db/get', { pub, issue })
        if (result) return result
      }

      try {
        const SQL = await sqljs({
          locateFile: (filename: string) => `/${filename}`,
        })
        const db = new SQL.Database(file)
        if (pub && issue) store.commit('db/set', { pub, issue, db })
        return db
      } catch (e) {
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
