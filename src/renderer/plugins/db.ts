import { Plugin } from '@nuxt/types'
// eslint-disable-next-line import/named
import sqljs, { Database } from 'sql.js'

const plugin: Plugin = ({ store, $log, $config }, inject) => {
  function executeQuery(db: Database, query: string) {
    const result = db.exec(query)[0]
    const valObj: any[] = []
    if (result) {
      for (let v = 0; v < result.values.length; v++) {
        valObj[v] = {}
        for (let c = 0; c < result.columns.length; c++) {
          valObj[v][result.columns[c]] = result.values[v][c]
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
    }): Promise<Database | null> => {
      // Get saved db if available
      if (pub && issue) {
        const result = (await store.dispatch('db/get', {
          pub,
          issue,
        })) as Database
        if (result) return result
      }

      try {
        const SQL = await sqljs({
          locateFile: (filename: string) =>
            `https://cdnjs.cloudflare.com/ajax/libs/sql.js/${$config.sqlJsVersion}/${filename}`,
        })
        const db = new SQL.Database(file)
        if (pub && issue) store.commit('db/set', { pub, issue, db })
        return db
      } catch (e: any) {
        $log.error(e)
      }

      return null
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
