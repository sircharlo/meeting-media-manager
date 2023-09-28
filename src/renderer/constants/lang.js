const DAYJS_LOCALES = [
  'de',
  'el',
  'en',
  'es',
  'et',
  'fi',
  'fr',
  'hu',
  'it',
  // 'mg', not yet supported by dayjs
  'nl',
  'pt',
  'pt-br',
  'ro',
  'ru',
  'sk',
  'sl',
  'sv',
  'uk',
  // 'wes-x-pgw', // not yet supported by dayjs
  // 'rmn-x-rmg', // not yet supported by dayjs
]

// Languages that have no active translator
const STALE_LANGS = []

const LOCALES = [
  {
    code: 'de',
    iso: 'de-DE',
    file: 'de.json',
    jw: 'X',
    name: 'Deutsch (German)',
  },
  {
    "code": "el",
    "iso": "el-GR",
    "file": "el.json",
    "jw": "G",
    "name": "Ελληνικά (Greek)"
  },
  {
    code: 'en',
    iso: 'en-US',
    file: 'en.json',
    jw: 'E',
    name: 'English (English)',
  },
  {
    code: 'es',
    iso: 'es-ES',
    file: 'es.json',
    jw: 'S',
    name: 'español (Spanish)',
  },
  {
    code: 'et',
    iso: 'et-EE',
    file: 'et.json',
    jw: 'ST',
    name: 'eesti (Estonian)',
  },
  {
    code: 'fi',
    iso: 'fi-FI',
    file: 'fi.json',
    jw: 'FI',
    name: 'suomi (Finnish)',
  },
  {
    code: 'fr',
    iso: 'fr-FR',
    file: 'fr.json',
    jw: 'F',
    name: 'Français (French)',
  },
  {
    code: 'hu',
    iso: 'hu-HU',
    file: 'hu.json',
    jw: 'H',
    name: 'magyar (Hungarian)',
  },
  {
    code: 'it',
    iso: 'it-IT',
    file: 'it.json',
    jw: 'I',
    name: 'Italiano (Italian)',
  },
  {
    code: 'mg',
    iso: 'mg-MG',
    file: 'mg.json',
    jw: 'MG',
    dayjs: 'en',
    name: 'Malagasy (Malagasy)',
  },
  {
    code: 'nl',
    iso: 'nl-NL',
    file: 'nl.json',
    jw: 'O',
    name: 'Nederlands (Dutch)',
  },
  {
    code: 'pt-pt',
    iso: 'pt-PT',
    file: 'pt-pt.json',
    jw: 'TPO',
    dayjs: 'pt',
    name: 'Português - Portugal (Portuguese - Portugal)',
  },
  {
    code: 'pt',
    iso: 'pt-BR',
    file: 'pt.json',
    jw: 'T',
    dayjs: 'pt-br',
    name: 'Português - Brasil (Portuguese - Brazil)',
  },
  {
    "code": "rmn-x-rmg",
    "iso": "rmn-x-rmg",
    "file": "rmn-x-rmg.json",
    "jw": "RMG",
    "name": "Ρομανί - Νότια Ελλάδα (Romany - Southern Greece)"
  },
  {
    code: 'ro',
    iso: 'ro-RO',
    file: 'ro.json',
    jw: 'M',
    name: 'Română (Romanian)',
  },
  {
    code: 'ru',
    iso: 'ru-RU',
    file: 'ru.json',
    jw: 'U',
    name: 'русский (Russian)',
  },
  {
    code: 'sk',
    iso: 'sk-SK',
    file: 'sk.json',
    jw: 'V',
    name: 'slovenčina (Slovak)',
  },
  {
    code: 'sl',
    iso: 'sl-SI',
    file: 'sl.json',
    jw: 'SV',
    name: 'slovenščina (Slovenian)',
  },
  {
    code: 'sv',
    iso: 'sv-SE',
    file: 'sv.json',
    jw: 'Z',
    name: 'Svenska (Swedish)',
  },
  {
    code: 'uk',
    iso: 'uk-UA',
    file: 'uk.json',
    jw: 'K',
    name: 'українська (Ukrainian)',
  },
  {
    code: 'wes-x-pgw',
    iso: 'wes-x-pgw',
    file: 'wes-x-pgw.json',
    jw: 'PGW',
    dayjs: 'en',
    name: 'Pidgin - West Africa (Pidgin - West Africa)',
  },
]

const MEPS_IDS = {
  0: 'E',
  1: 'S',
  2: 'X',
  3: 'F',
  4: 'I',
  5: 'T',
  6: 'O',
  7: 'J',
  8: 'AU',
  9: 'AC',
  10: 'AF',
  11: 'AL',
  12: 'AM',
  13: 'AI',
  14: 'A',
  15: 'R',
  16: 'AE',
  18: 'IE',
  19: 'AR',
  20: 'BM',
  21: 'AO',
  23: 'BS',
  24: 'BA',
  25: 'AK',
  26: 'OI',
  27: 'BT',
  29: 'BE',
  30: 'IK',
  31: 'BI',
  32: 'LM',
  33: 'BO',
  36: 'BL',
  37: 'BU',
  38: 'CB',
  39: 'CV',
  40: 'CC',
  42: 'CN',
  43: 'CH',
  45: 'CG',
  46: 'CK',
  47: 'CW',
  48: 'NM',
  49: 'CT',
  51: 'CR',
  52: 'C',
  53: 'B',
  54: 'D',
  57: 'DI',
  58: 'DA',
  59: 'ED',
  60: 'EF',
  62: 'ST',
  63: 'EW',
  64: 'FA',
  65: 'FR',
  66: 'FN',
  67: 'FI',
  68: 'GA',
  69: 'GB',
  72: 'G',
  73: 'GL',
  74: 'GI',
  75: 'GU',
  76: 'EG',
  78: 'HK',
  79: 'HA',
  80: 'HW',
  81: 'HY',
  82: 'Q',
  83: 'HR',
  84: 'HV',
  85: 'HI',
  86: 'MO',
  89: 'H',
  90: 'IA',
  91: 'IG',
  92: 'IC',
  93: 'ID',
  96: 'IB',
  98: 'IL',
  99: 'IN',
  101: 'GC',
  103: 'IS',
  104: 'IT',
  106: 'JA',
  107: 'AH',
  108: 'KL',
  110: 'KA',
  111: 'KR',
  114: 'KS',
  115: 'KB',
  117: 'KG',
  118: 'KQ',
  119: 'KU',
  121: 'YW',
  123: 'RU',
  124: 'KI',
  128: 'KT',
  129: 'KO',
  130: 'OS',
  131: 'KP',
  132: 'UN',
  134: 'WG',
  135: 'KY',
  136: 'KW',
  138: 'LA',
  139: 'LF',
  140: 'LI',
  141: 'L',
  142: 'OM',
  144: 'LU',
  151: 'LO',
  152: 'LS',
  153: 'LV',
  155: 'MC',
  157: 'MG',
  158: 'ML',
  159: 'MY',
  160: 'MT',
  161: 'MI',
  163: 'MA',
  166: 'MR',
  167: 'RE',
  169: 'MH',
  171: 'CE',
  173: 'UU',
  174: 'MK',
  175: 'MM',
  178: 'OD',
  180: 'NP',
  181: 'MP',
  182: 'NI',
  183: 'NN',
  184: 'N',
  188: 'NZ',
  189: 'OG',
  191: 'OT',
  192: 'PU',
  194: 'PN',
  195: 'PA',
  196: 'ZN',
  197: 'PR',
  198: 'P',
  199: 'PP',
  200: 'PJ',
  201: 'RA',
  202: 'M',
  204: 'RN',
  206: 'RR',
  207: 'U',
  208: 'RT',
  209: 'SA',
  211: 'SM',
  212: 'SG',
  213: 'SE',
  214: 'SB',
  216: 'SU',
  217: 'SC',
  218: 'CA',
  219: 'SK',
  220: 'SN',
  221: 'V',
  222: 'SV',
  223: 'SP',
  225: 'SR',
  227: 'SD',
  228: 'SW',
  229: 'ZS',
  230: 'Z',
  231: 'TG',
  232: 'TH',
  234: 'TL',
  236: 'TU',
  237: 'SI',
  239: 'CI',
  240: 'TI',
  241: 'TV',
  243: 'OE',
  244: 'TO',
  245: 'TE',
  246: 'SH',
  247: 'TS',
  248: 'TN',
  249: 'TB',
  250: 'TK',
  251: 'VL',
  252: 'TW',
  253: 'K',
  254: 'UB',
  255: 'UD',
  256: 'UR',
  257: 'VE',
  258: 'VT',
  259: 'WA',
  260: 'W',
  261: 'WO',
  262: 'XO',
  263: 'YA',
  264: 'YP',
  267: 'YR',
  268: 'ZU',
  269: 'GK',
  271: 'GE',
  272: 'LD',
  273: 'OA',
  275: 'KIM',
  276: 'BQ',
  277: 'CQ',
  278: 'AN',
  279: 'CHS',
  284: 'AB',
  285: 'LT',
  286: 'MZ',
  288: 'DU',
  292: 'QU',
  293: 'QC',
  295: 'DM',
  296: 'AW',
  297: 'HM',
  298: 'RD',
  304: 'AJ',
  305: 'KAB',
  307: 'TAT',
  309: 'GBA',
  310: 'NV',
  311: 'OB',
  314: 'RM',
  316: 'WL',
  317: 'MIS',
  318: 'AZ',
  319: 'UG',
  320: 'KZ',
  321: 'AP',
  324: 'NC',
  328: 'KHK',
  329: 'YK',
  330: 'KHA',
  331: 'MAR',
  332: 'CU',
  334: 'JC',
  336: 'LAH',
  338: 'ABK',
  339: 'JL',
  342: 'BB',
  343: 'OSS',
  346: 'LR',
  347: 'KBY',
  348: 'KBR',
  350: 'RDA',
  352: 'LE',
  353: 'MAC',
  355: 'SEN',
  356: 'TJ',
  357: 'UZ',
  358: 'DR',
  360: 'ET',
  361: 'CO',
  362: 'VI',
  364: 'PJN',
  367: 'DG',
  368: 'FF',
  369: 'KIN',
  370: 'KIT',
  374: 'KIP',
  375: 'BEL',
  376: 'ALT',
  377: 'BLN',
  380: 'FO',
  382: 'GN',
  383: 'IBI',
  384: 'IH',
  385: 'TCR',
  388: 'SBO',
  390: 'MSH',
  392: 'KSN',
  393: 'REA',
  394: 'GCS',
  399: 'RCR',
  401: 'MAZ',
  403: 'TZE',
  404: 'TZO',
  405: 'UM',
  409: 'NK',
  412: 'WY',
  413: 'FT',
  414: 'BAK',
  417: 'MAY',
  419: 'LAD',
  420: 'ASL',
  421: 'QUB',
  422: 'TOB',
  424: 'TNK',
  425: 'TOT',
  426: 'VZ',
  427: 'MTU',
  428: 'PAA',
  429: 'LHK',
  431: 'MX',
  432: 'TJO',
  433: 'AJR',
  434: 'TSC',
  435: 'ZPI',
  436: 'ZPX',
  437: 'ZPV',
  438: 'ELI',
  440: 'TTP',
  442: 'CHL',
  443: 'NHT',
  445: 'TRH',
  446: 'TRS',
  448: 'IGE',
  449: 'QUA',
  450: 'LSA',
  451: 'AUS',
  452: 'LSB',
  453: 'BSL',
  454: 'SCH',
  455: 'LSC',
  456: 'CSE',
  457: 'DSL',
  458: 'NGT',
  459: 'SEC',
  461: 'FID',
  462: 'LSF',
  463: 'DGS',
  464: 'HDF',
  465: 'ISL',
  466: 'JSL',
  467: 'KSL',
  468: 'LSM',
  469: 'NDF',
  470: 'LSP',
  471: 'SPE',
  472: 'PDF',
  473: 'LSQ',
  474: 'RSL',
  475: 'LSE',
  476: 'LSV',
  477: 'PH',
  479: 'LX',
  481: 'LSN',
  482: 'RMS',
  484: 'NHG',
  485: 'TLN',
  486: 'NDA',
  487: 'DGR',
  490: 'GSL',
  493: 'LJ',
  494: 'QUN',
  496: 'QSL',
  499: 'AKA',
  505: 'XV',
  506: 'TSL',
  507: 'VSL',
  508: 'BSN',
  509: 'ZSL',
  510: 'LSL',
  516: 'CHJ',
  520: 'CLX',
  526: 'HST',
  536: 'MXG',
  537: 'MXO',
  538: 'MYO',
  539: 'MZH',
  540: 'NHH',
  541: 'NHV',
  543: 'OTM',
  549: 'PPU',
  555: 'YQ',
  557: 'PSL',
  560: 'LVA',
  562: 'OKP',
  564: 'SHU',
  565: 'AGR',
  566: 'SCR',
  569: 'KSI',
  570: 'ZPD',
  572: 'ZPL',
  577: 'ISG',
  580: 'LGP',
  581: 'LUC',
  585: 'UZR',
  588: 'SSL',
  589: 'LTS',
  592: 'SAS',
  593: 'UGA',
  594: 'GRF',
  595: 'LWX',
  600: 'SRM',
  601: 'GIB',
  602: 'INI',
  604: 'NZS',
  605: 'BVL',
  607: 'CRB',
  608: 'NBL',
  609: 'NHC',
  610: 'SWI',
  619: 'CSL',
  620: 'NGL',
  622: 'SGS',
  623: 'SBF',
  625: 'VGT',
  626: 'LSG',
  627: 'TTM',
  628: 'RPN',
  629: 'SZJ',
  632: 'MXT',
  633: 'SIL',
  634: 'MSL',
  636: 'JWK',
  642: 'FSL',
  643: 'NGB',
  644: 'CBS',
  645: 'OGS',
  646: 'CIN',
  648: 'EMB',
  649: 'MPD',
  650: 'WCH',
  652: 'SHO',
  660: 'ACH',
  661: 'AZA',
  667: 'SLM',
  668: 'NBZ',
  672: 'HZJ',
  673: 'JCR',
  674: 'KRI',
  680: 'MWL',
  681: 'TND',
  682: 'RNY',
  684: 'QIS',
  687: 'AKN',
  690: 'GTN',
  695: 'DAR',
  697: 'ABB',
  698: 'ATI',
  699: 'GUR',
  700: 'MBD',
  701: 'RMB',
  702: 'TPR',
  703: 'YCB',
  704: 'NSL',
  705: 'LMG',
  710: 'NYU',
  719: 'MAP',
  720: 'NEN',
  724: 'DGA',
  726: 'QIC',
  727: 'QII',
  728: 'QIP',
  729: 'QIT',
  733: 'TCN',
  735: 'SHC',
  736: 'ZAS',
  737: 'CNO',
  739: 'SLS',
  741: 'BIM',
  743: 'RMG',
  745: 'CPI',
  746: 'MWM',
  747: 'MKD',
  748: 'LSU',
  752: 'ALU',
  757: 'KYK',
  761: 'SGM',
  764: 'YMB',
  766: 'CGW',
  768: 'GLC',
  769: 'VLC',
  770: 'ALS',
  771: 'INS',
  772: 'MYW',
  774: 'PMN',
  775: 'PRA',
  777: 'WRO',
  780: 'KGL',
  781: 'LGA',
  783: 'NGN',
  785: 'TPO',
  795: 'AMG',
  796: 'GRZ',
  798: 'MCS',
  801: 'PMR',
  802: 'QUH',
  803: 'PLR',
  807: 'SLV',
  810: 'LAS',
  814: 'SGR',
  817: 'BZK',
  820: 'XPA',
  822: 'ABU',
  826: 'HSK',
  827: 'TAL',
  828: 'QUL',
  829: 'GHS',
  830: 'RMA',
  841: 'PQM',
  843: 'MGL',
  848: 'TYW',
  850: 'AHN',
  858: 'TMR',
  859: 'LSS',
  860: 'OTS',
  862: 'RMC',
  872: 'DMR',
  880: 'BTK',
  883: 'TEW',
  884: 'ARH',
  887: 'PAZ',
  896: 'OTE',
  904: 'LSI',
  908: 'NKN',
  909: 'MNO',
  911: 'RMR',
  916: 'SPL',
  919: 'GCR',
  920: 'GNC',
  929: 'MBA',
  940: 'MHM',
  941: 'MHS',
  948: 'FJS',
  953: 'AJG',
  957: 'EMC',
  958: 'EMP',
  960: 'GBM',
  965: 'KBV',
  981: 'PHN',
  984: 'TBW',
  986: 'TLR',
  990: 'USL',
  992: 'TKL',
  996: 'CGM',
  997: 'FGN',
  999: 'MTC',
  1001: 'RME',
  1011: 'CGS',
  1013: 'GHM',
  1016: 'SSA',
  1023: 'NMB',
  1025: 'RMV',
  1032: 'RMX',
  1037: 'NNS',
  1043: 'ESL',
  1071: 'CHC',
  1072: 'CNS',
  1073: 'LMB',
  1077: 'EWN',
  1078: 'MKA',
  1084: 'JML',
  1090: 'HMS',
  1099: 'HMA',
  1111: 'MTN',
  1122: 'KGG',
  1123: 'NGU',
  1124: 'STM',
  1132: 'PGW',
  1156: 'CGG',
  1157: 'HVU',
  1171: 'CQC',
  1185: 'KKL',
  1216: 'MIR',
  1218: 'RNN',
  1238: 'NSM',
  1246: 'HWP',
  1253: 'QIX',
  1258: 'STN',
  1268: 'BRS',
  1286: 'LBS',
}

