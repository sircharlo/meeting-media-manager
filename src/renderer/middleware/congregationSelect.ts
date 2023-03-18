import { Middleware } from '@nuxt/types'

// Open congregation picker when no congregation selected
const middleware: Middleware = ({ store, route, redirect }) => {
  if (!store.getters["currentCongregation/name"].name && !route.path.includes("congregation")) {
    redirect('/congregation')
    console.log("redirected to congregation picker");
  }
}

export default middleware
