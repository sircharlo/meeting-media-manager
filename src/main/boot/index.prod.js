import { URL } from 'url'
import { app, protocol } from 'electron'
import * as path from 'upath'

const PRODUCTION_APP_PROTOCOL = 'app'
const PRODUCTION_APP_PATH = path.join(__dirname, '..', 'renderer')

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
function registerProtocol(scheme) {
  protocol.registerFileProtocol(scheme, (request, response) => {
    const relativePath = path.normalize(new URL(request.url).pathname)
    const absolutePath = path.join(PRODUCTION_APP_PATH, relativePath)

    response({ path: absolutePath })
  })
}

// Require `main` process to boot app
require('../index')
