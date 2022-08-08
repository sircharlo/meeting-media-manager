export interface Modal {
  active: Boolean
  title?: string
  component: string
  componentProps?: Object
  maxWidth: string
  pending: Boolean
  message?: string
  persistant: Boolean
  showCloseBtn: Boolean
  execOnClose?: () => void
}
