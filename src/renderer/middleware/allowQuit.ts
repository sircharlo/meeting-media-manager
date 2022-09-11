import { Middleware } from '@nuxt/types'
import { ipcRenderer } from 'electron'

const middleware: Middleware = ({ route, localePath }) => {
  ipcRenderer.send('allowQuit', route.path !== localePath('/present'))
}

export default middleware
