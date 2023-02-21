import { Middleware } from '@nuxt/types'

// Reminders are shown between pages
const middleware: Middleware = ({
  from,
  route,
  store,
  localePath,
  $notify,
}) => {
  // Reminder to fetch media when leaving the manage media page
  if (
    from.path === localePath('/manage') &&
    route.path !== localePath('/manage')
  ) {
    if (store.state.cong.client) {
      $notify('dontForgetToGetMedia')
    }
  }
}

export default middleware
