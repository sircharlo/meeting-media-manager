const TEXT_FIELDS = ["localAppLang", "lang", "localOutputPath", "congregationName", "congServer", "congServerUser", "congServerPass", "congServerPort", "congServerDir", "musicFadeOutTime", "musicVolume", "mwStartTime", "weStartTime", "obsPort", "obsPassword", "obsMediaScene", "obsCameraScene", "preferredOutput"]
const CHECKBOXES = ["autoStartSync", "autoRunAtBoot", "enableMp4Conversion", "keepOriginalsAfterConversion", "autoQuitWhenDone", "autoOpenFolderWhenDone", "enableMusicButton", "enableMusicFadeOut", "excludeTh", "excludeLffi", "excludeLffiImages", "enableVlcPlaylistCreation", "enableMediaDisplayButton", "disableHardwareAcceleration", "enableObs", "hideMediaLogo"]
const RADIO_SELECTS = ["mwDay", "weDay", "maxRes", "musicFadeOutType"]
const TIME_FIELDS = ["mwStartTime", "weStartTime"]

export const PREF_FIELDS = {
  all: TEXT_FIELDS.concat(CHECKBOXES, RADIO_SELECTS, TIME_FIELDS),
  text: TEXT_FIELDS,
  checkbox: CHECKBOXES,
  radio: RADIO_SELECTS,
  time: TIME_FIELDS
}