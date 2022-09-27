
module.exports = app => {
  const mongoose = app.services.db

  const ProdutoSchema = new mongoose.Schema({
    nome: {
      type: String,
      required: true,
    },
    descricao: {
      type: String,
      require: true
    },
    preco: {
      type: Number,
      require: true
    },
    quantidade: {
      type: Number,
      require: false
    },
    imagens: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Image',
      require: true,
    }],
    criadoEm: {
      type: Date,
      default: Date.now
    }
  })
  return {
    Model: mongoose.model('Produto', ProdutoSchema),
    fields: Object.keys(ProdutoSchema.paths).filter(key => (
      key != '_id' &&
      key != '__v' &&
      key != 'criadoEm' &&
      key != 'imagens' 
    ))
  }
}
