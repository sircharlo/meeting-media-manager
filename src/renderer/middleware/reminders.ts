import { Middleware } from '@nuxt/types'

// Reminders are shown between pages
const middleware: Middleware = ({ from, route, localePath, $notify }) => {
  // Reminder to fetch media when leaving the manage media page
  if (from.path === localePath('/add') && route.path !== localePath('/add')) {
    $notify('dontForgetToGetMedia')
  }
}

export default middleware
