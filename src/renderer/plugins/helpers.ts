import { Plugin } from '@nuxt/types'
import cloneDeep from 'lodash.clonedeep'

const plugin: Plugin = (_ctx, inject) => {
  inject('clone', (value: any) => {
    return cloneDeep(value)
  })
  inject('strip', (value: string, type: string = 'id'): string => {
    if (!value) return ''
    switch (type) {
      case 'id':
        console.debug('strip:', value)
        console.debug(value.replace(/[^a-zA-Z0-9\-:_]/g, ''))
        return value.replace(/[^a-zA-Z0-9\-:_]/g, '')
      case 'file':
        return (
          value
            // Common seperators
            .replace(/ *[—?;:|.!?] */g, ' - ')
            // Breaking space
            .replace(/\u00A0\t/g, ' ')
            // Illegal filename characters
            .replace(
              // eslint-disable-next-line no-control-regex
              /["»“”‘’«(){}№+[\]$<>,/\\:*\x00-\x1F\x80-\x9F\u0000-\u001F]/g,
              ''
            )
            .trim()
            .replace(/[ -]+$/g, '')
        )
      default:
        throw new Error('Invalid type: ' + type)
    }
  })
}

export default plugin
