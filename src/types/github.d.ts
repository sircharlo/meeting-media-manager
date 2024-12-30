export interface Asset {
  browser_download_url: string;
  content_type: string;
  created_at: string;
  download_count: number;
  id: number;
  label: null | string;
  name: string;
  node_id: string;
  size: number;
  state: string;
  updated_at: string;
  uploader: Author | null;
  url: string;
}

export interface Author {
  avatar_url: string;
  events_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  gravatar_id: null | string;
  html_url: string;
  id: number;
  login: string;
  node_id: string;
  organizations_url: string;
  received_events_url: string;
  repos_url: string;
  site_admin: boolean;
  starred_url: string;
  subscriptions_url: string;
  type: string;
  url: string;
  user_view_type: string;
}

export interface Release {
  assets: Asset[];
  assets_url?: string;
  author?: Author;
  body?: null | string;
  created_at?: string;
  discussion_url?: string;
  draft?: boolean;
  html_url?: string;
  id?: number;
  mentions_count?: number;
  name?: null | string;
  node_id?: string;
  prerelease: boolean;
  published_at?: string;
  tag_name: string;
  tarball_url?: null | string;
  target_commitish?: string;
  upload_url?: string;
  url?: string;
  zipball_url?: null | string;
}
