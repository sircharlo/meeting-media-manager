import type { FontName } from 'src/types';

import { useJwStore } from 'src/stores/jw';

const jwStore = useJwStore();
const { urlVariables } = jwStore;

const mediatorBaseUrl = urlVariables.mediator
  ? new URL(urlVariables.mediator).hostname
  : '';

export const FONT_URLS: Record<FontName, string> = {
  'JW-Icons': `https://wol.${urlVariables.base}/assets/fonts/jw-icons-external-1970474.woff`,
  'WT-ClearText-Bold': `https://${mediatorBaseUrl}/fonts/wt-clear-text/1.019/Wt-ClearText-Bold.woff2`,
  // 'NotoSerif': 'https://fonts.googleapis.com/css2?family=Noto+Serif:wght@100..900&display=swap',
};
