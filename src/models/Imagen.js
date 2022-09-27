
module.exports = app => {
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
