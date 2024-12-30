import type { JwLanguageResult } from 'src/types';
import type { YeartextResult } from 'src/utils/api';

export const jwYeartext: YeartextResult = {
  content:
    '<p id="p1" data-pid="1" class="themeScrp"><strong>“When I am afraid, I put</strong></p>\r\n<p id="p2" data-pid="2" class="themeScrp"><strong>my trust in you.”</strong></p>\r\n<p id="p3" data-pid="3" class="themeScrp"><strong>—</strong><a href="/wol/bc/r1/lp-e/1102024800/0/0" data-bid="1-1" class="b"><strong>Psalm 56:3</strong></a><strong>.</strong></p>\r\n<p id="p4" data-pid="4" class="sb"></p>\r\n',
  exists: true,
  jsonUrl: '/wol/d/r1/lp-e/1102024800',
  url: '/en/wol/d/r1/lp-e/1102024800',
};

export const jwLangs: JwLanguageResult = {
  languages: [
    {
      altSpellings: ['English'],
      direction: 'ltr',
      hasWebContent: true,
      isCounted: true,
      isSignLanguage: false,
      langcode: 'E',
      name: 'English',
      script: 'ROMAN',
      symbol: 'en',
      vernacularName: 'English',
    },
    {
      altSpellings: ['Dutch', 'Nederlands'],
      direction: 'ltr',
      hasWebContent: true,
      isCounted: true,
      isSignLanguage: false,
      langcode: 'O',
      name: 'Dutch',
      script: 'ROMAN',
      symbol: 'nl',
      vernacularName: 'Nederlands',
    },
  ],
  localizedCount: '2',
  status: 200,
};
