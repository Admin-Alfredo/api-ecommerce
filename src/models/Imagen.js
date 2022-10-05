module.exports = app => {
  const path = require('path');
  const { removeFile } = require('../util/file');
  const mongoose = app.services.db

  const ImageSchema = new mongoose.Schema({
    url: {
      type: String,
      require: true
    },
    largura: {
      type: Number,
      require: false
    },
    altura: {
      type: Number,
      require: false
    },
    aspectRatio: {
      type: Number,
      require: false
    },
    criadoEm: {
      type: Date,
      default: Date.now
    }
  })
  ImageSchema.pre('findOneAndDelete', async function (next) {
    // const rootId =  await this.model.Image.deleteOne({_id: this._conditions?._id })
    // console.log("root: ", rootId.url)
    // if(!rootId)
    //   return;
    // const root = await this.findById(rootId)

    // console.log("DELETEENG...", path.join(process.cwd(), '/public'))
    // const sourceImageOS = path.join(process.cwd(), '/public', this.url)
    // console.log(sourceImageOS)
    // removeFile(sourceImageOS)
    next()
  })
  return {
    Model: mongoose.model('Image', ImageSchema),
    fields: Object.keys(ImageSchema.paths).filter(key => (
      key != '_id' &&
      key != '__v' &&
      key != 'url' &&
      key != 'criadoEm'
    ))
  }

  return
}
