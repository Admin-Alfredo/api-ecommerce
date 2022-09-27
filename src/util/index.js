Array.prototype.hasField = function (field) {
  let result = false;
  for (let i = 0; i < this.length; i++) {
    result = this[i] === field
    if (!result && i < this.length - 1)
      continue
    if (!result && i === this.length - 1)
      return false
    else
      return result
  }
}
exports.BASE_URL_IMAGE = `${process.env.HOST || ''}/data/imagens`