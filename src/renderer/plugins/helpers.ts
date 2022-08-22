import { Context } from '@nuxt/types'
import cloneDeep from 'lodash.clonedeep'

export default function (
  _: Context,
  inject: (argument0: string, argument1: unknown) => void
) {
  inject('clone', (value: any) => {
    return cloneDeep(value)
  })
}
