import { Images, MediaItem } from './mediaItem'

export interface MediaCategory {
  key: string
  type: string
  name: string
  description: string
  tags: { [key: number]: string }
  images: Images
  parentCategory?: MediaCategory | null
  subCategories?: MediaCategory[]
  media?: MediaItem[]
}

export interface MediaCategoryResult {
  category: MediaCategory
  pagination: {
    totalCount: number
    offset: number
    limit: number
  }
}
