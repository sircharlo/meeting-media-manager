import { Middleware } from '@nuxt/types'
import { ipcRenderer } from 'electron'

const middleware: Middleware = ({ route }) => {
  ipcRenderer.send('allowQuit', !route.path.endsWith('/present'))
}

export default middleware
