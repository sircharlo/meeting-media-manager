export interface Confirm {
  title?: string
  message?: string
  component?: string
  componentProps?: Object
  maxWidth: string
  exec: () => void
  cancel?: () => void
  to?: string
  flash?: string
}
