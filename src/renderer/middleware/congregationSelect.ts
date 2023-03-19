import { Middleware } from '@nuxt/types'

// Open congregation picker when no congregation selected
const middleware: Middleware = ({ store, route, redirect }) => {
  const pathsToCheck = ["congregation", "media", "browser"]
  const shouldRedirect = !store.getters["currentCongregation/name"].name && !pathsToCheck.some(path => route.path.includes(path))
  if (shouldRedirect) {
    redirect('/congregation')
    console.log("redirected to congregation picker");
  }
}

export default middleware
