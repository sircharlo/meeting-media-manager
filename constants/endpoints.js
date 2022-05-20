const { name, author } = require('./../package.json')

// JW
const YEARTEXT = (lang) => `https://wol.jw.org/wol/finder?docid=1102022800&wtlocale=${lang}&format=json&snip=yes`
const JW_API = `https://b.jw-cdn.org/apis/pub-media/GETPUBMEDIALINKS?output=json`
const JWPUB_API = "https://b.jw-cdn.org/apis/mediator/v1/media-items/"

// GitHub
const REPO_URL = `https://github.com/${author}/${name}/`
const FFMPEG_VERSION = "https://api.github.com/repos/vot/ffbinaries-prebuilt/releases/latest"

module.exports = {
  YEARTEXT,
  JW_API,
  JWPUB_API,
  REPO_URL,
  FFMPEG_VERSION
}