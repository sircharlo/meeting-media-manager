import { Plugin } from '@nuxt/types'

const plugin: Plugin = ({ $axios, $config }, inject) => {
  // Get media links from publication
  const pubMedia = $axios.create({
    baseURL: 'https://b.jw-cdn.org/apis/pub-media/GETPUBMEDIALINKS',
  })

  pubMedia.onRequest((config) => {
    config.params = {
      ...config.params,
      output: 'json',
    }
  })
  inject('pubMedia', pubMedia)

  // Get media item
  const mediaItems = $axios.create({
    baseURL: 'https://b.jw-cdn.org/apis/mediator/v1/media-items/',
  })
  inject('mediaItems', mediaItems)

  // Media categories
  const mediaCategories = $axios.create({
    baseURL: 'https://b.jw-cdn.org/apis/mediator/v1/categories/',
  })

  mediaCategories.onRequest((config) => {
    config.params = {
      ...config.params,
      clientType: 'www',
    }
  })
  inject('mediaCategories', mediaCategories)

  // Get GitHub information
  const ghApi = $axios.create({
    baseURL: `https://api.github.com/repos/${$config.author}/${$config.name}/`,
  })

  inject('ghApi', ghApi)
}

export default plugin
