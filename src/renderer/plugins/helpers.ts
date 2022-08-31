import { Plugin } from '@nuxt/types'
import cloneDeep from 'lodash.clonedeep'

const plugin: Plugin = (_ctx, inject) => {
  inject('clone', (value: any) => {
    return cloneDeep(value)
  })
}

export default plugin
