import { URL } from 'url'
import { join, normalize } from 'path'
import { app, protocol } from 'electron'

const PRODUCTION_APP_PROTOCOL = 'app'
const PRODUCTION_APP_PATH = join(__dirname, '..', 'renderer')

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: PRODUCTION_APP_PROTOCOL,
    privileges: { secure: true, standard: true, supportFetchAPI: true },
  },
])

app.once('ready', () => {
  registerProtocol(PRODUCTION_APP_PROTOCOL)
})

// Credits: https://github.com/nklayman/vue-cli-plugin-electron-builder/blob/master/lib/createProtocol.js
function registerProtocol(scheme: string) {
  protocol.registerFileProtocol(scheme, (request, callback) => {
    const relativePath = normalize(new URL(request.url).pathname)
    const absolutePath = join(PRODUCTION_APP_PATH, relativePath)

    callback(absolutePath)
  })
}

// Require `main` process to boot app
require('../index')
