import { Middleware } from '@nuxt/types'
import { ipcRenderer } from 'electron'

// In presentation mode, you get warned when trying to quit the app (tou can still quit by pressing 3 times)
const middleware: Middleware = ({ route, localePath }) => {
  ipcRenderer.send('allowQuit', route.path !== localePath('/present'))
}

export default middleware
