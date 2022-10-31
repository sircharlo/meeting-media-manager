export interface NotifyAction {
  type: 'link' | 'error'
  label: string
  url: string | unknown
}

export interface Notify {
  action?: NotifyAction
  type: string
  dismiss: boolean
  identifier?: string
  message: string
  persistent: boolean
  timestamp: number
}
