const express = require('express')
const multer = require('multer')
const path = require('path')
const { getMimeType, allowedFiles } = require('../util/file.js')
require('../util')



async function validateProdutoFields(req, res, next, app) {
  const { fields } = app.models.Produto
  console.log(req.headers)
  const keysBody = Object.keys(req.body)
  try {
    if (keysBody.length < 1)
      return res.status(412).json({ mensagem: 'Pré condição falhada' })

    for (let index = 0; index < keysBody.length; index++) {
      const fieldForUpdate = keysBody[index]

      if (!fields.hasField(fieldForUpdate) && index < keysBody.length - 1)
        continue

      else if (!fields.hasField(fieldForUpdate) && index === keysBody.length - 1)
        return res.status(412).json({ mensagem: `O campo [${fieldForUpdate}] não é suportados` })

      else {
        if (fieldForUpdate == 'nome' && !req.body[fieldForUpdate])
          return res.status(400).json({ mensagem: 'qual é o nome do produto?' })

        if (fieldForUpdate == 'descricao' && !req.body[fieldForUpdate])
          return res.status(400).json({ mensagem: 'Informe uma descrição do produto.' })

        if (fieldForUpdate == 'descricao' && req.body[fieldForUpdate].length < 6)
          return res.status(400).json({ mensagem: 'descrição do muito curta.' })

        if (fieldForUpdate == 'preco' && !req.body[fieldForUpdate])
          return res.status(400).json({ mensagem: 'qual é o preço do produto?' })

        if (fieldForUpdate == 'preco' && !/^\d+|\d+\.\d+$/.test(req.body[fieldForUpdate].trim()))
          return res.status(400).json({ mensagem: 'O preço do produto deve ser um valor em Kwanza.' })

        if (fieldForUpdate == 'preco')
          req.body[fieldForUpdate] = Number(req.body[fieldForUpdate].trim())

        if (fieldForUpdate == 'quantidade' && !req.body[fieldForUpdate])
          return res.status(400).json({ mensagem: 'informe a quantidade do produto.' })

        if (fieldForUpdate == 'quantidade' && !/^\d+|\d+\.\d+$/.test(req.body[fieldForUpdate].trim()))
          return res.status(400).json({ mensagem: 'Quantidade do produto um valor inteiro.' })

        if (fieldForUpdate == 'quantidade')
          req.body[fieldForUpdate] = Number(req.body[fieldForUpdate].trim())
      }
    }
    return next()
  } catch (err) {
    return res.status(400).json({ message: err.message })
  }
}


module.exports = app => {
  const router = express.Router()
  const { Model: Produto } = app.models.Produto

  router.post('/',
    (req, res, next) => (validateProdutoFields(req, res, next, app)),
    async function (req, res) {
      try {
        const produto = await Produto.create(req.body)
        return res.status(200).json({ produto })
      } catch (err) {
        return res.status(400).json({ mensagem: err.message })
      }
    })

  router.get('/:produtoId', async function (req, res) {
    try {
      const produto = await Produto.findById(req.params.produtoId)
      if (!produto)
        return res.status(400).json({ mensagem: '[Erro Produto] desconhecido' })
      return res.status(200).json({ produto })

    } catch (err) {
      return res.status(400).json({ mensagem: err.message })
    }
  })

  router.get('/', async function (req, res) {
    try {
      const produtos = await Produto.find({}).populate(['imagens'])

      if (!produtos)
        return res.status(400).json({ mensagem: '[Erro Produto] desconhecido' })

      return res.status(200).json({ produtos })

    } catch (err) {
      return res.status(400).json({ mensagem: err.message })
    }
  })
  router.put('/:produtoId',
    (req, res, next) => (validateProdutoFields(req, res, next, app)),
    async function (req, res) {
      try {

        await Produto.findByIdAndUpdate(req.params.produtoId, req.body)

        const produto = await Produto.findById(req.params.produtoId)
        if (!produto)
          return res.status(400).json({ mensagem: "Erro ao atualizar usuário" })

        return res.status(201).json({ produto })
      } catch (err) {
        return res.status(400).json({ mensagem: err.message })
      }

    })
  router.delete('/:produtoId', async function (req, res) {
    try {
      const produto = await Produto.findByIdAndDelete(req.params.produtoId)
      if (!produto)
        return res.status(400).json({ mensagem: "Erro ao deletar produto" })

      return res.status(200).json({ mensagem: "Ok" })
    } catch (err) {
      return res.status(400).json({ mensagem: err.message })
    }
  })
  app.use('/api/produto', router)
}