const FALLBACK_SITE_LANGS_DATE = "2023-08-14"
const FALLBACK_SITE_LANGS = [
  {
    "name": "Abaknon",
    "langcode": "ABN",
    "symbol": "abx",
    "vernacularName": "Abaknon",
    "isSignLanguage": false
  },
  {
    "name": "Abbey",
    "langcode": "ABB",
    "symbol": "aba",
    "vernacularName": "Abɛ",
    "isSignLanguage": false
  },
  {
    "name": "Abkhaz",
    "langcode": "ABK",
    "symbol": "ab",
    "vernacularName": "аԥсуа",
    "isSignLanguage": false
  },
  {
    "name": "Abua",
    "langcode": "AU",
    "symbol": "abn",
    "vernacularName": "Abua",
    "isSignLanguage": false
  },
  {
    "name": "Abui",
    "langcode": "ABU",
    "symbol": "abz",
    "vernacularName": "Alor Abui",
    "isSignLanguage": false
  },
  {
    "name": "Achi",
    "langcode": "ACH",
    "symbol": "acr",
    "vernacularName": "achi",
    "isSignLanguage": false
  },
  {
    "name": "Acholi",
    "langcode": "AC",
    "symbol": "ach",
    "vernacularName": "Acholi",
    "isSignLanguage": false
  },
  {
    "name": "Afrikaans",
    "langcode": "AF",
    "symbol": "af",
    "vernacularName": "Afrikaans",
    "isSignLanguage": false
  },
  {
    "name": "Ahanta",
    "langcode": "AHN",
    "symbol": "aha",
    "vernacularName": "Aɣɩnda",
    "isSignLanguage": false
  },
  {
    "name": "Aja",
    "langcode": "AJG",
    "symbol": "ajg",
    "vernacularName": "Aja",
    "isSignLanguage": false
  },
  {
    "name": "Akha",
    "langcode": "AKA",
    "symbol": "ahk",
    "vernacularName": "Akha",
    "isSignLanguage": false
  },
  {
    "name": "Albanian",
    "langcode": "AL",
    "symbol": "sq",
    "vernacularName": "shqip",
    "isSignLanguage": false
  },
  {
    "name": "Albanian Sign Language",
    "langcode": "ALS",
    "symbol": "sqk",
    "vernacularName": "shqipe e shenjave",
    "isSignLanguage": true
  },
  {
    "name": "Altai",
    "langcode": "ALT",
    "symbol": "alt",
    "vernacularName": "алтай",
    "isSignLanguage": false
  },
  {
    "name": "Alur",
    "langcode": "ALU",
    "symbol": "alz",
    "vernacularName": "Alur",
    "isSignLanguage": false
  },
  {
    "name": "Ambae (East)",
    "langcode": "ABE",
    "symbol": "omb",
    "vernacularName": "Ambae (East)",
    "isSignLanguage": false
  },
  {
    "name": "American Sign Language",
    "langcode": "ASL",
    "symbol": "ase",
    "vernacularName": "American Sign Language",
    "isSignLanguage": true
  },
  {
    "name": "Amharic",
    "langcode": "AM",
    "symbol": "am",
    "vernacularName": "አማርኛ",
    "isSignLanguage": false
  },
  {
    "name": "Amis",
    "langcode": "AI",
    "symbol": "ami",
    "vernacularName": "阿美語",
    "isSignLanguage": false
  },
  {
    "name": "Amuzgo (Guerrero)",
    "langcode": "AMG",
    "symbol": "amu",
    "vernacularName": "ñoomndaa",
    "isSignLanguage": false
  },
  {
    "name": "Angolan Sign Language",
    "langcode": "LAS",
    "symbol": "sgn-ao",
    "vernacularName": "Língua angolana de sinais",
    "isSignLanguage": true
  },
  {
    "name": "Arabic",
    "langcode": "A",
    "symbol": "ar",
    "vernacularName": "العربية",
    "isSignLanguage": false
  },
  {
    "name": "Arabic (Egypt)",
    "langcode": "AEY",
    "symbol": "arz",
    "vernacularName": "العربية (اللهجة المصرية)",
    "isSignLanguage": false
  },
  {
    "name": "Arabic (Lebanon)",
    "langcode": "ALN",
    "symbol": "apc",
    "vernacularName": "العربية (اللهجة اللبنانية)",
    "isSignLanguage": false
  },
  {
    "name": "Argentinean Sign Language",
    "langcode": "LSA",
    "symbol": "aed",
    "vernacularName": "lengua de señas argentina",
    "isSignLanguage": true
  },
  {
    "name": "Arhuaco",
    "langcode": "ARH",
    "symbol": "arh",
    "vernacularName": "Arhuaco",
    "isSignLanguage": false
  },
  {
    "name": "Armenian",
    "langcode": "REA",
    "symbol": "hy",
    "vernacularName": "Հայերեն",
    "isSignLanguage": false
  },
  {
    "name": "Armenian (West)",
    "langcode": "R",
    "symbol": "hyw",
    "vernacularName": "Արեւմտահայերէն",
    "isSignLanguage": false
  },
  {
    "name": "Ashaninka",
    "langcode": "AHK",
    "symbol": "cni",
    "vernacularName": "ashaninka",
    "isSignLanguage": false
  },
  {
    "name": "Assamese",
    "langcode": "AE",
    "symbol": "as",
    "vernacularName": "অসমীয়া",
    "isSignLanguage": false
  },
  {
    "name": "Ateso",
    "langcode": "IE",
    "symbol": "teo",
    "vernacularName": "Ateso",
    "isSignLanguage": false
  },
  {
    "name": "Attié",
    "langcode": "ATI",
    "symbol": "ati",
    "vernacularName": "Akie",
    "isSignLanguage": false
  },
  {
    "name": "Aukan",
    "langcode": "AKN",
    "symbol": "djk",
    "vernacularName": "Okanisitongo",
    "isSignLanguage": false
  },
  {
    "name": "Australian Sign Language",
    "langcode": "AUS",
    "symbol": "asf",
    "vernacularName": "Auslan (Australian Sign Language)",
    "isSignLanguage": true
  },
  {
    "name": "Austrian Sign Language",
    "langcode": "OGS",
    "symbol": "asq",
    "vernacularName": "Österreichische Gebärdensprache",
    "isSignLanguage": true
  },
  {
    "name": "Awajun",
    "langcode": "AGR",
    "symbol": "agr",
    "vernacularName": "awajun",
    "isSignLanguage": false
  },
  {
    "name": "Aymara",
    "langcode": "AP",
    "symbol": "ay",
    "vernacularName": "Aymara",
    "isSignLanguage": false
  },
  {
    "name": "Azerbaijani",
    "langcode": "AJR",
    "symbol": "az",
    "vernacularName": "Azərbaycan",
    "isSignLanguage": false
  },
  {
    "name": "Azerbaijani (Arabic)",
    "langcode": "AJA",
    "symbol": "azb",
    "vernacularName": "آذربايجانى (عربى)",
    "isSignLanguage": false
  },
  {
    "name": "Azerbaijani (Cyrillic)",
    "langcode": "AJ",
    "symbol": "az-cyrl",
    "vernacularName": "Aзәрбајҹан (кирил әлифбасы)",
    "isSignLanguage": false
  },
  {
    "name": "Ba",
    "langcode": "FNB",
    "symbol": "wyy-x-fnb",
    "vernacularName": "Ba",
    "isSignLanguage": false
  },
  {
    "name": "Balinese",
    "langcode": "BLN",
    "symbol": "ban",
    "vernacularName": "Bali",
    "isSignLanguage": false
  },
  {
    "name": "Bambara",
    "langcode": "AR",
    "symbol": "bm",
    "vernacularName": "Bamanankan",
    "isSignLanguage": false
  },
  {
    "name": "Baoule",
    "langcode": "AO",
    "symbol": "bci",
    "vernacularName": "Wawle",
    "isSignLanguage": false
  },
  {
    "name": "Bariba",
    "langcode": "BB",
    "symbol": "bba",
    "vernacularName": "Baatɔnum",
    "isSignLanguage": false
  },
  {
    "name": "Bashkir",
    "langcode": "BAK",
    "symbol": "ba",
    "vernacularName": "башҡорт",
    "isSignLanguage": false
  },
  {
    "name": "Basque",
    "langcode": "BQ",
    "symbol": "eu",
    "vernacularName": "Euskara",
    "isSignLanguage": false
  },
  {
    "name": "Bassa (Cameroon)",
    "langcode": "BS",
    "symbol": "bas",
    "vernacularName": "Basaa (Kamerun)",
    "isSignLanguage": false
  },
  {
    "name": "Bassa (Liberia)",
    "langcode": "BA",
    "symbol": "bsq",
    "vernacularName": "Ɓǎsɔ́ɔ̀ (Ɖàbíɖà)",
    "isSignLanguage": false
  },
  {
    "name": "Batak (Karo)",
    "langcode": "AK",
    "symbol": "btx",
    "vernacularName": "Batak (Karo)",
    "isSignLanguage": false
  },
  {
    "name": "Batak (Simalungun)",
    "langcode": "BTK",
    "symbol": "bts",
    "vernacularName": "Batak (Simalungun)",
    "isSignLanguage": false
  },
  {
    "name": "Batak (Toba)",
    "langcode": "BT",
    "symbol": "bbc",
    "vernacularName": "Batak (Toba)",
    "isSignLanguage": false
  },
  {
    "name": "Belgian French Sign Language",
    "langcode": "SBF",
    "symbol": "sfb",
    "vernacularName": "Langue des signes belge francophone",
    "isSignLanguage": true
  },
  {
    "name": "Belize Kriol",
    "langcode": "BZK",
    "symbol": "bzj",
    "vernacularName": "Bileez Kriol",
    "isSignLanguage": false
  },
  {
    "name": "Belorussian",
    "langcode": "BEL",
    "symbol": "be",
    "vernacularName": "беларуская",
    "isSignLanguage": false
  },
  {
    "name": "Bengali",
    "langcode": "BE",
    "symbol": "bn",
    "vernacularName": "বাংলা",
    "isSignLanguage": false
  },
  {
    "name": "Biak",
    "langcode": "IK",
    "symbol": "bhw",
    "vernacularName": "Biak",
    "isSignLanguage": false
  },
  {
    "name": "Bicol",
    "langcode": "BI",
    "symbol": "bcl",
    "vernacularName": "Bicol",
    "isSignLanguage": false
  },
  {
    "name": "Bislama",
    "langcode": "LM",
    "symbol": "bi",
    "vernacularName": "Bislama",
    "isSignLanguage": false
  },
  {
    "name": "Bissau Guinean Creole",
    "langcode": "TCR",
    "symbol": "pov",
    "vernacularName": "Kriol di Gine-Bisau",
    "isSignLanguage": false
  },
  {
    "name": "Bolivian Sign Language",
    "langcode": "BVL",
    "symbol": "bvl",
    "vernacularName": "lengua de señas boliviana",
    "isSignLanguage": true
  },
  {
    "name": "Bosnian",
    "langcode": "BSN",
    "symbol": "bs",
    "vernacularName": "bosanski",
    "isSignLanguage": false
  },
  {
    "name": "Boulou",
    "langcode": "BO",
    "symbol": "bum",
    "vernacularName": "Bulu",
    "isSignLanguage": false
  },
  {
    "name": "Brazilian Sign Language",
    "langcode": "LSB",
    "symbol": "bzs",
    "vernacularName": "Língua brasileira de sinais (Libras)",
    "isSignLanguage": true
  },
  {
    "name": "British Sign Language",
    "langcode": "BSL",
    "symbol": "bfi",
    "vernacularName": "British Sign Language",
    "isSignLanguage": true
  },
  {
    "name": "Bulgarian",
    "langcode": "BL",
    "symbol": "bg",
    "vernacularName": "български",
    "isSignLanguage": false
  },
  {
    "name": "Bunun (South)",
    "langcode": "BNN",
    "symbol": "bnn",
    "vernacularName": "布農語（南部）",
    "isSignLanguage": false
  },
  {
    "name": "Burundi Sign Language",
    "langcode": "BRS",
    "symbol": "sgn-bi",
    "vernacularName": "Langue des signes burundaise",
    "isSignLanguage": true
  },
  {
    "name": "Bété",
    "langcode": "ET",
    "symbol": "btg",
    "vernacularName": "ˈBhɛtɩgbʋʋ",
    "isSignLanguage": false
  },
  {
    "name": "Cakchiquel (Central)",
    "langcode": "CQC",
    "symbol": "cak-x-cqc",
    "vernacularName": "Kaqchikel (Chimaltenango)",
    "isSignLanguage": false
  },
  {
    "name": "Cakchiquel (Western)",
    "langcode": "CQ",
    "symbol": "cak",
    "vernacularName": "Kaqchikel (Sololá)",
    "isSignLanguage": false
  },
  {
    "name": "Cambodian",
    "langcode": "CB",
    "symbol": "km",
    "vernacularName": "ខ្មែរ",
    "isSignLanguage": false
  },
  {
    "name": "Cameroon Sign Language",
    "langcode": "CML",
    "symbol": "sgn-cm",
    "vernacularName": "Langue des signes camerounaise",
    "isSignLanguage": true
  },
  {
    "name": "Carib",
    "langcode": "CRB",
    "symbol": "car-x-crb",
    "vernacularName": "Kariʼnia",
    "isSignLanguage": false
  },
  {
    "name": "Catalan",
    "langcode": "AN",
    "symbol": "cat",
    "vernacularName": "català",
    "isSignLanguage": false
  },
  {
    "name": "Cebuano",
    "langcode": "CV",
    "symbol": "ceb",
    "vernacularName": "Cebuano",
    "isSignLanguage": false
  },
  {
    "name": "Changana (Mozambique)",
    "langcode": "CGM",
    "symbol": "tso-mz",
    "vernacularName": "xiChangana (Moçambique)",
    "isSignLanguage": false
  },
  {
    "name": "Chavacano",
    "langcode": "CC",
    "symbol": "cbk",
    "vernacularName": "Chavacano",
    "isSignLanguage": false
  },
  {
    "name": "Chichewa",
    "langcode": "CN",
    "symbol": "ny",
    "vernacularName": "Chichewa",
    "isSignLanguage": false
  },
  {
    "name": "Chiga",
    "langcode": "CGG",
    "symbol": "cgg",
    "vernacularName": "Orukiga",
    "isSignLanguage": false
  },
  {
    "name": "Chilean Sign Language",
    "langcode": "SCH",
    "symbol": "csg",
    "vernacularName": "lengua de señas chilena",
    "isSignLanguage": true
  },
  {
    "name": "Chin (Hakha)",
    "langcode": "HK",
    "symbol": "cnh",
    "vernacularName": "Chin (Hakha)",
    "isSignLanguage": false
  },
  {
    "name": "Chin (Tiddim)",
    "langcode": "CI",
    "symbol": "ctd",
    "vernacularName": "Chin (Tedim)",
    "isSignLanguage": false
  },
  {
    "name": "Chinantec (Ojitlan)",
    "langcode": "CNO",
    "symbol": "chj",
    "vernacularName": "jújmi kiʼtsa köwɨ̱",
    "isSignLanguage": false
  },
  {
    "name": "Chinese (Yunnanese)",
    "langcode": "CHK",
    "symbol": "cmn-x-chk",
    "vernacularName": "Chinese (Yunnanese)",
    "isSignLanguage": false
  },
  {
    "name": "Chinese Cantonese (Simplified)",
    "langcode": "CNS",
    "symbol": "yue-hans",
    "vernacularName": "中文简体（广东话）",
    "isSignLanguage": false
  },
  {
    "name": "Chinese Cantonese (Traditional)",
    "langcode": "CHC",
    "symbol": "yue-hant",
    "vernacularName": "中文繁體（廣東話）",
    "isSignLanguage": false
  },
  {
    "name": "Chinese Mandarin (Simplified)",
    "langcode": "CHS",
    "symbol": "cmn-hans",
    "vernacularName": "中文简体（普通话）",
    "isSignLanguage": false
  },
  {
    "name": "Chinese Mandarin (Traditional)",
    "langcode": "CH",
    "symbol": "cmn-hant",
    "vernacularName": "中文繁體（國語）",
    "isSignLanguage": false
  },
  {
    "name": "Chinese Sign Language",
    "langcode": "CSL",
    "symbol": "csl",
    "vernacularName": "中国手语",
    "isSignLanguage": true
  },
  {
    "name": "Chitonga",
    "langcode": "CG",
    "symbol": "toi",
    "vernacularName": "Chitonga",
    "isSignLanguage": false
  },
  {
    "name": "Chitonga (Malawi)",
    "langcode": "CT",
    "symbol": "tog",
    "vernacularName": "Chitonga (Malawi)",
    "isSignLanguage": false
  },
  {
    "name": "Chitonga (Zimbabwe)",
    "langcode": "CGW",
    "symbol": "toi-zw",
    "vernacularName": "Chitonga (Zimbabwe)",
    "isSignLanguage": false
  },
  {
    "name": "Chitumbuka",
    "langcode": "TB",
    "symbol": "tum",
    "vernacularName": "Chitumbuka",
    "isSignLanguage": false
  },
  {
    "name": "Chiyao",
    "langcode": "YA",
    "symbol": "yao",
    "vernacularName": "Chiyao",
    "isSignLanguage": false
  },
  {
    "name": "Chokwe",
    "langcode": "CK",
    "symbol": "cjk",
    "vernacularName": "Chokwe",
    "isSignLanguage": false
  },
  {
    "name": "Chol",
    "langcode": "CHL",
    "symbol": "ctu",
    "vernacularName": "ch'ol",
    "isSignLanguage": false
  },
  {
    "name": "Chontal (Oaxaca)",
    "langcode": "CLX",
    "symbol": "chd",
    "vernacularName": "lataiki",
    "isSignLanguage": false
  },
  {
    "name": "Chopi",
    "langcode": "CPI",
    "symbol": "cce",
    "vernacularName": "Txitxopi",
    "isSignLanguage": false
  },
  {
    "name": "Chuabo",
    "langcode": "CO",
    "symbol": "chw",
    "vernacularName": "Etxuwabo",
    "isSignLanguage": false
  },
  {
    "name": "Chuj",
    "langcode": "CHJ",
    "symbol": "cac",
    "vernacularName": "chuj",
    "isSignLanguage": false
  },
  {
    "name": "Chuukese",
    "langcode": "TE",
    "symbol": "chk",
    "vernacularName": "Chuuk",
    "isSignLanguage": false
  },
  {
    "name": "Chuvash",
    "langcode": "CU",
    "symbol": "cv",
    "vernacularName": "чӑвашла",
    "isSignLanguage": false
  },
  {
    "name": "Cibemba",
    "langcode": "CW",
    "symbol": "bem",
    "vernacularName": "Cibemba",
    "isSignLanguage": false
  },
  {
    "name": "Cinamwanga",
    "langcode": "NM",
    "symbol": "mwn",
    "vernacularName": "Cinamwanga",
    "isSignLanguage": false
  },
  {
    "name": "Cinyanja",
    "langcode": "CIN",
    "symbol": "nya",
    "vernacularName": "Cinyanja",
    "isSignLanguage": false
  },
  {
    "name": "Colombian Sign Language",
    "langcode": "LSC",
    "symbol": "csn",
    "vernacularName": "lengua de señas colombiana",
    "isSignLanguage": true
  },
  {
    "name": "Congolese Sign Language",
    "langcode": "CGS",
    "symbol": "sgn-cd",
    "vernacularName": "Langue des signes congolaise",
    "isSignLanguage": true
  },
  {
    "name": "Costa Rican Sign Language",
    "langcode": "SCR",
    "symbol": "csr",
    "vernacularName": "lengua de señas costarricense",
    "isSignLanguage": true
  },
  {
    "name": "Croatian",
    "langcode": "C",
    "symbol": "hr",
    "vernacularName": "hrvatski",
    "isSignLanguage": false
  },
  {
    "name": "Croatian Sign Language",
    "langcode": "HZJ",
    "symbol": "csq",
    "vernacularName": "hrvatski znakovni jezik",
    "isSignLanguage": true
  },
  {
    "name": "Cuban Sign Language",
    "langcode": "CBS",
    "symbol": "csf",
    "vernacularName": "lenguaje de señas cubano",
    "isSignLanguage": true
  },
  {
    "name": "Czech",
    "langcode": "B",
    "symbol": "cs",
    "vernacularName": "čeština",
    "isSignLanguage": false
  },
  {
    "name": "Czech Sign Language",
    "langcode": "CSE",
    "symbol": "cse",
    "vernacularName": "český znakový jazyk",
    "isSignLanguage": true
  },
  {
    "name": "Dagaare",
    "langcode": "DGA",
    "symbol": "dga",
    "vernacularName": "Dagaare",
    "isSignLanguage": false
  },
  {
    "name": "Damara",
    "langcode": "DMR",
    "symbol": "naq-x-dmr",
    "vernacularName": "Damara",
    "isSignLanguage": false
  },
  {
    "name": "Dangme",
    "langcode": "DG",
    "symbol": "ada",
    "vernacularName": "Dangme",
    "isSignLanguage": false
  },
  {
    "name": "Danish",
    "langcode": "D",
    "symbol": "da",
    "vernacularName": "Dansk",
    "isSignLanguage": false
  },
  {
    "name": "Danish Sign Language",
    "langcode": "DSL",
    "symbol": "dsl",
    "vernacularName": "Dansk tegnsprog",
    "isSignLanguage": true
  },
  {
    "name": "Dari",
    "langcode": "DAR",
    "symbol": "prs",
    "vernacularName": "دری",
    "isSignLanguage": false
  },
  {
    "name": "Digor",
    "langcode": "DGR",
    "symbol": "os-x-dgr",
    "vernacularName": "дигорон",
    "isSignLanguage": false
  },
  {
    "name": "Dinka",
    "langcode": "DI",
    "symbol": "din",
    "vernacularName": "Dinka",
    "isSignLanguage": false
  },
  {
    "name": "Douala",
    "langcode": "DA",
    "symbol": "dua",
    "vernacularName": "Douala",
    "isSignLanguage": false
  },
  {
    "name": "Drehu",
    "langcode": "LF",
    "symbol": "dhv",
    "vernacularName": "Drehu",
    "isSignLanguage": false
  },
  {
    "name": "Dutch",
    "langcode": "O",
    "symbol": "nl",
    "vernacularName": "Nederlands",
    "isSignLanguage": false
  },
  {
    "name": "Dutch Sign Language",
    "langcode": "NGT",
    "symbol": "dse",
    "vernacularName": "Nederlandse Gebarentaal",
    "isSignLanguage": true
  },
  {
    "name": "Ecuadorian Sign Language",
    "langcode": "SEC",
    "symbol": "ecs",
    "vernacularName": "lengua de señas ecuatoriana",
    "isSignLanguage": true
  },
  {
    "name": "Edo",
    "langcode": "ED",
    "symbol": "bin",
    "vernacularName": "Edo",
    "isSignLanguage": false
  },
  {
    "name": "Efate (North)",
    "langcode": "EFN",
    "symbol": "llp",
    "vernacularName": "Efate (North)",
    "isSignLanguage": false
  },
  {
    "name": "Efate (South)",
    "langcode": "EFS",
    "symbol": "erk",
    "vernacularName": "Efate (South)",
    "isSignLanguage": false
  },
  {
    "name": "Efik",
    "langcode": "EF",
    "symbol": "efi",
    "vernacularName": "Efịk",
    "isSignLanguage": false
  },
  {
    "name": "Emberá (Catío)",
    "langcode": "EMB",
    "symbol": "cto",
    "vernacularName": "embera katio",
    "isSignLanguage": false
  },
  {
    "name": "Emberá (Chamí)",
    "langcode": "EMC",
    "symbol": "cmi",
    "vernacularName": "ẽbẽra beɗea chamí",
    "isSignLanguage": false
  },
  {
    "name": "Emberá (Northern)",
    "langcode": "EMP",
    "symbol": "emp",
    "vernacularName": "Emberá dóbida",
    "isSignLanguage": false
  },
  {
    "name": "English",
    "langcode": "E",
    "symbol": "en",
    "vernacularName": "English",
    "isSignLanguage": false,
    "wAvailable": true,
    "mwbAvailable": true
  },
  {
    "name": "Esan",
    "langcode": "IH",
    "symbol": "ish",
    "vernacularName": "Esan",
    "isSignLanguage": false
  },
  {
    "name": "Estonian",
    "langcode": "ST",
    "symbol": "et",
    "vernacularName": "eesti",
    "isSignLanguage": false
  },
  {
    "name": "Ethiopian Sign Language",
    "langcode": "ESL",
    "symbol": "eth",
    "vernacularName": "የኢትዮጵያ ምልክት ቋንቋ",
    "isSignLanguage": true
  },
  {
    "name": "Ewe",
    "langcode": "EW",
    "symbol": "ee",
    "vernacularName": "Eʋegbe",
    "isSignLanguage": false
  },
  {
    "name": "Ewondo",
    "langcode": "EWN",
    "symbol": "ewo",
    "vernacularName": "Ewondo",
    "isSignLanguage": false
  },
  {
    "name": "Fang",
    "langcode": "FGN",
    "symbol": "fan",
    "vernacularName": "Fang",
    "isSignLanguage": false
  },
  {
    "name": "Fante",
    "langcode": "FA",
    "symbol": "fat",
    "vernacularName": "Mfantse",
    "isSignLanguage": false
  },
  {
    "name": "Faroese",
    "langcode": "FR",
    "symbol": "fo",
    "vernacularName": "Føroyskt",
    "isSignLanguage": false
  },
  {
    "name": "Fiji Sign Language",
    "langcode": "FJS",
    "symbol": "sgn-fj",
    "vernacularName": "Fiji Sign Language",
    "isSignLanguage": true
  },
  {
    "name": "Fijian",
    "langcode": "FN",
    "symbol": "fj",
    "vernacularName": "vakaViti",
    "isSignLanguage": false
  },
  {
    "name": "Filipino Sign Language",
    "langcode": "FSL",
    "symbol": "psp",
    "vernacularName": "Filipino Sign Language",
    "isSignLanguage": true
  },
  {
    "name": "Finnish",
    "langcode": "FI",
    "symbol": "fi",
    "vernacularName": "suomi",
    "isSignLanguage": false
  },
  {
    "name": "Finnish Sign Language",
    "langcode": "FID",
    "symbol": "fse",
    "vernacularName": "suomalainen viittomakieli",
    "isSignLanguage": true
  },
  {
    "name": "Flemish Sign Language",
    "langcode": "VGT",
    "symbol": "vgt",
    "vernacularName": "Vlaamse Gebarentaal",
    "isSignLanguage": true
  },
  {
    "name": "Fon",
    "langcode": "FO",
    "symbol": "fon",
    "vernacularName": "Fɔngbe",
    "isSignLanguage": false
  },
  {
    "name": "Frafra",
    "langcode": "FF",
    "symbol": "gur",
    "vernacularName": "Farefare",
    "isSignLanguage": false
  },
  {
    "name": "French",
    "langcode": "F",
    "symbol": "fr",
    "vernacularName": "Français",
    "isSignLanguage": false,
    "wAvailable": true,
    "mwbAvailable": true
  },
  {
    "name": "French Sign Language",
    "langcode": "LSF",
    "symbol": "fsl",
    "vernacularName": "Langue des signes française",
    "isSignLanguage": true
  },
  {
    "name": "Futuna (East)",
    "langcode": "FT",
    "symbol": "fud",
    "vernacularName": "Fakafutuna",
    "isSignLanguage": false
  },
  {
    "name": "Ga",
    "langcode": "GA",
    "symbol": "gaa",
    "vernacularName": "Ga",
    "isSignLanguage": false
  },
  {
    "name": "Galician",
    "langcode": "GLC",
    "symbol": "gl",
    "vernacularName": "Galego",
    "isSignLanguage": false
  },
  {
    "name": "Garifuna",
    "langcode": "GRF",
    "symbol": "cab",
    "vernacularName": "Garifuna",
    "isSignLanguage": false
  },
  {
    "name": "Gbaya",
    "langcode": "GBA",
    "symbol": "gba",
    "vernacularName": "Gbaya",
    "isSignLanguage": false
  },
  {
    "name": "Georgian",
    "langcode": "GE",
    "symbol": "ka",
    "vernacularName": "ქართული",
    "isSignLanguage": false
  },
  {
    "name": "German",
    "langcode": "X",
    "symbol": "de",
    "vernacularName": "Deutsch",
    "isSignLanguage": false
  },
  {
    "name": "German Sign Language",
    "langcode": "DGS",
    "symbol": "gsg",
    "vernacularName": "Deutsche Gebärdensprache",
    "isSignLanguage": true
  },
  {
    "name": "Ghanaian Sign Language",
    "langcode": "GHS",
    "symbol": "gse",
    "vernacularName": "Ghanaian Sign Language",
    "isSignLanguage": true
  },
  {
    "name": "Ghomálá’",
    "langcode": "GHM",
    "symbol": "bbj",
    "vernacularName": "Bandjoun-Baham",
    "isSignLanguage": false
  },
  {
    "name": "Gitonga",
    "langcode": "GTN",
    "symbol": "toh",
    "vernacularName": "Gitonga",
    "isSignLanguage": false
  },
  {
    "name": "Gokana",
    "langcode": "GN",
    "symbol": "gkn",
    "vernacularName": "Gokana",
    "isSignLanguage": false
  },
  {
    "name": "Gourmanchéma",
    "langcode": "GRC",
    "symbol": "gux",
    "vernacularName": "Gulmancema",
    "isSignLanguage": false
  },
  {
    "name": "Greek",
    "langcode": "G",
    "symbol": "el",
    "vernacularName": "Ελληνική",
    "isSignLanguage": false
  },
  {
    "name": "Greek Sign Language",
    "langcode": "GSL",
    "symbol": "gss",
    "vernacularName": "Ελληνική Νοηματική Γλώσσα",
    "isSignLanguage": true
  },
  {
    "name": "Greenlandic",
    "langcode": "GL",
    "symbol": "kl",
    "vernacularName": "Kalaallisut",
    "isSignLanguage": false
  },
  {
    "name": "Guadeloupean Creole",
    "langcode": "GCR",
    "symbol": "gcf",
    "vernacularName": "Kréyòl Gwadloup",
    "isSignLanguage": false
  },
  {
    "name": "Guambiano",
    "langcode": "GBM",
    "symbol": "gum",
    "vernacularName": "Namtrik",
    "isSignLanguage": false
  },
  {
    "name": "Guarani",
    "langcode": "GI",
    "symbol": "gug",
    "vernacularName": "guarani",
    "isSignLanguage": false
  },
  {
    "name": "Guarani (Bolivia)",
    "langcode": "GIB",
    "symbol": "gui",
    "vernacularName": "Guaraní boliviano",
    "isSignLanguage": false
  },
  {
    "name": "Guatemalan Sign Language",
    "langcode": "LSG",
    "symbol": "gsm",
    "vernacularName": "lengua de señas de Guatemala",
    "isSignLanguage": true
  },
  {
    "name": "Guerze",
    "langcode": "GRZ",
    "symbol": "gkp",
    "vernacularName": "Kpɛlɛɛwoo",
    "isSignLanguage": false
  },
  {
    "name": "Guianese Creole",
    "langcode": "GNC",
    "symbol": "gcr",
    "vernacularName": "Kréyòl gwiyanè",
    "isSignLanguage": false
  },
  {
    "name": "Gujarati",
    "langcode": "GU",
    "symbol": "gu",
    "vernacularName": "ગુજરાતી",
    "isSignLanguage": false
  },
  {
    "name": "Gujarati (Roman)",
    "langcode": "GRM",
    "symbol": "gu-latn",
    "vernacularName": "Gujarati (Roman)",
    "isSignLanguage": false
  },
  {
    "name": "Gun",
    "langcode": "EG",
    "symbol": "guw",
    "vernacularName": "Gungbe",
    "isSignLanguage": false
  },
  {
    "name": "Gun (Benin)",
    "langcode": "GNB",
    "symbol": "guw-bj",
    "vernacularName": "Gun (Benin)",
    "isSignLanguage": false
  },
  {
    "name": "Guna",
    "langcode": "UN",
    "symbol": "cuk",
    "vernacularName": "dule",
    "isSignLanguage": false
  },
  {
    "name": "Guéré",
    "langcode": "GUR",
    "symbol": "gxx",
    "vernacularName": "wɛ",
    "isSignLanguage": false
  },
  {
    "name": "Haitian Creole",
    "langcode": "CR",
    "symbol": "ht",
    "vernacularName": "Kreyòl ayisyen",
    "isSignLanguage": false,
    "wAvailable": true,
    "mwbAvailable": true
  },
  {
    "name": "Hamshen (Armenian)",
    "langcode": "HMA",
    "symbol": "hyw-x-hma",
    "vernacularName": "համշեներեն (հայերեն)",
    "isSignLanguage": false
  },
  {
    "name": "Hamshen (Cyrillic)",
    "langcode": "HMS",
    "symbol": "hyw-x-hms",
    "vernacularName": "һамшенерен (кирилица)",
    "isSignLanguage": false
  },
  {
    "name": "Hano",
    "langcode": "HNO",
    "symbol": "lml",
    "vernacularName": "Hano",
    "isSignLanguage": false
  },
  {
    "name": "Hausa",
    "langcode": "HA",
    "symbol": "ha",
    "vernacularName": "Hausa",
    "isSignLanguage": false
  },
  {
    "name": "Havu",
    "langcode": "HVU",
    "symbol": "hav",
    "vernacularName": "Ekihavu",
    "isSignLanguage": false
  },
  {
    "name": "Hawaiian",
    "langcode": "HW",
    "symbol": "haw",
    "vernacularName": "ʻŌlelo Hawaiʻi",
    "isSignLanguage": false
  },
  {
    "name": "Hawai’i Pidgin",
    "langcode": "HWP",
    "symbol": "hwc",
    "vernacularName": "Hawai’i Pidgin",
    "isSignLanguage": false
  },
  {
    "name": "Haya",
    "langcode": "HY",
    "symbol": "hay",
    "vernacularName": "Ekihaya",
    "isSignLanguage": false
  },
  {
    "name": "Hebrew",
    "langcode": "Q",
    "symbol": "he",
    "vernacularName": "עברית",
    "isSignLanguage": false
  },
  {
    "name": "Herero",
    "langcode": "HR",
    "symbol": "hz",
    "vernacularName": "Otjiherero",
    "isSignLanguage": false
  },
  {
    "name": "Hiligaynon",
    "langcode": "HV",
    "symbol": "hil",
    "vernacularName": "Hiligaynon",
    "isSignLanguage": false
  },
  {
    "name": "Hindi",
    "langcode": "HI",
    "symbol": "hi",
    "vernacularName": "हिंदी",
    "isSignLanguage": false
  },
  {
    "name": "Hindi (Fiji)",
    "langcode": "HFJ",
    "symbol": "hif",
    "vernacularName": "Hindi (Fiji)",
    "isSignLanguage": false
  },
  {
    "name": "Hindi (Roman)",
    "langcode": "HRM",
    "symbol": "hi-latn",
    "vernacularName": "Hindi (Roman)",
    "isSignLanguage": false
  },
  {
    "name": "Hiri Motu",
    "langcode": "MO",
    "symbol": "ho",
    "vernacularName": "Hiri Motu",
    "isSignLanguage": false
  },
  {
    "name": "Hmong (White)",
    "langcode": "HM",
    "symbol": "hmn",
    "vernacularName": "Hmoob Dawb",
    "isSignLanguage": false
  },
  {
    "name": "Honduras Sign Language",
    "langcode": "SHO",
    "symbol": "hds",
    "vernacularName": "lengua de señas hondureña",
    "isSignLanguage": true
  },
  {
    "name": "Huastec (San Luis Potosi)",
    "langcode": "HST",
    "symbol": "hus",
    "vernacularName": "tének",
    "isSignLanguage": false
  },
  {
    "name": "Hungarian",
    "langcode": "H",
    "symbol": "hu",
    "vernacularName": "magyar",
    "isSignLanguage": false
  },
  {
    "name": "Hungarian Sign Language",
    "langcode": "HDF",
    "symbol": "hsh",
    "vernacularName": "magyar jelnyelv",
    "isSignLanguage": true
  },
  {
    "name": "Hunsrik",
    "langcode": "HSK",
    "symbol": "hrx",
    "vernacularName": "Hunsrik",
    "isSignLanguage": false
  },
  {
    "name": "Iban",
    "langcode": "IA",
    "symbol": "iba",
    "vernacularName": "Iban",
    "isSignLanguage": false
  },
  {
    "name": "Ibanag",
    "langcode": "IG",
    "symbol": "ibg",
    "vernacularName": "Ibanag",
    "isSignLanguage": false
  },
  {
    "name": "Ibinda",
    "langcode": "IBI",
    "symbol": "yom-x-ibi",
    "vernacularName": "Ibinda",
    "isSignLanguage": false
  },
  {
    "name": "Icelandic",
    "langcode": "IC",
    "symbol": "is",
    "vernacularName": "íslenska",
    "isSignLanguage": false
  },
  {
    "name": "Idoma",
    "langcode": "ID",
    "symbol": "idu",
    "vernacularName": "Idoma",
    "isSignLanguage": false
  },
  {
    "name": "Igbo",
    "langcode": "IB",
    "symbol": "ig",
    "vernacularName": "Igbo",
    "isSignLanguage": false
  },
  {
    "name": "Igede",
    "langcode": "IGE",
    "symbol": "ige",
    "vernacularName": "Igede",
    "isSignLanguage": false
  },
  {
    "name": "Ijaw",
    "langcode": "IJ",
    "symbol": "ijc",
    "vernacularName": "Ijaw",
    "isSignLanguage": false
  },
  {
    "name": "Iloko",
    "langcode": "IL",
    "symbol": "ilo",
    "vernacularName": "Iloko",
    "isSignLanguage": false
  },
  {
    "name": "Indian Sign Language",
    "langcode": "INS",
    "symbol": "ins",
    "vernacularName": "Indian Sign Language",
    "isSignLanguage": true
  },
  {
    "name": "Indonesian",
    "langcode": "IN",
    "symbol": "id",
    "vernacularName": "Indonesia",
    "isSignLanguage": false
  },
  {
    "name": "Indonesian Sign Language",
    "langcode": "INI",
    "symbol": "inl",
    "vernacularName": "Bahasa Isyarat Indonesia",
    "isSignLanguage": true
  },
  {
    "name": "Irish",
    "langcode": "GC",
    "symbol": "ga",
    "vernacularName": "Gaeilge",
    "isSignLanguage": false,
    "wAvailable": true,
    "mwbAvailable": false
  },
  {
    "name": "Irish Sign Language",
    "langcode": "ISG",
    "symbol": "isg",
    "vernacularName": "Irish Sign Language",
    "isSignLanguage": true
  },
  {
    "name": "Isoko",
    "langcode": "IS",
    "symbol": "iso",
    "vernacularName": "Isoko",
    "isSignLanguage": false
  },
  {
    "name": "Israeli Sign Language",
    "langcode": "QSL",
    "symbol": "isr",
    "vernacularName": "שפת סימנים ישראלית",
    "isSignLanguage": true
  },
  {
    "name": "Italian",
    "langcode": "I",
    "symbol": "it",
    "vernacularName": "Italiano",
    "isSignLanguage": false
  },
  {
    "name": "Italian Sign Language",
    "langcode": "ISL",
    "symbol": "ise",
    "vernacularName": "Lingua dei segni italiana",
    "isSignLanguage": true
  },
  {
    "name": "Itsekiri",
    "langcode": "IT",
    "symbol": "its",
    "vernacularName": "Itsekiri",
    "isSignLanguage": false
  },
  {
    "name": "Ivorian Sign Language",
    "langcode": "LSI",
    "symbol": "sgn-ci",
    "vernacularName": "Langue des signes ivoirienne",
    "isSignLanguage": true
  },
  {
    "name": "Jamaican Creole",
    "langcode": "JCR",
    "symbol": "jam-x-jcr",
    "vernacularName": "Patwa",
    "isSignLanguage": false
  },
  {
    "name": "Jamaican Sign Language",
    "langcode": "JML",
    "symbol": "jls",
    "vernacularName": "Jamaican Sign Language",
    "isSignLanguage": true
  },
  {
    "name": "Japanese",
    "langcode": "J",
    "symbol": "ja",
    "vernacularName": "日本語",
    "isSignLanguage": false
  },
  {
    "name": "Japanese Sign Language",
    "langcode": "JSL",
    "symbol": "jsl",
    "vernacularName": "日本手話",
    "isSignLanguage": true
  },
  {
    "name": "Javanese",
    "langcode": "JA",
    "symbol": "jv",
    "vernacularName": "Jawa",
    "isSignLanguage": false
  },
  {
    "name": "Jiwaka",
    "langcode": "JWK",
    "symbol": "whg",
    "vernacularName": "Yu",
    "isSignLanguage": false
  },
  {
    "name": "Jula",
    "langcode": "JL",
    "symbol": "dyu",
    "vernacularName": "Jula",
    "isSignLanguage": false
  },
  {
    "name": "Kabardin-Cherkess",
    "langcode": "KBR",
    "symbol": "kbd",
    "vernacularName": "адыгэбзэ",
    "isSignLanguage": false
  },
  {
    "name": "Kabiye",
    "langcode": "KAB",
    "symbol": "kbp",
    "vernacularName": "Kabɩyɛ",
    "isSignLanguage": false
  },
  {
    "name": "Kabuverdianu",
    "langcode": "KBV",
    "symbol": "kea",
    "vernacularName": "Kabuverdianu",
    "isSignLanguage": false
  },
  {
    "name": "Kabyle",
    "langcode": "KBY",
    "symbol": "kab",
    "vernacularName": "Taqbaylit",
    "isSignLanguage": false
  },
  {
    "name": "Kachin",
    "langcode": "AH",
    "symbol": "kac",
    "vernacularName": "Kachin",
    "isSignLanguage": false
  },
  {
    "name": "Kadavu",
    "langcode": "KDV",
    "symbol": "fij-x-kdv",
    "vernacularName": "Kadavu",
    "isSignLanguage": false
  },
  {
    "name": "Kaingang",
    "langcode": "KGG",
    "symbol": "kgp",
    "vernacularName": "Kaingang",
    "isSignLanguage": false
  },
  {
    "name": "Kalanga (Botswana)",
    "langcode": "KL",
    "symbol": "kck-x-kl",
    "vernacularName": "Kalanga (Botswana)",
    "isSignLanguage": false
  },
  {
    "name": "Kamba",
    "langcode": "KB",
    "symbol": "kam",
    "vernacularName": "Kikamba",
    "isSignLanguage": false
  },
  {
    "name": "Kannada",
    "langcode": "KA",
    "symbol": "kn",
    "vernacularName": "ಕನ್ನಡ",
    "isSignLanguage": false
  },
  {
    "name": "Kanyok",
    "langcode": "KYK",
    "symbol": "kny",
    "vernacularName": "Ciin-kanyok",
    "isSignLanguage": false
  },
  {
    "name": "Karen (S'gaw)",
    "langcode": "KR",
    "symbol": "ksw",
    "vernacularName": "ကညီ(စှီၤ)ကျိာ်",
    "isSignLanguage": false
  },
  {
    "name": "Kazakh",
    "langcode": "AZ",
    "symbol": "kk",
    "vernacularName": "қазақ",
    "isSignLanguage": false
  },
  {
    "name": "Kazakh (Arabic)",
    "langcode": "AZA",
    "symbol": "kk-arab",
    "vernacularName": "قازاق ٴتىلى (ارابشا جازۋى)",
    "isSignLanguage": false
  },
  {
    "name": "Kekchi",
    "langcode": "GK",
    "symbol": "kek",
    "vernacularName": "Q’eqchi’",
    "isSignLanguage": false
  },
  {
    "name": "Kenyan Sign Language",
    "langcode": "KSI",
    "symbol": "xki",
    "vernacularName": "Kenyan Sign Language",
    "isSignLanguage": true
  },
  {
    "name": "Khakass",
    "langcode": "KHK",
    "symbol": "kjh",
    "vernacularName": "хакас",
    "isSignLanguage": false
  },
  {
    "name": "Khana",
    "langcode": "OG",
    "symbol": "ogo",
    "vernacularName": "Khana",
    "isSignLanguage": false
  },
  {
    "name": "Khasi",
    "langcode": "KS",
    "symbol": "kha",
    "vernacularName": "Khasi",
    "isSignLanguage": false
  },
  {
    "name": "Kikaonde",
    "langcode": "KD",
    "symbol": "kqn",
    "vernacularName": "Kikaonde",
    "isSignLanguage": false
  },
  {
    "name": "Kikongo",
    "langcode": "KG",
    "symbol": "kwy",
    "vernacularName": "Kikongo",
    "isSignLanguage": false
  },
  {
    "name": "Kikongo ya Leta",
    "langcode": "KGL",
    "symbol": "ktu-x-kgl",
    "vernacularName": "Kikongo ya leta",
    "isSignLanguage": false
  },
  {
    "name": "Kikuyu",
    "langcode": "KQ",
    "symbol": "ki",
    "vernacularName": "Gĩkũyũ",
    "isSignLanguage": false
  },
  {
    "name": "Kiluba",
    "langcode": "KU",
    "symbol": "lu",
    "vernacularName": "Kiluba",
    "isSignLanguage": false
  },
  {
    "name": "Kimbundu",
    "langcode": "KIM",
    "symbol": "kmb",
    "vernacularName": "Kimbundu",
    "isSignLanguage": false
  },
  {
    "name": "Kinande",
    "langcode": "KIN",
    "symbol": "nnb",
    "vernacularName": "Kinande",
    "isSignLanguage": false
  },
  {
    "name": "Kinyarwanda",
    "langcode": "YW",
    "symbol": "rw",
    "vernacularName": "Ikinyarwanda",
    "isSignLanguage": false
  },
  {
    "name": "Kipende",
    "langcode": "KIP",
    "symbol": "pem",
    "vernacularName": "Kipende",
    "isSignLanguage": false
  },
  {
    "name": "Kirghiz",
    "langcode": "KZ",
    "symbol": "ky",
    "vernacularName": "кыргыз",
    "isSignLanguage": false
  },
  {
    "name": "Kiribati",
    "langcode": "GB",
    "symbol": "gil",
    "vernacularName": "Kiribati",
    "isSignLanguage": false
  },
  {
    "name": "Kirundi",
    "langcode": "RU",
    "symbol": "run",
    "vernacularName": "Ikirundi",
    "isSignLanguage": false
  },
  {
    "name": "Kisi",
    "langcode": "KI",
    "symbol": "kss",
    "vernacularName": "Kisiei",
    "isSignLanguage": false
  },
  {
    "name": "Kisonge",
    "langcode": "KSN",
    "symbol": "sop",
    "vernacularName": "Kisongye",
    "isSignLanguage": false
  },
  {
    "name": "Kituba",
    "langcode": "KIT",
    "symbol": "ktu-x-kit",
    "vernacularName": "Kituba",
    "isSignLanguage": false
  },
  {
    "name": "Kokola",
    "langcode": "KKL",
    "symbol": "kzn",
    "vernacularName": "Kokola",
    "isSignLanguage": false
  },
  {
    "name": "Kongo",
    "langcode": "MK",
    "symbol": "kg",
    "vernacularName": "Kikongo (Rép. dém. du congo)",
    "isSignLanguage": false
  },
  {
    "name": "Konkani (Roman)",
    "langcode": "KT",
    "symbol": "gom",
    "vernacularName": "Konkani (Romi)",
    "isSignLanguage": false
  },
  {
    "name": "Korean",
    "langcode": "KO",
    "symbol": "ko",
    "vernacularName": "한국어",
    "isSignLanguage": false
  },
  {
    "name": "Korean Sign Language",
    "langcode": "KSL",
    "symbol": "kvk",
    "vernacularName": "한국 수어",
    "isSignLanguage": true
  },
  {
    "name": "Kosraean",
    "langcode": "OS",
    "symbol": "kos",
    "vernacularName": "Kosraean",
    "isSignLanguage": false
  },
  {
    "name": "Kpelle",
    "langcode": "KP",
    "symbol": "xpe",
    "vernacularName": "Kpelle",
    "isSignLanguage": false
  },
  {
    "name": "Krio",
    "langcode": "KRI",
    "symbol": "kri",
    "vernacularName": "Krio",
    "isSignLanguage": false
  },
  {
    "name": "Kuhane (Subiya)",
    "langcode": "KHN",
    "symbol": "sbs",
    "vernacularName": "Kuhane (Subiya)",
    "isSignLanguage": false
  },
  {
    "name": "Kurdish Kurmanji",
    "langcode": "RD",
    "symbol": "kmr-x-rd",
    "vernacularName": "Kurdî (Kurmancî)",
    "isSignLanguage": false
  },
  {
    "name": "Kurdish Kurmanji (Caucasus)",
    "langcode": "RDU",
    "symbol": "kmr-x-rdu",
    "vernacularName": "Kurdî Kurmancî (Kavkazûs)",
    "isSignLanguage": false
  },
  {
    "name": "Kurdish Kurmanji (Cyrillic)",
    "langcode": "RDC",
    "symbol": "kmr-cyrl",
    "vernacularName": "К′öрди Кöрманщи (Кирили)",
    "isSignLanguage": false
  },
  {
    "name": "Kurdish Sorani",
    "langcode": "RDA",
    "symbol": "ckb",
    "vernacularName": "کوردی سۆرانی",
    "isSignLanguage": false
  },
  {
    "name": "Kwangali",
    "langcode": "WG",
    "symbol": "kwn",
    "vernacularName": "Rukwangali",
    "isSignLanguage": false
  },
  {
    "name": "Kwanyama",
    "langcode": "KY",
    "symbol": "kj",
    "vernacularName": "Oshikwanyama",
    "isSignLanguage": false
  },
  {
    "name": "Kwara'ae",
    "langcode": "KW",
    "symbol": "kwf",
    "vernacularName": "Kwara'ae",
    "isSignLanguage": false
  },
  {
    "name": "Kyangonde",
    "langcode": "NKN",
    "symbol": "nyy-x-nkn",
    "vernacularName": "Kyangonde",
    "isSignLanguage": false
  },
  {
    "name": "Ladin (Gardenese)",
    "langcode": "LAD",
    "symbol": "lld-x-lad",
    "vernacularName": "Ladin de Gherdëina",
    "isSignLanguage": false
  },
  {
    "name": "Lahu",
    "langcode": "LAH",
    "symbol": "lhu",
    "vernacularName": "Laˇhuˍ hkawˇ",
    "isSignLanguage": false
  },
  {
    "name": "Lamba",
    "langcode": "AB",
    "symbol": "lam",
    "vernacularName": "IciLamba",
    "isSignLanguage": false
  },
  {
    "name": "Lambya",
    "langcode": "LMB",
    "symbol": "lai",
    "vernacularName": "Chilambya",
    "isSignLanguage": false
  },
  {
    "name": "Laotian",
    "langcode": "LA",
    "symbol": "lo",
    "vernacularName": "ລາວ",
    "isSignLanguage": false
  },
  {
    "name": "Lari",
    "langcode": "LR",
    "symbol": "ldi",
    "vernacularName": "Kilari",
    "isSignLanguage": false
  },
  {
    "name": "Latvian",
    "langcode": "LT",
    "symbol": "lv",
    "vernacularName": "latviešu",
    "isSignLanguage": false
  },
  {
    "name": "Latvian Sign Language",
    "langcode": "LSL",
    "symbol": "lsl",
    "vernacularName": "latviešu zīmju valoda",
    "isSignLanguage": true
  },
  {
    "name": "Lauan",
    "langcode": "LNN",
    "symbol": "llx",
    "vernacularName": "Lauan",
    "isSignLanguage": false
  },
  {
    "name": "Lebanese Sign Language",
    "langcode": "LBS",
    "symbol": "sgn-lb",
    "vernacularName": "لغة الاشارات اللبنانية",
    "isSignLanguage": true
  },
  {
    "name": "Lega",
    "langcode": "LGA",
    "symbol": "lea",
    "vernacularName": "Lega",
    "isSignLanguage": false
  },
  {
    "name": "Lenakel",
    "langcode": "LNK",
    "symbol": "tnl",
    "vernacularName": "Lenakel",
    "isSignLanguage": false
  },
  {
    "name": "Lendu",
    "langcode": "LND",
    "symbol": "led",
    "vernacularName": "Baledha",
    "isSignLanguage": false
  },
  {
    "name": "Lenje",
    "langcode": "LJ",
    "symbol": "leh",
    "vernacularName": "Cilenje",
    "isSignLanguage": false
  },
  {
    "name": "Lhukonzo",
    "langcode": "LHK",
    "symbol": "koo",
    "vernacularName": "Lhukonzo",
    "isSignLanguage": false
  },
  {
    "name": "Liberian English",
    "langcode": "ELI",
    "symbol": "lir",
    "vernacularName": "Liberian English",
    "isSignLanguage": false
  },
  {
    "name": "Lingala",
    "langcode": "LI",
    "symbol": "ln",
    "vernacularName": "Lingala",
    "isSignLanguage": false
  },
  {
    "name": "Lithuanian",
    "langcode": "L",
    "symbol": "lt",
    "vernacularName": "lietuvių",
    "isSignLanguage": false
  },
  {
    "name": "Lithuanian Sign Language",
    "langcode": "LTS",
    "symbol": "lls",
    "vernacularName": "lietuvių gestų",
    "isSignLanguage": true
  },
  {
    "name": "Lolo",
    "langcode": "LLO",
    "symbol": "llb",
    "vernacularName": "Ilolo",
    "isSignLanguage": false
  },
  {
    "name": "Loma",
    "langcode": "OM",
    "symbol": "lom",
    "vernacularName": "Lɔɔma",
    "isSignLanguage": false
  },
  {
    "name": "Lomwe",
    "langcode": "LE",
    "symbol": "ngl",
    "vernacularName": "Elomwe",
    "isSignLanguage": false
  },
  {
    "name": "Low German",
    "langcode": "LWX",
    "symbol": "pdt",
    "vernacularName": "Plautdietsch",
    "isSignLanguage": false
  },
  {
    "name": "Luganda",
    "langcode": "LU",
    "symbol": "lg",
    "vernacularName": "Luganda",
    "isSignLanguage": false
  },
  {
    "name": "Lugbara",
    "langcode": "LG",
    "symbol": "lgg",
    "vernacularName": "Lugbara",
    "isSignLanguage": false
  },
  {
    "name": "Lunda",
    "langcode": "LD",
    "symbol": "lun",
    "vernacularName": "Lunda",
    "isSignLanguage": false
  },
  {
    "name": "Luo",
    "langcode": "LO",
    "symbol": "luo",
    "vernacularName": "Dholuo",
    "isSignLanguage": false
  },
  {
    "name": "Luvale",
    "langcode": "LV",
    "symbol": "lue",
    "vernacularName": "Luvale",
    "isSignLanguage": false
  },
  {
    "name": "Luxembourgish",
    "langcode": "LX",
    "symbol": "lb",
    "vernacularName": "Lëtzebuergesch",
    "isSignLanguage": false
  },
  {
    "name": "Macedonian",
    "langcode": "MC",
    "symbol": "mk",
    "vernacularName": "македонски",
    "isSignLanguage": false
  },
  {
    "name": "Macua",
    "langcode": "MAC",
    "symbol": "vmw",
    "vernacularName": "Emakhuwa",
    "isSignLanguage": false
  },
  {
    "name": "Macuata",
    "langcode": "MCT",
    "symbol": "fij-x-mct",
    "vernacularName": "Macuata",
    "isSignLanguage": false
  },
  {
    "name": "Macushi",
    "langcode": "MCS",
    "symbol": "mbc",
    "vernacularName": "Makusi",
    "isSignLanguage": false
  },
  {
    "name": "Madagascar Sign Language",
    "langcode": "TTM",
    "symbol": "mzc",
    "vernacularName": "Tenin’ny Tanana Malagasy",
    "isSignLanguage": true
  },
  {
    "name": "Makaa",
    "langcode": "MKA",
    "symbol": "mcp",
    "vernacularName": "Makaa",
    "isSignLanguage": false
  },
  {
    "name": "Makhuwa-Marrevone",
    "langcode": "MHM",
    "symbol": "xmc",
    "vernacularName": "Makhuwa-Marrevone",
    "isSignLanguage": false
  },
  {
    "name": "Makhuwa-Meetto",
    "langcode": "MWM",
    "symbol": "mgh",
    "vernacularName": "Emakhuwa Emeetto",
    "isSignLanguage": false
  },
  {
    "name": "Makhuwa-Moniga",
    "langcode": "MKM",
    "symbol": "mhm",
    "vernacularName": "Makhuwa-Moniga",
    "isSignLanguage": false
  },
  {
    "name": "Makhuwa-Shirima",
    "langcode": "MHS",
    "symbol": "vmk",
    "vernacularName": "Makhuwa-Shirima",
    "isSignLanguage": false
  },
  {
    "name": "Makonde",
    "langcode": "MKD",
    "symbol": "kde",
    "vernacularName": "Shimakonde",
    "isSignLanguage": false
  },
  {
    "name": "Malagasy",
    "langcode": "MG",
    "symbol": "mg",
    "vernacularName": "Malagasy",
    "isSignLanguage": false
  },
  {
    "name": "Malawi Sign Language",
    "langcode": "MSL",
    "symbol": "sgn-mw",
    "vernacularName": "Chinenero Chamanja cha ku Malawi",
    "isSignLanguage": true
  },
  {
    "name": "Malay",
    "langcode": "ML",
    "symbol": "ms",
    "vernacularName": "Melayu",
    "isSignLanguage": false
  },
  {
    "name": "Malayalam",
    "langcode": "MY",
    "symbol": "ml",
    "vernacularName": "മലയാളം",
    "isSignLanguage": false
  },
  {
    "name": "Malaysian Sign Language",
    "langcode": "BIM",
    "symbol": "xml",
    "vernacularName": "Bahasa Isyarat Malaysia",
    "isSignLanguage": true
  },
  {
    "name": "Maltese",
    "langcode": "MT",
    "symbol": "mt",
    "vernacularName": "Malti",
    "isSignLanguage": false
  },
  {
    "name": "Mam",
    "langcode": "MZ",
    "symbol": "mam",
    "vernacularName": "mam",
    "isSignLanguage": false
  },
  {
    "name": "Mambwe-Lungu",
    "langcode": "MWL",
    "symbol": "mgr",
    "vernacularName": "Cimambwe-Lungu",
    "isSignLanguage": false
  },
  {
    "name": "Manipuri",
    "langcode": "MI",
    "symbol": "mni",
    "vernacularName": "মৈতৈলোন্",
    "isSignLanguage": false
  },
  {
    "name": "Manipuri (Roman)",
    "langcode": "MIR",
    "symbol": "mni-latn",
    "vernacularName": "Manipuri (Roman)",
    "isSignLanguage": false
  },
  {
    "name": "Mano",
    "langcode": "MNO",
    "symbol": "mev",
    "vernacularName": "Maa",
    "isSignLanguage": false
  },
  {
    "name": "Manyawa",
    "langcode": "MYW",
    "symbol": "mny",
    "vernacularName": "Emanyawa",
    "isSignLanguage": false
  },
  {
    "name": "Maori",
    "langcode": "MA",
    "symbol": "mi",
    "vernacularName": "Te Reo Māori",
    "isSignLanguage": false
  },
  {
    "name": "Mapudungun",
    "langcode": "MPD",
    "symbol": "arn",
    "vernacularName": "mapudungun",
    "isSignLanguage": false
  },
  {
    "name": "Marathi",
    "langcode": "MR",
    "symbol": "mr",
    "vernacularName": "मराठी",
    "isSignLanguage": false
  },
  {
    "name": "Mari",
    "langcode": "MAR",
    "symbol": "mhr",
    "vernacularName": "марий",
    "isSignLanguage": false
  },
  {
    "name": "Marshallese",
    "langcode": "MH",
    "symbol": "mh",
    "vernacularName": "Kajin M̦ajel̦",
    "isSignLanguage": false
  },
  {
    "name": "Martiniquan Creole",
    "langcode": "MTC",
    "symbol": "gcf-x-mtc",
    "vernacularName": "Kréyol Matinik",
    "isSignLanguage": false
  },
  {
    "name": "Mashi",
    "langcode": "MSH",
    "symbol": "shr",
    "vernacularName": "Mashi",
    "isSignLanguage": false
  },
  {
    "name": "Matengo",
    "langcode": "MTN",
    "symbol": "mgv",
    "vernacularName": "Kimatengo",
    "isSignLanguage": false
  },
  {
    "name": "Mauritian Creole",
    "langcode": "CE",
    "symbol": "mfe",
    "vernacularName": "Kreol Morisien",
    "isSignLanguage": false
  },
  {
    "name": "Maya",
    "langcode": "MAY",
    "symbol": "yua",
    "vernacularName": "maaya",
    "isSignLanguage": false
  },
  {
    "name": "Maya (Mopán)",
    "langcode": "MAP",
    "symbol": "mop",
    "vernacularName": "T'an",
    "isSignLanguage": false
  },
  {
    "name": "Mayo",
    "langcode": "MYO",
    "symbol": "mfy",
    "vernacularName": "yoremnok'ki",
    "isSignLanguage": false
  },
  {
    "name": "Mazahua",
    "langcode": "MZH",
    "symbol": "maz",
    "vernacularName": "jñatrjo",
    "isSignLanguage": false
  },
  {
    "name": "Mazatec (Huautla)",
    "langcode": "MAZ",
    "symbol": "mau",
    "vernacularName": "énná",
    "isSignLanguage": false
  },
  {
    "name": "Mbunda",
    "langcode": "MBD",
    "symbol": "mck",
    "vernacularName": "Mbunda",
    "isSignLanguage": false
  },
  {
    "name": "Medumba",
    "langcode": "DU",
    "symbol": "byv",
    "vernacularName": "Bangangté",
    "isSignLanguage": false
  },
  {
    "name": "Melanesian Sign Language",
    "langcode": "MNS",
    "symbol": "sgn-pg",
    "vernacularName": "Melanesian Sign Language",
    "isSignLanguage": true
  },
  {
    "name": "Meru",
    "langcode": "UU",
    "symbol": "mer",
    "vernacularName": "Kĩmĩĩrũ",
    "isSignLanguage": false
  },
  {
    "name": "Mexican Sign Language",
    "langcode": "LSM",
    "symbol": "mfs",
    "vernacularName": "lengua de señas mexicana",
    "isSignLanguage": true
  },
  {
    "name": "Min Nan (Taiwan)",
    "langcode": "CHW",
    "symbol": "nan-x-chw",
    "vernacularName": "閩南語（台灣）",
    "isSignLanguage": false
  },
  {
    "name": "Mingrelian",
    "langcode": "MGL",
    "symbol": "xmf",
    "vernacularName": "მარგალური",
    "isSignLanguage": false
  },
  {
    "name": "Miskito",
    "langcode": "MIS",
    "symbol": "miq",
    "vernacularName": "miskitu",
    "isSignLanguage": false
  },
  {
    "name": "Mixe (North Central)",
    "langcode": "MX",
    "symbol": "mco",
    "vernacularName": "ayuk",
    "isSignLanguage": false
  },
  {
    "name": "Mixtec (Guerrero)",
    "langcode": "MXG",
    "symbol": "mxv",
    "vernacularName": "tu’un sâví",
    "isSignLanguage": false
  },
  {
    "name": "Mixtec (Huajuapan)",
    "langcode": "MXO",
    "symbol": "jmx",
    "vernacularName": "Tu̱ʼun ndaʼví",
    "isSignLanguage": false
  },
  {
    "name": "Mixtec (Tlaxiaco)",
    "langcode": "MXT",
    "symbol": "meh",
    "vernacularName": "saʼan savi",
    "isSignLanguage": false
  },
  {
    "name": "Mizo",
    "langcode": "LS",
    "symbol": "lus",
    "vernacularName": "Mizo",
    "isSignLanguage": false
  },
  {
    "name": "Moba",
    "langcode": "MBA",
    "symbol": "mfq",
    "vernacularName": "Muaba",
    "isSignLanguage": false
  },
  {
    "name": "Mongolian",
    "langcode": "KHA",
    "symbol": "mn",
    "vernacularName": "монгол",
    "isSignLanguage": false
  },
  {
    "name": "Moore",
    "langcode": "MM",
    "symbol": "mos",
    "vernacularName": "Moore",
    "isSignLanguage": false
  },
  {
    "name": "Motu",
    "langcode": "MTU",
    "symbol": "meu",
    "vernacularName": "Motu",
    "isSignLanguage": false
  },
  {
    "name": "Mozambican Sign Language",
    "langcode": "SLM",
    "symbol": "mzy",
    "vernacularName": "Língua de Sinais Moçambicana",
    "isSignLanguage": true
  },
  {
    "name": "Myanmar",
    "langcode": "BU",
    "symbol": "my",
    "vernacularName": "မြန်မာ",
    "isSignLanguage": false
  },
  {
    "name": "Nadi",
    "langcode": "NDI",
    "symbol": "fij-x-ndi",
    "vernacularName": "Nadi",
    "isSignLanguage": false
  },
  {
    "name": "Nadroga",
    "langcode": "NDR",
    "symbol": "wyy-x-ndr",
    "vernacularName": "Nadroga",
    "isSignLanguage": false
  },
  {
    "name": "Nahuatl (Central)",
    "langcode": "NHC",
    "symbol": "ncx",
    "vernacularName": "náhuatl del centro",
    "isSignLanguage": false
  },
  {
    "name": "Nahuatl (Guerrero)",
    "langcode": "NHG",
    "symbol": "ngu",
    "vernacularName": "náhuatl de guerrero",
    "isSignLanguage": false
  },
  {
    "name": "Nahuatl (Huasteca)",
    "langcode": "NHH",
    "symbol": "nch",
    "vernacularName": "náhuatl de la huasteca",
    "isSignLanguage": false
  },
  {
    "name": "Nahuatl (Northern Puebla)",
    "langcode": "NHT",
    "symbol": "ncj",
    "vernacularName": "náhuatl del norte de Puebla",
    "isSignLanguage": false
  },
  {
    "name": "Nahuatl (Veracruz)",
    "langcode": "NHV",
    "symbol": "nhk",
    "vernacularName": "náhuatl de Veracruz",
    "isSignLanguage": false
  },
  {
    "name": "Namakura",
    "langcode": "NMK",
    "symbol": "nmk",
    "vernacularName": "Namakura",
    "isSignLanguage": false
  },
  {
    "name": "Nambya",
    "langcode": "NB",
    "symbol": "nmq",
    "vernacularName": "Nambya",
    "isSignLanguage": false
  },
  {
    "name": "Namibian Sign Language",
    "langcode": "SLN",
    "symbol": "nbs",
    "vernacularName": "Namibian Sign Language",
    "isSignLanguage": true
  },
  {
    "name": "Namosi-Naitasiri-Serua",
    "langcode": "NNR",
    "symbol": "bwb",
    "vernacularName": "Namosi-Naitasiri-Serua",
    "isSignLanguage": false
  },
  {
    "name": "Navajo",
    "langcode": "NV",
    "symbol": "nv",
    "vernacularName": "Diné Bizaad",
    "isSignLanguage": false
  },
  {
    "name": "Ndau",
    "langcode": "NDA",
    "symbol": "ndc",
    "vernacularName": "Cindau",
    "isSignLanguage": false
  },
  {
    "name": "Ndebele",
    "langcode": "NBL",
    "symbol": "nr",
    "vernacularName": "IsiNdebele",
    "isSignLanguage": false
  },
  {
    "name": "Ndebele (Zimbabwe)",
    "langcode": "NBZ",
    "symbol": "nd",
    "vernacularName": "Ndebele (Zimbabwe)",
    "isSignLanguage": false
  },
  {
    "name": "Ndonga",
    "langcode": "OD",
    "symbol": "ng",
    "vernacularName": "Oshindonga",
    "isSignLanguage": false
  },
  {
    "name": "Nengone",
    "langcode": "RE",
    "symbol": "nen",
    "vernacularName": "Nengone",
    "isSignLanguage": false
  },
  {
    "name": "Nepali",
    "langcode": "NP",
    "symbol": "ne",
    "vernacularName": "नेपाली",
    "isSignLanguage": false
  },
  {
    "name": "Nepali Sign Language",
    "langcode": "NSL",
    "symbol": "nsp",
    "vernacularName": "नेपाली साङ्केतिक भाषा",
    "isSignLanguage": true
  },
  {
    "name": "New Zealand Sign Language",
    "langcode": "NZS",
    "symbol": "nzs",
    "vernacularName": "New Zealand Sign Language",
    "isSignLanguage": true
  },
  {
    "name": "Ngabere",
    "langcode": "NGB",
    "symbol": "gym",
    "vernacularName": "ngäbere",
    "isSignLanguage": false
  },
  {
    "name": "Ngangela",
    "langcode": "NGL",
    "symbol": "nba",
    "vernacularName": "Ngangela",
    "isSignLanguage": false
  },
  {
    "name": "Ngbandi (Northern)",
    "langcode": "NGN",
    "symbol": "ngb",
    "vernacularName": "Ngbandi (ya Nɔrdi)",
    "isSignLanguage": false
  },
  {
    "name": "Ngiemboon",
    "langcode": "NMB",
    "symbol": "nnh",
    "vernacularName": "Ngiemboon",
    "isSignLanguage": false
  },
  {
    "name": "Ngigua (San Marcos Tlacoyalco)",
    "langcode": "NGM",
    "symbol": "pls",
    "vernacularName": "ngigua de San Marcos Tlacoyalco",
    "isSignLanguage": false
  },
  {
    "name": "Nhengatu",
    "langcode": "NGU",
    "symbol": "yrl",
    "vernacularName": "Nheengatu",
    "isSignLanguage": false
  },
  {
    "name": "Nias",
    "langcode": "NI",
    "symbol": "nia",
    "vernacularName": "Nias",
    "isSignLanguage": false
  },
  {
    "name": "Nicaraguan Sign Language",
    "langcode": "LSN",
    "symbol": "ncs",
    "vernacularName": "lenguaje de señas nicaragüense",
    "isSignLanguage": true
  },
  {
    "name": "Nicobarese",
    "langcode": "NC",
    "symbol": "caq",
    "vernacularName": "Nicobarese",
    "isSignLanguage": false
  },
  {
    "name": "Nigerian Sign Language",
    "langcode": "NNS",
    "symbol": "nsi",
    "vernacularName": "Nigerian Sign Language",
    "isSignLanguage": true
  },
  {
    "name": "Niuean",
    "langcode": "NN",
    "symbol": "niu",
    "vernacularName": "Faka-Niue",
    "isSignLanguage": false
  },
  {
    "name": "Norwegian",
    "langcode": "N",
    "symbol": "no",
    "vernacularName": "Norsk",
    "isSignLanguage": false
  },
  {
    "name": "Norwegian Sign Language",
    "langcode": "NDF",
    "symbol": "nsl",
    "vernacularName": "Norsk tegnspråk",
    "isSignLanguage": true
  },
  {
    "name": "Nsenga (Mozambique)",
    "langcode": "NSM",
    "symbol": "nse-mz",
    "vernacularName": "Chinsenga (Mozambique)",
    "isSignLanguage": false
  },
  {
    "name": "Nsenga (Zambia)",
    "langcode": "NEN",
    "symbol": "nse",
    "vernacularName": "Cinsenga",
    "isSignLanguage": false
  },
  {
    "name": "Nyaneka",
    "langcode": "NK",
    "symbol": "nyk",
    "vernacularName": "Nyaneka",
    "isSignLanguage": false
  },
  {
    "name": "Nyungwe",
    "langcode": "NYU",
    "symbol": "nyu",
    "vernacularName": "Cinyungwe",
    "isSignLanguage": false
  },
  {
    "name": "Nzema",
    "langcode": "NZ",
    "symbol": "nzi",
    "vernacularName": "Nzema",
    "isSignLanguage": false
  },
  {
    "name": "Obolo",
    "langcode": "OBL",
    "symbol": "ann",
    "vernacularName": "Obolo",
    "isSignLanguage": false
  },
  {
    "name": "Odia",
    "langcode": "OI",
    "symbol": "or",
    "vernacularName": "ଓଡ଼ିଆ",
    "isSignLanguage": false
  },
  {
    "name": "Okpe",
    "langcode": "OKP",
    "symbol": "oke",
    "vernacularName": "Okpe",
    "isSignLanguage": false
  },
  {
    "name": "Oromo",
    "langcode": "OA",
    "symbol": "om",
    "vernacularName": "Afaan Oromoo",
    "isSignLanguage": false
  },
  {
    "name": "Ossetian",
    "langcode": "OSS",
    "symbol": "os",
    "vernacularName": "ирон",
    "isSignLanguage": false
  },
  {
    "name": "Otetela",
    "langcode": "OT",
    "symbol": "tll",
    "vernacularName": "Ɔtɛtɛla",
    "isSignLanguage": false
  },
  {
    "name": "Otomi (Eastern Highland)",
    "langcode": "OTE",
    "symbol": "otm",
    "vernacularName": "ñuhü",
    "isSignLanguage": false
  },
  {
    "name": "Otomi (Mezquital Valley)",
    "langcode": "OTM",
    "symbol": "ote",
    "vernacularName": "Ñañu",
    "isSignLanguage": false
  },
  {
    "name": "Otomi (State of Mexico)",
    "langcode": "OTS",
    "symbol": "ots",
    "vernacularName": "ñätho",
    "isSignLanguage": false
  },
  {
    "name": "Paama",
    "langcode": "PMA",
    "symbol": "pma",
    "vernacularName": "Paama",
    "isSignLanguage": false
  },
  {
    "name": "Palauan",
    "langcode": "PU",
    "symbol": "pau",
    "vernacularName": "Palauan",
    "isSignLanguage": false
  },
  {
    "name": "Panamanian Sign Language",
    "langcode": "PSL",
    "symbol": "lsp",
    "vernacularName": "lengua de señas panameñas",
    "isSignLanguage": true
  },
  {
    "name": "Pangasinan",
    "langcode": "PN",
    "symbol": "pag",
    "vernacularName": "Pangasinan",
    "isSignLanguage": false
  },
  {
    "name": "Papiamento (Aruba)",
    "langcode": "PAA",
    "symbol": "pap-x-paa",
    "vernacularName": "Papiamento (Aruba)",
    "isSignLanguage": false
  },
  {
    "name": "Papiamento (Curaçao)",
    "langcode": "PA",
    "symbol": "pap",
    "vernacularName": "Papiamentu (Kòrsou)",
    "isSignLanguage": false
  },
  {
    "name": "Paraguayan Sign Language",
    "langcode": "LSP",
    "symbol": "pys",
    "vernacularName": "lengua de señas paraguaya",
    "isSignLanguage": true
  },
  {
    "name": "Pashto",
    "langcode": "PH",
    "symbol": "ps",
    "vernacularName": "پښتو",
    "isSignLanguage": false
  },
  {
    "name": "Pehuenche",
    "langcode": "PHN",
    "symbol": "arn-x-phn",
    "vernacularName": "chedungun (pewenche)",
    "isSignLanguage": false
  },
  {
    "name": "Pemon",
    "langcode": "PMN",
    "symbol": "aoc",
    "vernacularName": "pemon pe",
    "isSignLanguage": false
  },
  {
    "name": "Pennsylvania German",
    "langcode": "XPA",
    "symbol": "pdc",
    "vernacularName": "Pennsylvania Dutch (Deitsh)",
    "isSignLanguage": false
  },
  {
    "name": "Persian",
    "langcode": "PR",
    "symbol": "fa",
    "vernacularName": "فارسی",
    "isSignLanguage": false
  },
  {
    "name": "Peruvian Sign Language",
    "langcode": "SPE",
    "symbol": "prl",
    "vernacularName": "lengua de señas peruana",
    "isSignLanguage": true
  },
  {
    "name": "Phimbi",
    "langcode": "PHM",
    "symbol": "phm",
    "vernacularName": "Chiphimbi",
    "isSignLanguage": false
  },
  {
    "name": "Piaroa",
    "langcode": "PRA",
    "symbol": "pid",
    "vernacularName": "huo̧ttö̧ja̧",
    "isSignLanguage": false
  },
  {
    "name": "Pidgin (West Africa)",
    "langcode": "PGW",
    "symbol": "wes-x-pgw",
    "vernacularName": "Pidgin (West Africa)",
    "isSignLanguage": false
  },
  {
    "name": "Polish",
    "langcode": "P",
    "symbol": "pl",
    "vernacularName": "polski",
    "isSignLanguage": false
  },
  {
    "name": "Polish Sign Language",
    "langcode": "PDF",
    "symbol": "pso",
    "vernacularName": "polski język migowy",
    "isSignLanguage": true
  },
  {
    "name": "Pomeranian",
    "langcode": "PMR",
    "symbol": "nds",
    "vernacularName": "Pomerisch",
    "isSignLanguage": false
  },
  {
    "name": "Ponapean",
    "langcode": "PP",
    "symbol": "pon",
    "vernacularName": "Ponapean",
    "isSignLanguage": false
  },
  {
    "name": "Popoluca (Highland)",
    "langcode": "PPU",
    "symbol": "poi",
    "vernacularName": "popoluca de la Sierra",
    "isSignLanguage": false
  },
  {
    "name": "Popti'",
    "langcode": "JC",
    "symbol": "jac-x-jc",
    "vernacularName": "poptí",
    "isSignLanguage": false
  },
  {
    "name": "Poqomchi'",
    "langcode": "PQM",
    "symbol": "poh",
    "vernacularName": "poqomchi'",
    "isSignLanguage": false
  },
  {
    "name": "Portuguese (Angola)",
    "langcode": "TNG",
    "symbol": "pt-ao",
    "vernacularName": "Português (Angola)",
    "isSignLanguage": false
  },
  {
    "name": "Portuguese (Brazil)",
    "langcode": "T",
    "symbol": "pt",
    "vernacularName": "Português (Brasil)",
    "isSignLanguage": false
  },
  {
    "name": "Portuguese (Mozambique)",
    "langcode": "TMM",
    "symbol": "pt-mz",
    "vernacularName": "Português (Moçambique)",
    "isSignLanguage": false
  },
  {
    "name": "Portuguese (Portugal)",
    "langcode": "TPO",
    "symbol": "pt-pt",
    "vernacularName": "Português (Portugal)",
    "isSignLanguage": false
  },
  {
    "name": "Portuguese Sign Language",
    "langcode": "LGP",
    "symbol": "psr",
    "vernacularName": "Língua Gestual Portuguesa",
    "isSignLanguage": true
  },
  {
    "name": "Pular",
    "langcode": "PLR",
    "symbol": "fuf",
    "vernacularName": "Pular",
    "isSignLanguage": false
  },
  {
    "name": "Punjabi",
    "langcode": "PJ",
    "symbol": "pa",
    "vernacularName": "ਪੰਜਾਬੀ",
    "isSignLanguage": false
  },
  {
    "name": "Punjabi (Roman)",
    "langcode": "PJR",
    "symbol": "pa-latn",
    "vernacularName": "Punjabi (Roman)",
    "isSignLanguage": false
  },
  {
    "name": "Punjabi (Shahmukhi)",
    "langcode": "PJN",
    "symbol": "pnb",
    "vernacularName": "پنجابی (شاہ مُکھی)",
    "isSignLanguage": false
  },
  {
    "name": "Páez",
    "langcode": "PAZ",
    "symbol": "pbb",
    "vernacularName": "nasa yuwe",
    "isSignLanguage": false
  },
  {
    "name": "Quebec Sign Language",
    "langcode": "LSQ",
    "symbol": "fcs",
    "vernacularName": "Langue des signes québécoise",
    "isSignLanguage": true
  },
  {
    "name": "Quechua (Ancash)",
    "langcode": "QUN",
    "symbol": "que",
    "vernacularName": "Quechua (Ancash)",
    "isSignLanguage": false
  },
  {
    "name": "Quechua (Ayacucho)",
    "langcode": "QUA",
    "symbol": "quy",
    "vernacularName": "Quechua (Ayacucho)",
    "isSignLanguage": false
  },
  {
    "name": "Quechua (Bolivia)",
    "langcode": "QUB",
    "symbol": "qu",
    "vernacularName": "Quechua (Bolivia)",
    "isSignLanguage": false
  },
  {
    "name": "Quechua (Cuzco)",
    "langcode": "QU",
    "symbol": "quz",
    "vernacularName": "quechua (Cusco)",
    "isSignLanguage": false
  },
  {
    "name": "Quechua (Huallaga Huánuco)",
    "langcode": "QUL",
    "symbol": "qub",
    "vernacularName": "Quechua de Huánuco (Huallaga)",
    "isSignLanguage": false
  },
  {
    "name": "Quechua (Huaylla Wanca)",
    "langcode": "QUH",
    "symbol": "qvw",
    "vernacularName": "quechua wanca",
    "isSignLanguage": false
  },
  {
    "name": "Quiche",
    "langcode": "QC",
    "symbol": "quc",
    "vernacularName": "quiché",
    "isSignLanguage": false
  },
  {
    "name": "Quichua (Chimborazo)",
    "langcode": "QIC",
    "symbol": "qug",
    "vernacularName": "quichua (chimborazo)",
    "isSignLanguage": false
  },
  {
    "name": "Quichua (Cotopaxi)",
    "langcode": "QIX",
    "symbol": "qug-x-qix",
    "vernacularName": "quichua (cotopaxi)",
    "isSignLanguage": false
  },
  {
    "name": "Quichua (Imbabura)",
    "langcode": "QII",
    "symbol": "qvi",
    "vernacularName": "quichua (imbabura)",
    "isSignLanguage": false
  },
  {
    "name": "Quichua (Pastaza)",
    "langcode": "QIP",
    "symbol": "qvz",
    "vernacularName": "quichua (pastaza)",
    "isSignLanguage": false
  },
  {
    "name": "Quichua (Santiago del Estero)",
    "langcode": "QIS",
    "symbol": "qus",
    "vernacularName": "quichua (Santiago del Estero)",
    "isSignLanguage": false
  },
  {
    "name": "Quichua (Tena)",
    "langcode": "QIT",
    "symbol": "quw",
    "vernacularName": "quichua (tena)",
    "isSignLanguage": false
  },
  {
    "name": "Ra",
    "langcode": "FNR",
    "symbol": "fij-x-fnr",
    "vernacularName": "Ra",
    "isSignLanguage": false
  },
  {
    "name": "Rapa Nui",
    "langcode": "RPN",
    "symbol": "rap",
    "vernacularName": "rapa nui",
    "isSignLanguage": false
  },
  {
    "name": "Rarotongan",
    "langcode": "RA",
    "symbol": "rar",
    "vernacularName": "Reo Rarotonga",
    "isSignLanguage": false
  },
  {
    "name": "Romanian",
    "langcode": "M",
    "symbol": "ro",
    "vernacularName": "Română",
    "isSignLanguage": false
  },
  {
    "name": "Romanian (Vlach)",
    "langcode": "RNN",
    "symbol": "ro-x-rnn",
    "vernacularName": "rumunski (vlaški)",
    "isSignLanguage": false
  },
  {
    "name": "Romanian Sign Language",
    "langcode": "LMG",
    "symbol": "rms",
    "vernacularName": "Limbajul semnelor românesc",
    "isSignLanguage": true
  },
  {
    "name": "Romany (Argentina)",
    "langcode": "RMA",
    "symbol": "rmy-ar",
    "vernacularName": "Romanes Kalderash",
    "isSignLanguage": false
  },
  {
    "name": "Romany (Bulgaria)",
    "langcode": "RMB",
    "symbol": "rmn-x-rmb",
    "vernacularName": "романи (България)",
    "isSignLanguage": false
  },
  {
    "name": "Romany (Eastern Slovakia)",
    "langcode": "RMS",
    "symbol": "rmc-sk",
    "vernacularName": "romanes (vichodno Slovačiko)",
    "isSignLanguage": false
  },
  {
    "name": "Romany (Germany)",
    "langcode": "RMX",
    "symbol": "rmo",
    "vernacularName": "Romanes (Sinti)",
    "isSignLanguage": false
  },
  {
    "name": "Romany (Lovari, Hungary)",
    "langcode": "LVA",
    "symbol": "rmy-x-lva",
    "vernacularName": "romani (lovári, Ungriko Them)",
    "isSignLanguage": false
  },
  {
    "name": "Romany (Macedonia)",
    "langcode": "RM",
    "symbol": "rmn-x-rm",
    "vernacularName": "romane (Makedonija)",
    "isSignLanguage": false
  },
  {
    "name": "Romany (Macedonia) Cyrillic",
    "langcode": "RMC",
    "symbol": "rmn-cyrl",
    "vernacularName": "романе (Македонија) кирилица",
    "isSignLanguage": false
  },
  {
    "name": "Romany (Northern Russia)",
    "langcode": "RMP",
    "symbol": "rml-ru",
    "vernacularName": "романы (русска рома)",
    "isSignLanguage": false
  },
  {
    "name": "Romany (Romania)",
    "langcode": "RMR",
    "symbol": "rmy",
    "vernacularName": "Rromani (România)",
    "isSignLanguage": false
  },
  {
    "name": "Romany (Serbia)",
    "langcode": "RME",
    "symbol": "rmn-x-rme",
    "vernacularName": "Romane (Srbija)",
    "isSignLanguage": false
  },
  {
    "name": "Romany (Southern Greece)",
    "langcode": "RMG",
    "symbol": "rmn-x-rmg",
    "vernacularName": "Ρομανί (Νότια Ελλάδα)",
    "isSignLanguage": false
  },
  {
    "name": "Romany (Vlax, Russia)",
    "langcode": "RMV",
    "symbol": "rmy-x-rmv",
    "vernacularName": "романи (влахитско, Россия)",
    "isSignLanguage": false
  },
  {
    "name": "Ronga",
    "langcode": "RN",
    "symbol": "rng",
    "vernacularName": "Xironga",
    "isSignLanguage": false
  },
  {
    "name": "Rotuman",
    "langcode": "RO",
    "symbol": "rtm",
    "vernacularName": "Rotuạm ta",
    "isSignLanguage": false
  },
  {
    "name": "Rumanyo",
    "langcode": "RNY",
    "symbol": "diu",
    "vernacularName": "Rumanyo",
    "isSignLanguage": false
  },
  {
    "name": "Runyankore",
    "langcode": "RR",
    "symbol": "nyn",
    "vernacularName": "Runyankore",
    "isSignLanguage": false
  },
  {
    "name": "Russian",
    "langcode": "U",
    "symbol": "ru",
    "vernacularName": "русский",
    "isSignLanguage": false,
    "wAvailable": true,
    "mwbAvailable": true
  },
  {
    "name": "Russian Sign Language",
    "langcode": "RSL",
    "symbol": "rsl",
    "vernacularName": "русский жестовый",
    "isSignLanguage": true
  },
  {
    "name": "Rutoro",
    "langcode": "RT",
    "symbol": "ttj",
    "vernacularName": "Rutoro",
    "isSignLanguage": false
  },
  {
    "name": "Réunion Creole",
    "langcode": "RCR",
    "symbol": "rcf",
    "vernacularName": "Kréol Rénioné",
    "isSignLanguage": false
  },
  {
    "name": "Saint Lucian Creole",
    "langcode": "LUC",
    "symbol": "acf",
    "vernacularName": "Kwéyòl (Patwa)",
    "isSignLanguage": false
  },
  {
    "name": "Salvadoran Sign Language",
    "langcode": "LSS",
    "symbol": "esn",
    "vernacularName": "lengua de señas salvadoreña",
    "isSignLanguage": true
  },
  {
    "name": "Samoan",
    "langcode": "SM",
    "symbol": "sm",
    "vernacularName": "Faa-Samoa",
    "isSignLanguage": false
  },
  {
    "name": "Sangir",
    "langcode": "SGR",
    "symbol": "sxn",
    "vernacularName": "Sangir",
    "isSignLanguage": false
  },
  {
    "name": "Sango",
    "langcode": "SG",
    "symbol": "sg",
    "vernacularName": "Sango",
    "isSignLanguage": false
  },
  {
    "name": "Saramaccan",
    "langcode": "SRM",
    "symbol": "srm",
    "vernacularName": "Saamakatöngö",
    "isSignLanguage": false
  },
  {
    "name": "Sateré-Mawé",
    "langcode": "STM",
    "symbol": "mav",
    "vernacularName": "Saterê-Mauê",
    "isSignLanguage": false
  },
  {
    "name": "Scottish Gaelic",
    "langcode": "GCS",
    "symbol": "gd",
    "vernacularName": "Gàidhlig",
    "isSignLanguage": false
  },
  {
    "name": "Sehwi",
    "langcode": "SHW",
    "symbol": "sfw",
    "vernacularName": "Sehwi",
    "isSignLanguage": false
  },
  {
    "name": "Sena",
    "langcode": "SEN",
    "symbol": "seh",
    "vernacularName": "Cisena",
    "isSignLanguage": false
  },
  {
    "name": "Sepedi",
    "langcode": "SE",
    "symbol": "nso",
    "vernacularName": "Sepedi",
    "isSignLanguage": false
  },
  {
    "name": "Sepulana",
    "langcode": "SPL",
    "symbol": "nso-x-spl",
    "vernacularName": "Sepulana",
    "isSignLanguage": false
  },
  {
    "name": "Serbian (Cyrillic)",
    "langcode": "SB",
    "symbol": "sr-cyrl",
    "vernacularName": "српски (ћирилица)",
    "isSignLanguage": false
  },
  {
    "name": "Serbian (Roman)",
    "langcode": "SBO",
    "symbol": "sr-latn",
    "vernacularName": "srpski (latinica)",
    "isSignLanguage": false
  },
  {
    "name": "Sesotho (Lesotho)",
    "langcode": "SU",
    "symbol": "st",
    "vernacularName": "Sesotho (Lesotho)",
    "isSignLanguage": false
  },
  {
    "name": "Sesotho (South Africa)",
    "langcode": "SSA",
    "symbol": "st-za",
    "vernacularName": "Sesotho (South Africa)",
    "isSignLanguage": false
  },
  {
    "name": "Setswana",
    "langcode": "TN",
    "symbol": "tn",
    "vernacularName": "Setswana",
    "isSignLanguage": false
  },
  {
    "name": "Seychelles Creole",
    "langcode": "SC",
    "symbol": "crs",
    "vernacularName": "Kreol Seselwa",
    "isSignLanguage": false
  },
  {
    "name": "Shipibo-Conibo",
    "langcode": "SHC",
    "symbol": "shp",
    "vernacularName": "shipibo-conibo",
    "isSignLanguage": false
  },
  {
    "name": "Shona",
    "langcode": "CA",
    "symbol": "sn",
    "vernacularName": "Shona",
    "isSignLanguage": false
  },
  {
    "name": "Shuar",
    "langcode": "SHU",
    "symbol": "jiv",
    "vernacularName": "shuar",
    "isSignLanguage": false
  },
  {
    "name": "Sidama",
    "langcode": "DM",
    "symbol": "sid",
    "vernacularName": "Sidaamu Afoo",
    "isSignLanguage": false
  },
  {
    "name": "Silozi",
    "langcode": "SK",
    "symbol": "loz",
    "vernacularName": "Silozi",
    "isSignLanguage": false
  },
  {
    "name": "Sindhi (Devanagari)",
    "langcode": "NDV",
    "symbol": "sd-deva",
    "vernacularName": "Sindhi (Devanagari)",
    "isSignLanguage": false
  },
  {
    "name": "Sinhala",
    "langcode": "SN",
    "symbol": "si",
    "vernacularName": "සිංහල",
    "isSignLanguage": false
  },
  {
    "name": "Slovak",
    "langcode": "V",
    "symbol": "sk",
    "vernacularName": "slovenčina",
    "isSignLanguage": false
  },
  {
    "name": "Slovak Sign Language",
    "langcode": "VSL",
    "symbol": "svk",
    "vernacularName": "slovenský posunkový jazyk",
    "isSignLanguage": true
  },
  {
    "name": "Slovenian",
    "langcode": "SV",
    "symbol": "sl",
    "vernacularName": "slovenščina",
    "isSignLanguage": false
  },
  {
    "name": "Slovenian Sign Language",
    "langcode": "SZJ",
    "symbol": "sgn-si",
    "vernacularName": "slovenski znakovni jezik",
    "isSignLanguage": true
  },
  {
    "name": "Solomon Islands Pidgin",
    "langcode": "SP",
    "symbol": "pis",
    "vernacularName": "Solomon Islands Pidgin",
    "isSignLanguage": false
  },
  {
    "name": "Songomeno",
    "langcode": "SGM",
    "symbol": "soe",
    "vernacularName": "Losongomino",
    "isSignLanguage": false
  },
  {
    "name": "South African Sign Language",
    "langcode": "SAS",
    "symbol": "sfs",
    "vernacularName": "South African Sign Language",
    "isSignLanguage": true
  },
  {
    "name": "Spanish",
    "langcode": "S",
    "symbol": "es",
    "vernacularName": "español",
    "isSignLanguage": false
  },
  {
    "name": "Spanish Sign Language",
    "langcode": "LSE",
    "symbol": "ssp",
    "vernacularName": "lengua de signos española",
    "isSignLanguage": true
  },
  {
    "name": "Sranantongo",
    "langcode": "SR",
    "symbol": "srn",
    "vernacularName": "Sranantongo",
    "isSignLanguage": false
  },
  {
    "name": "Sri Lankan Sign Language",
    "langcode": "SLS",
    "symbol": "sqs",
    "vernacularName": "ශ්‍රී ලංකා සංඥා භාෂාව",
    "isSignLanguage": true
  },
  {
    "name": "Sunda",
    "langcode": "SD",
    "symbol": "su",
    "vernacularName": "Sunda",
    "isSignLanguage": false
  },
  {
    "name": "Suriname Sign Language",
    "langcode": "SSU",
    "symbol": "sgn-sr",
    "vernacularName": "Surinaamse Gebarentaal",
    "isSignLanguage": true
  },
  {
    "name": "Svan (Lower)",
    "langcode": "SVL",
    "symbol": "sva-x-svl",
    "vernacularName": "ჩუბე ლუშვანუ",
    "isSignLanguage": false
  },
  {
    "name": "Svan (Upper)",
    "langcode": "SVN",
    "symbol": "sva-x-svn",
    "vernacularName": "ჟიბე ლუშნუ",
    "isSignLanguage": false
  },
  {
    "name": "Swahili",
    "langcode": "SW",
    "symbol": "sw",
    "vernacularName": "Kiswahili",
    "isSignLanguage": false
  },
  {
    "name": "Swahili (Congo)",
    "langcode": "ZS",
    "symbol": "swc",
    "vernacularName": "Kiswahili (Congo)",
    "isSignLanguage": false
  },
  {
    "name": "Swati",
    "langcode": "SWI",
    "symbol": "ss",
    "vernacularName": "SiSwati",
    "isSignLanguage": false
  },
  {
    "name": "Swedish",
    "langcode": "Z",
    "symbol": "sv",
    "vernacularName": "Svenska",
    "isSignLanguage": false
  },
  {
    "name": "Swedish Sign Language",
    "langcode": "SSL",
    "symbol": "swl",
    "vernacularName": "Svenskt teckenspråk",
    "isSignLanguage": true
  },
  {
    "name": "Swiss German",
    "langcode": "XSW",
    "symbol": "gsw",
    "vernacularName": "Schweizerdeutsch",
    "isSignLanguage": false
  },
  {
    "name": "Swiss German Sign Language",
    "langcode": "SGS",
    "symbol": "sgg",
    "vernacularName": "Deutschschweizer Gebärdensprache",
    "isSignLanguage": true
  },
  {
    "name": "Sãotomense",
    "langcode": "STN",
    "symbol": "cri",
    "vernacularName": "Santome",
    "isSignLanguage": false
  },
  {
    "name": "Taabwa",
    "langcode": "TBW",
    "symbol": "tap",
    "vernacularName": "Taabwa",
    "isSignLanguage": false
  },
  {
    "name": "Tagalog",
    "langcode": "TG",
    "symbol": "tl",
    "vernacularName": "Tagalog",
    "isSignLanguage": false
  },
  {
    "name": "Tahitian",
    "langcode": "TH",
    "symbol": "ty",
    "vernacularName": "Tahiti",
    "isSignLanguage": false
  },
  {
    "name": "Taiwanese Sign Language",
    "langcode": "TSL",
    "symbol": "tss",
    "vernacularName": "台灣手語",
    "isSignLanguage": true
  },
  {
    "name": "Tajiki",
    "langcode": "TJ",
    "symbol": "tg",
    "vernacularName": "тоҷикӣ",
    "isSignLanguage": false
  },
  {
    "name": "Talian",
    "langcode": "TAL",
    "symbol": "vec",
    "vernacularName": "Talian",
    "isSignLanguage": false
  },
  {
    "name": "Talysh",
    "langcode": "TLY",
    "symbol": "tly-x-tly",
    "vernacularName": "Toloş",
    "isSignLanguage": false
  },
  {
    "name": "Tamil",
    "langcode": "TL",
    "symbol": "ta",
    "vernacularName": "தமிழ்",
    "isSignLanguage": false
  },
  {
    "name": "Tamil (Roman)",
    "langcode": "TLR",
    "symbol": "ta-x-tlr",
    "vernacularName": "Thamil (Rōman)",
    "isSignLanguage": false
  },
  {
    "name": "Tandroy",
    "langcode": "TND",
    "symbol": "tdx",
    "vernacularName": "Tandroy",
    "isSignLanguage": false
  },
  {
    "name": "Tankarana",
    "langcode": "TNK",
    "symbol": "xmv",
    "vernacularName": "Tankarana",
    "isSignLanguage": false
  },
  {
    "name": "Tanzanian Sign Language",
    "langcode": "TZL",
    "symbol": "tza",
    "vernacularName": "Lugha ya Alama ya Tanzania",
    "isSignLanguage": true
  },
  {
    "name": "Tarahumara (Central)",
    "langcode": "TRH",
    "symbol": "tar",
    "vernacularName": "ralámuli",
    "isSignLanguage": false
  },
  {
    "name": "Tarascan",
    "langcode": "TRS",
    "symbol": "tsz",
    "vernacularName": "Purépecha",
    "isSignLanguage": false
  },
  {
    "name": "Tatar",
    "langcode": "TAT",
    "symbol": "tt",
    "vernacularName": "татар",
    "isSignLanguage": false
  },
  {
    "name": "Telugu",
    "langcode": "TU",
    "symbol": "te",
    "vernacularName": "తెలుగు",
    "isSignLanguage": false
  },
  {
    "name": "Tetun Dili",
    "langcode": "TTP",
    "symbol": "tdt",
    "vernacularName": "Tetun Dili",
    "isSignLanguage": false
  },
  {
    "name": "Tewe",
    "langcode": "TEW",
    "symbol": "twx",
    "vernacularName": "Ciutee",
    "isSignLanguage": false
  },
  {
    "name": "Thai",
    "langcode": "SI",
    "symbol": "th",
    "vernacularName": "ไทย",
    "isSignLanguage": false
  },
  {
    "name": "Thai Sign Language",
    "langcode": "SIL",
    "symbol": "tsq",
    "vernacularName": "ภาษามือไทย",
    "isSignLanguage": true
  },
  {
    "name": "Ticuna",
    "langcode": "TCN",
    "symbol": "tca",
    "vernacularName": "Ticuna",
    "isSignLanguage": false
  },
  {
    "name": "Tigrinya",
    "langcode": "TI",
    "symbol": "ti",
    "vernacularName": "ትግርኛ",
    "isSignLanguage": false
  },
  {
    "name": "Tiv",
    "langcode": "TV",
    "symbol": "tiv",
    "vernacularName": "Tiv",
    "isSignLanguage": false
  },
  {
    "name": "Tlapanec",
    "langcode": "TLN",
    "symbol": "tcf",
    "vernacularName": "me̱ʼpha̱a̱",
    "isSignLanguage": false
  },
  {
    "name": "To'abaita",
    "langcode": "OB",
    "symbol": "mlu",
    "vernacularName": "Toabaita",
    "isSignLanguage": false
  },
  {
    "name": "Toba",
    "langcode": "TOB",
    "symbol": "tob",
    "vernacularName": "toba",
    "isSignLanguage": false
  },
  {
    "name": "Tojolabal",
    "langcode": "TJO",
    "symbol": "toj",
    "vernacularName": "tojol-abʼal",
    "isSignLanguage": false
  },
  {
    "name": "Tok Pisin",
    "langcode": "MP",
    "symbol": "tpi",
    "vernacularName": "Tok Pisin",
    "isSignLanguage": false
  },
  {
    "name": "Tokelauan",
    "langcode": "OE",
    "symbol": "tkl",
    "vernacularName": "Faka-Tokelau",
    "isSignLanguage": false
  },
  {
    "name": "Tongan",
    "langcode": "TO",
    "symbol": "to",
    "vernacularName": "Faka-Tonga",
    "isSignLanguage": false
  },
  {
    "name": "Torres Strait Creole",
    "langcode": "TSC",
    "symbol": "tcs",
    "vernacularName": "Tores Streit Kriol",
    "isSignLanguage": false
  },
  {
    "name": "Totonac",
    "langcode": "TOT",
    "symbol": "top",
    "vernacularName": "totonaco",
    "isSignLanguage": false
  },
  {
    "name": "Toupouri",
    "langcode": "TPR",
    "symbol": "tui",
    "vernacularName": "Toupouri",
    "isSignLanguage": false
  },
  {
    "name": "Tshiluba",
    "langcode": "SH",
    "symbol": "lua",
    "vernacularName": "Tshiluba",
    "isSignLanguage": false
  },
  {
    "name": "Tshwa",
    "langcode": "AW",
    "symbol": "tsc",
    "vernacularName": "ciTshwa",
    "isSignLanguage": false
  },
  {
    "name": "Tsonga",
    "langcode": "TS",
    "symbol": "ts",
    "vernacularName": "Xitsonga",
    "isSignLanguage": false
  },
  {
    "name": "Turkish",
    "langcode": "TK",
    "symbol": "tr",
    "vernacularName": "Türkçe",
    "isSignLanguage": false
  },
  {
    "name": "Turkish Sign Language",
    "langcode": "TKL",
    "symbol": "tsm",
    "vernacularName": "Türk İşaret Dili",
    "isSignLanguage": true
  },
  {
    "name": "Turkmen",
    "langcode": "TMR",
    "symbol": "tk",
    "vernacularName": "türkmen",
    "isSignLanguage": false
  },
  {
    "name": "Turkmen (Cyrillic)",
    "langcode": "TM",
    "symbol": "tk-cyrl",
    "vernacularName": "түркмен (кириллица)",
    "isSignLanguage": false
  },
  {
    "name": "Tuvaluan",
    "langcode": "VL",
    "symbol": "tvl",
    "vernacularName": "Tuvalu",
    "isSignLanguage": false
  },
  {
    "name": "Tuvinian",
    "langcode": "VI",
    "symbol": "tyv",
    "vernacularName": "тыва",
    "isSignLanguage": false
  },
  {
    "name": "Twi",
    "langcode": "TW",
    "symbol": "tw",
    "vernacularName": "Twi",
    "isSignLanguage": false
  },
  {
    "name": "Tyrewuju",
    "langcode": "TYW",
    "symbol": "car-x-tyw",
    "vernacularName": "Tilewuyu",
    "isSignLanguage": false
  },
  {
    "name": "Tzeltal",
    "langcode": "TZE",
    "symbol": "tzh",
    "vernacularName": "tseltal",
    "isSignLanguage": false
  },
  {
    "name": "Tzotzil",
    "langcode": "TZO",
    "symbol": "tzo",
    "vernacularName": "tsotsil",
    "isSignLanguage": false
  },
  {
    "name": "Udmurt",
    "langcode": "UM",
    "symbol": "udm",
    "vernacularName": "удмурт",
    "isSignLanguage": false
  },
  {
    "name": "Ugandan Sign Language",
    "langcode": "USL",
    "symbol": "ugn",
    "vernacularName": "Ugandan Sign Language",
    "isSignLanguage": true
  },
  {
    "name": "Uighur (Arabic)",
    "langcode": "UGA",
    "symbol": "ug-x-uga",
    "vernacularName": "ئۇيغۇر تىلى ‏(‏ئەرەب يېزىقى‏)‏‏‏‏",
    "isSignLanguage": false
  },
  {
    "name": "Uighur (Cyrillic)",
    "langcode": "UG",
    "symbol": "ug-cyrl",
    "vernacularName": "Уйғур (кирилл йезиғи)",
    "isSignLanguage": false
  },
  {
    "name": "Ukrainian",
    "langcode": "K",
    "symbol": "uk",
    "vernacularName": "українська",
    "isSignLanguage": false
  },
  {
    "name": "Umbundu",
    "langcode": "UB",
    "symbol": "umb",
    "vernacularName": "Umbundu",
    "isSignLanguage": false
  },
  {
    "name": "Urdu",
    "langcode": "UD",
    "symbol": "ur",
    "vernacularName": "اُردو",
    "isSignLanguage": false
  },
  {
    "name": "Urhobo",
    "langcode": "UR",
    "symbol": "urh",
    "vernacularName": "Urhobo",
    "isSignLanguage": false
  },
  {
    "name": "Uripiv",
    "langcode": "URP",
    "symbol": "upv",
    "vernacularName": "Uripiv",
    "isSignLanguage": false
  },
  {
    "name": "Uruguayan Sign Language",
    "langcode": "LSU",
    "symbol": "ugy",
    "vernacularName": "lengua de señas uruguaya",
    "isSignLanguage": true
  },
  {
    "name": "Uruund",
    "langcode": "DR",
    "symbol": "rnd",
    "vernacularName": "Uruund",
    "isSignLanguage": false
  },
  {
    "name": "Uzbek",
    "langcode": "UZ",
    "symbol": "uz-cyrl",
    "vernacularName": "ўзбекча",
    "isSignLanguage": false
  },
  {
    "name": "Uzbek (Roman)",
    "langcode": "UZR",
    "symbol": "uz-latn",
    "vernacularName": "o‘zbekcha (lotincha)",
    "isSignLanguage": false
  },
  {
    "name": "Valencian",
    "langcode": "VLC",
    "symbol": "ca-x-vlc",
    "vernacularName": "valencià",
    "isSignLanguage": false
  },
  {
    "name": "Venda",
    "langcode": "VE",
    "symbol": "ve",
    "vernacularName": "Luvenda",
    "isSignLanguage": false
  },
  {
    "name": "Venezuelan Sign Language",
    "langcode": "LSV",
    "symbol": "vsl",
    "vernacularName": "lengua de señas venezolana",
    "isSignLanguage": true
  },
  {
    "name": "Vezo",
    "langcode": "VZ",
    "symbol": "skg-x-vz",
    "vernacularName": "Vezo",
    "isSignLanguage": false
  },
  {
    "name": "Vietnamese",
    "langcode": "VT",
    "symbol": "vi",
    "vernacularName": "Việt",
    "isSignLanguage": false
  },
  {
    "name": "Vietnamese Sign Language",
    "langcode": "SLV",
    "symbol": "hab",
    "vernacularName": "Việt Nam (Ngôn ngữ ký hiệu)",
    "isSignLanguage": true
  },
  {
    "name": "Wallisian",
    "langcode": "WA",
    "symbol": "wls",
    "vernacularName": "Faka'uvea",
    "isSignLanguage": false
  },
  {
    "name": "Warao",
    "langcode": "WRO",
    "symbol": "wba",
    "vernacularName": "warao",
    "isSignLanguage": false
  },
  {
    "name": "Waray-Waray",
    "langcode": "SA",
    "symbol": "war",
    "vernacularName": "Waray-Waray",
    "isSignLanguage": false
  },
  {
    "name": "Wayuunaiki",
    "langcode": "WY",
    "symbol": "guc",
    "vernacularName": "Wayuunaiki",
    "isSignLanguage": false
  },
  {
    "name": "Welsh",
    "langcode": "W",
    "symbol": "cy",
    "vernacularName": "Cymraeg",
    "isSignLanguage": false
  },
  {
    "name": "Wichi",
    "langcode": "WCH",
    "symbol": "wlv",
    "vernacularName": "wichi",
    "isSignLanguage": false
  },
  {
    "name": "Wixárika",
    "langcode": "HCH",
    "symbol": "hch",
    "vernacularName": "wixárika",
    "isSignLanguage": false
  },
  {
    "name": "Wolaita",
    "langcode": "WL",
    "symbol": "wal",
    "vernacularName": "Wolayttattuwaa",
    "isSignLanguage": false
  },
  {
    "name": "Wolof",
    "langcode": "WO",
    "symbol": "wo",
    "vernacularName": "Wolof",
    "isSignLanguage": false
  },
  {
    "name": "Xavante",
    "langcode": "XV",
    "symbol": "xav",
    "vernacularName": "A'uwẽ mreme",
    "isSignLanguage": false
  },
  {
    "name": "Xhosa",
    "langcode": "XO",
    "symbol": "xh",
    "vernacularName": "IsiXhosa",
    "isSignLanguage": false
  },
  {
    "name": "Yacouba",
    "langcode": "YCB",
    "symbol": "daf",
    "vernacularName": "Yaoba",
    "isSignLanguage": false
  },
  {
    "name": "Yakutsk",
    "langcode": "YK",
    "symbol": "sah",
    "vernacularName": "сахалыы",
    "isSignLanguage": false
  },
  {
    "name": "Yapese",
    "langcode": "YP",
    "symbol": "yap",
    "vernacularName": "Waab",
    "isSignLanguage": false
  },
  {
    "name": "Yaqui",
    "langcode": "YQ",
    "symbol": "yaq",
    "vernacularName": "jiiak noki",
    "isSignLanguage": false
  },
  {
    "name": "Yemba",
    "langcode": "BM",
    "symbol": "ybb",
    "vernacularName": "Dschang",
    "isSignLanguage": false
  },
  {
    "name": "Yombe",
    "langcode": "YMB",
    "symbol": "yom-x-ymb",
    "vernacularName": "Kiyombe",
    "isSignLanguage": false
  },
  {
    "name": "Yoruba",
    "langcode": "YR",
    "symbol": "yo",
    "vernacularName": "Yorùbá",
    "isSignLanguage": false
  },
  {
    "name": "Zambian Sign Language",
    "langcode": "ZAS",
    "symbol": "zsl",
    "vernacularName": "Zambian Sign Language",
    "isSignLanguage": true
  },
  {
    "name": "Zande",
    "langcode": "ZN",
    "symbol": "zne",
    "vernacularName": "Zande",
    "isSignLanguage": false
  },
  {
    "name": "Zapotec (Isthmus)",
    "langcode": "ZPI",
    "symbol": "zai",
    "vernacularName": "diidxazá",
    "isSignLanguage": false
  },
  {
    "name": "Zapotec (Ixtlán)",
    "langcode": "ZPX",
    "symbol": "zpd",
    "vernacularName": "Dillexhon",
    "isSignLanguage": false
  },
  {
    "name": "Zapotec (Lachiguiri)",
    "langcode": "ZPL",
    "symbol": "zpa",
    "vernacularName": "diitza",
    "isSignLanguage": false
  },
  {
    "name": "Zapotec (Villa Alta)",
    "langcode": "ZPV",
    "symbol": "zav",
    "vernacularName": "didza xhidza",
    "isSignLanguage": false
  },
  {
    "name": "Zapotec (del Valle)",
    "langcode": "ZPD",
    "symbol": "zab",
    "vernacularName": "ditsa",
    "isSignLanguage": false
  },
  {
    "name": "Zimbabwe Sign Language",
    "langcode": "ZSL",
    "symbol": "zib",
    "vernacularName": "Zimbabwe Sign Language",
    "isSignLanguage": true
  },
  {
    "name": "Zulu",
    "langcode": "ZU",
    "symbol": "zu",
    "vernacularName": "IsiZulu",
    "isSignLanguage": false
  }
]

module.exports = {
  LOCALES,
  STALE_LANGS,
  DAYJS_LOCALES,
  MEPS_IDS,
  FALLBACK_SITE_LANGS,
  FALLBACK_SITE_LANGS_DATE
}
