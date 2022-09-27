const { statSync, unlinkSync } = require('fs')
const path = require('path')
const allowedFiles = {
  imagens: new Set(['png', 'jpg', 'jpeg', 'gif'])
}
const __dirname__ = process.cwd()

function getMimeType(mimetype) {
  if (!mimetype) throw new Error('MimeType empty')
  const execType = /^\w+\/(\w+)$/.exec(mimetype)
  if (!execType) throw new Error('No is mimetype')
  return execType[1]
}

exports.allowedFiles = allowedFiles
exports.__dirname__ = __dirname__
exports.REG_EXP_FILE_NAME = /\/((\w+_\d{1,}-\d{1,})\.(\w{1,}))$/i
exports.BASE_URL_IMAGE = `${process.env.HOST || ''}/datas/imagens`

exports.getMimeType = getMimeType

exports.destination = function (req, file, cb) {
  const fullPath = path.join(__dirname__, '/public', this._folder ? this._folder : '')
  // console.log(fullPath)
  cb(null, fullPath)
}

exports.filename = function (req, file, cb) {
  const uniqueId = Date.now() + '-' + Math.floor(Math.random() * 1E12)
  // console.log(file.mimetype.toLowerCase())
  const mimetype = getMimeType(file.mimetype)
  cb(null, file.fieldname + '_' + uniqueId + '.' + mimetype)
}

exports.removeFile = function (src) {
  try {
    const fileStat = statSync(src)
    if (fileStat.isFile()) unlinkSync(src);

  } catch (err) { }
}

Array.prototype.filesNotContained = function(filesArray){
  const _filesArray = new Set(filesArray)
  // {
  //   filename:
  //   orinalname:
  //   path:
  // }
  // Cria uma nova array com os elementos da [this] que não estão contidos na filesArray
  return this.filter(file => (!_filesArray.has(file)))
}
