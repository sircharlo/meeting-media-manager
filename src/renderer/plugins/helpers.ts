import { Plugin } from '@nuxt/types'
import cloneDeep from 'lodash.clonedeep'

const plugin: Plugin = (_ctx, inject) => {
  inject('clone', (value: any) => {
    return cloneDeep(value)
  })
  inject('strip', (value: string, type: string = 'id') => {
    switch (type) {
      case 'id':
        return value.replace(/[^a-zA-Z0-9-.:_]/g, '')
      case 'file':
        return value
          .replace(/[^a-zA-Z0-9 ()-_]/g, '')
          .replace(/ *[—?;:|.!?] */g, ' - ')
      default:
        throw new Error('Invalid type: ' + type)
    }
  })
}

export default plugin
