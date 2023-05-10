const DAYJS_LOCALES = [
  'de',
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
  'sv',
  'uk',
  // 'wes-x-pgw', // not yet supported by dayjs
]

// Languages that have no active translator
const STALE_LANGS = ['pt-pt']

const LOCALES = [
  {
    code: 'de',
    iso: 'de-DE',
    file: 'de.json',
    jw: 'X',
    name: 'Deutsch (German)',
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

const MEPS_IDS = {"0": "E", "1": "S", "2": "X", "3": "F", "4": "I", "5": "T", "6": "O", "7": "J", "8": "AU", "9": "AC", "10": "AF", "11": "AL", "12": "AM", "13": "AI", "14": "A", "15": "R", "16": "AE", "18": "IE", "19": "AR", "20": "BM", "21": "AO", "23": "BS", "24": "BA", "25": "AK", "26": "OI", "27": "BT", "29": "BE", "30": "IK", "31": "BI", "32": "LM", "33": "BO", "36": "BL", "37": "BU", "38": "CB", "39": "CV", "40": "CC", "42": "CN", "43": "CH", "45": "CG", "46": "CK", "47": "CW", "48": "NM", "49": "CT", "51": "CR", "52": "C", "53": "B", "54": "D", "57": "DI", "58": "DA", "59": "ED", "60": "EF", "62": "ST", "63": "EW", "64": "FA", "65": "FR", "66": "FN", "67": "FI", "68": "GA", "69": "GB", "72": "G", "73": "GL", "74": "GI", "75": "GU", "76": "EG", "78": "HK", "79": "HA", "80": "HW", "81": "HY", "82": "Q", "83": "HR", "84": "HV", "85": "HI", "86": "MO", "89": "H", "90": "IA", "91": "IG", "92": "IC", "93": "ID", "96": "IB", "98": "IL", "99": "IN", "101": "GC", "103": "IS", "104": "IT", "106": "JA", "107": "AH", "108": "KL", "110": "KA", "111": "KR", "114": "KS", "115": "KB", "117": "KG", "118": "KQ", "119": "KU", "121": "YW", "123": "RU", "124": "KI", "128": "KT", "129": "KO", "130": "OS", "131": "KP", "132": "UN", "134": "WG", "135": "KY", "136": "KW", "138": "LA", "139": "LF", "140": "LI", "141": "L", "142": "OM", "144": "LU", "151": "LO", "152": "LS", "153": "LV", "155": "MC", "157": "MG", "158": "ML", "159": "MY", "160": "MT", "161": "MI", "163": "MA", "166": "MR", "167": "RE", "169": "MH", "171": "CE", "173": "UU", "174": "MK", "175": "MM", "178": "OD", "180": "NP", "181": "MP", "182": "NI", "183": "NN", "184": "N", "188": "NZ", "189": "OG", "191": "OT", "192": "PU", "194": "PN", "195": "PA", "196": "ZN", "197": "PR", "198": "P", "199": "PP", "200": "PJ", "201": "RA", "202": "M", "204": "RN", "206": "RR", "207": "U", "208": "RT", "209": "SA", "211": "SM", "212": "SG", "213": "SE", "214": "SB", "216": "SU", "217": "SC", "218": "CA", "219": "SK", "220": "SN", "221": "V", "222": "SV", "223": "SP", "225": "SR", "227": "SD", "228": "SW", "229": "ZS", "230": "Z", "231": "TG", "232": "TH", "234": "TL", "236": "TU", "237": "SI", "239": "CI", "240": "TI", "241": "TV", "243": "OE", "244": "TO", "245": "TE", "246": "SH", "247": "TS", "248": "TN", "249": "TB", "250": "TK", "251": "VL", "252": "TW", "253": "K", "254": "UB", "255": "UD", "256": "UR", "257": "VE", "258": "VT", "259": "WA", "260": "W", "261": "WO", "262": "XO", "263": "YA", "264": "YP", "267": "YR", "268": "ZU", "269": "GK", "271": "GE", "272": "LD", "273": "OA", "275": "KIM", "276": "BQ", "277": "CQ", "278": "AN", "279": "CHS", "284": "AB", "285": "LT", "286": "MZ", "288": "DU", "292": "QU", "293": "QC", "295": "DM", "296": "AW", "297": "HM", "298": "RD", "304": "AJ", "305": "KAB", "307": "TAT", "309": "GBA", "310": "NV", "311": "OB", "314": "RM", "316": "WL", "317": "MIS", "318": "AZ", "319": "UG", "320": "KZ", "321": "AP", "324": "NC", "328": "KHK", "329": "YK", "330": "KHA", "331": "MAR", "332": "CU", "334": "JC", "336": "LAH", "338": "ABK", "339": "JL", "342": "BB", "343": "OSS", "346": "LR", "347": "KBY", "348": "KBR", "350": "RDA", "352": "LE", "353": "MAC", "355": "SEN", "356": "TJ", "357": "UZ", "358": "DR", "360": "ET", "361": "CO", "362": "VI", "364": "PJN", "367": "DG", "368": "FF", "369": "KIN", "370": "KIT", "374": "KIP", "375": "BEL", "376": "ALT", "377": "BLN", "380": "FO", "382": "GN", "383": "IBI", "384": "IH", "385": "TCR", "388": "SBO", "390": "MSH", "392": "KSN", "393": "REA", "394": "GCS", "399": "RCR", "401": "MAZ", "403": "TZE", "404": "TZO", "405": "UM", "409": "NK", "412": "WY", "413": "FT", "414": "BAK", "417": "MAY", "419": "LAD", "420": "ASL", "421": "QUB", "422": "TOB", "424": "TNK", "425": "TOT", "426": "VZ", "427": "MTU", "428": "PAA", "429": "LHK", "431": "MX", "432": "TJO", "433": "AJR", "434": "TSC", "435": "ZPI", "436": "ZPX", "437": "ZPV", "438": "ELI", "440": "TTP", "442": "CHL", "443": "NHT", "445": "TRH", "446": "TRS", "448": "IGE", "449": "QUA", "450": "LSA", "451": "AUS", "452": "LSB", "453": "BSL", "454": "SCH", "455": "LSC", "456": "CSE", "457": "DSL", "458": "NGT", "459": "SEC", "461": "FID", "462": "LSF", "463": "DGS", "464": "HDF", "465": "ISL", "466": "JSL", "467": "KSL", "468": "LSM", "469": "NDF", "470": "LSP", "471": "SPE", "472": "PDF", "473": "LSQ", "474": "RSL", "475": "LSE", "476": "LSV", "477": "PH", "479": "LX", "481": "LSN", "482": "RMS", "484": "NHG", "485": "TLN", "486": "NDA", "487": "DGR", "490": "GSL", "493": "LJ", "494": "QUN", "496": "QSL", "499": "AKA", "505": "XV", "506": "TSL", "507": "VSL", "508": "BSN", "509": "ZSL", "510": "LSL", "516": "CHJ", "520": "CLX", "526": "HST", "536": "MXG", "537": "MXO", "538": "MYO", "539": "MZH", "540": "NHH", "541": "NHV", "543": "OTM", "549": "PPU", "555": "YQ", "557": "PSL", "560": "LVA", "562": "OKP", "564": "SHU", "565": "AGR", "566": "SCR", "569": "KSI", "570": "ZPD", "572": "ZPL", "577": "ISG", "580": "LGP", "581": "LUC", "585": "UZR", "588": "SSL", "589": "LTS", "592": "SAS", "593": "UGA", "594": "GRF", "595": "LWX", "600": "SRM", "601": "GIB", "602": "INI", "604": "NZS", "605": "BVL", "607": "CRB", "608": "NBL", "609": "NHC", "610": "SWI", "619": "CSL", "620": "NGL", "622": "SGS", "623": "SBF", "625": "VGT", "626": "LSG", "627": "TTM", "628": "RPN", "629": "SZJ", "632": "MXT", "633": "SIL", "634": "MSL", "636": "JWK", "642": "FSL", "643": "NGB", "644": "CBS", "645": "OGS", "646": "CIN", "648": "EMB", "649": "MPD", "650": "WCH", "652": "SHO", "660": "ACH", "661": "AZA", "667": "SLM", "668": "NBZ", "672": "HZJ", "673": "JCR", "674": "KRI", "680": "MWL", "681": "TND", "682": "RNY", "684": "QIS", "687": "AKN", "690": "GTN", "695": "DAR", "697": "ABB", "698": "ATI", "699": "GUR", "700": "MBD", "701": "RMB", "702": "TPR", "703": "YCB", "704": "NSL", "705": "LMG", "710": "NYU", "719": "MAP", "720": "NEN", "724": "DGA", "726": "QIC", "727": "QII", "728": "QIP", "729": "QIT", "733": "TCN", "735": "SHC", "736": "ZAS", "737": "CNO", "739": "SLS", "741": "BIM", "743": "RMG", "745": "CPI", "746": "MWM", "747": "MKD", "748": "LSU", "752": "ALU", "757": "KYK", "761": "SGM", "764": "YMB", "766": "CGW", "768": "GLC", "769": "VLC", "770": "ALS", "771": "INS", "772": "MYW", "774": "PMN", "775": "PRA", "777": "WRO", "780": "KGL", "781": "LGA", "783": "NGN", "785": "TPO", "795": "AMG", "796": "GRZ", "798": "MCS", "801": "PMR", "802": "QUH", "803": "PLR", "807": "SLV", "810": "LAS", "814": "SGR", "817": "BZK", "820": "XPA", "822": "ABU", "826": "HSK", "827": "TAL", "828": "QUL", "829": "GHS", "830": "RMA", "841": "PQM", "843": "MGL", "848": "TYW", "850": "AHN", "858": "TMR", "859": "LSS", "860": "OTS", "862": "RMC", "872": "DMR", "880": "BTK", "883": "TEW", "884": "ARH", "887": "PAZ", "896": "OTE", "904": "LSI", "908": "NKN", "909": "MNO", "911": "RMR", "916": "SPL", "919": "GCR", "920": "GNC", "929": "MBA", "940": "MHM", "941": "MHS", "948": "FJS", "953": "AJG", "957": "EMC", "958": "EMP", "960": "GBM", "965": "KBV", "981": "PHN", "984": "TBW", "986": "TLR", "990": "USL", "992": "TKL", "996": "CGM", "997": "FGN", "999": "MTC", "1001": "RME", "1011": "CGS", "1013": "GHM", "1016": "SSA", "1023": "NMB", "1025": "RMV", "1032": "RMX", "1037": "NNS", "1043": "ESL", "1071": "CHC", "1072": "CNS", "1073": "LMB", "1077": "EWN", "1078": "MKA", "1084": "JML", "1090": "HMS", "1099": "HMA", "1111": "MTN", "1122": "KGG", "1123": "NGU", "1124": "STM", "1132": "PGW", "1156": "CGG", "1157": "HVU", "1171": "CQC", "1185": "KKL", "1216": "MIR", "1218": "RNN", "1238": "NSM", "1246": "HWP", "1253": "QIX", "1258": "STN", "1268": "BRS", "1286": "LBS"}

module.exports = {
  LOCALES,
  STALE_LANGS,
  DAYJS_LOCALES,
  MEPS_IDS
}
