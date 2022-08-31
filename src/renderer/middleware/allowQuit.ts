import { Middleware } from '@nuxt/types'
import { ipcRenderer } from 'electron'

const middleware: Middleware = ({ route }) => {
  ipcRenderer.send('allowQuit', route.path !== '/present')
}

export default middleware
