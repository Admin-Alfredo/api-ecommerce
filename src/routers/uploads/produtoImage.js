const event = require('events')
const busboy = require('busboy')

function validateImageProdutoFields(req, res, app) {
  const { fields } = app.models.Imagen
  const keysBody = Object.keys(req.body)
  try {
    if (keysBody.length < 1)
      return res.status(412).json({ mensagem: 'Pré condição falhada' })

    for (let index = 0; index < keysBody.length; index++) {
      const fieldForUpdate = keysBody[index]

      if (!fields.hasField(fieldForUpdate))
        return res.status(412).json({ mensagem: `O campo [${fieldForUpdate}] não é suportado.` })

      if (fieldForUpdate == 'largura' && !req.body[fieldForUpdate])
        return res.status(400).json({ mensagem: 'qual é o nome do produto?' })

      if (fieldForUpdate == 'largura' && !/^(\d+|\d+\.\d+)$/.test(req.body[fieldForUpdate].trim()))
        return res.status(400).json({ mensagem: `A ${fieldForUpdate} só suporta dado do tipo interio` })

      if (fieldForUpdate == 'altura' && !req.body[fieldForUpdate])
        return res.status(400).json({ mensagem: 'qual é o nome do produto?' })

      if (fieldForUpdate == 'altura' && !/^(\d+|\d+\.\d+)$/.test(req.body[fieldForUpdate].trim()))
        return res.status(400).json({ mensagem: `A ${fieldForUpdate} só suporta dado do tipo interio` })

      if (fieldForUpdate == 'aspectRatio' && !req.body[fieldForUpdate])
        return res.status(400).json({ mensagem: 'qual é o nome do produto?' })

      if (fieldForUpdate == 'aspectRatio' && !/^(\d+|\d+\.\d+)$/.test(req.body[fieldForUpdate].trim()))
        return res.status(400).json({ mensagem: `A ${fieldForUpdate} só suporta dado do tipo interio` })
    }
    return true
  } catch (err) {
    return res.status(400).json({ message: err.message })
  }
}

module.exports = app => {
  const express = require('express')
  const router = express.Router()
  const { Model: Produto } = app.models.Produto
  const { Model: Imagen } = app.models.Imagen

  const mongoose = app.services.db
  const multer = require('multer')
  const path = require('path')
  const { getMimeType, allowedFiles, removeFile, BASE_URL_IMAGE } = require('../../util/file.js')

  const uploadsPost = multer({
    storage: multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, path.join(process.cwd(), '/public/datas/imagens'))
      },

      filename: function (req, file, cb) {
        const uniqueId = Date.now() + '-' + Math.floor(Math.random() * 1E12)
        const mimetype = getMimeType(file.mimetype)
        cb(null, file.fieldname + '_' + uniqueId + '.' + mimetype)
      }
    }),
    limits: { fileSize: 1024 * 1024 * 3.5 },
    fileFilter(req, file, cb) {
      if (!allowedFiles.imagens.has(getMimeType(file.mimetype)))
        return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname))
      return cb(null, true)
    }
  }).single('image')


  const uploadsPut = multer({
    storage: multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, path.join(process.cwd(), '/public/datas/imagens'))
      },
      filename: function (req, file, cb) {
        const uniqueId = Date.now() + '-' + Math.floor(Math.random() * 1E12)
        const mimetype = getMimeType(file.mimetype)
        cb(null, file.fieldname + '_' + uniqueId + '.' + mimetype)
      }
    }),
    limits: { fileSize: 1024 * 1024 * 3.5 },
    fileFilter(req, file, cb) {
      if (!allowedFiles.imagens.has(getMimeType(file.mimetype)))
        return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname))
      return cb(null, true)
    }
  }).single('image')


  router.post('/:produtoId',
    async function (req, res) {
      uploadsPost(req, res, async function (err) {
        const { produtoId } = req.params
        const isValid = validateImageProdutoFields(req, res, app)
        if (isValid !== true)
          return;

        if (err && err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE')
          return res.status(400).json({ mensagem: "Arquivo muito grande. requerido <= 2.5MB" })

        if (err && err instanceof multer.MulterError && err.code === 'LIMIT_UNEXPECTED_FILE')
          return res.status(400).json({ mensagem: "Ficheiro não suportado" })

        if (err)
          return res.status(400).json({ mensagem: err.message })

        if (!produtoId) {
          removeFile(req.file.path)
          return res.status(400).json({ mensagem: "Erro ao fazer uploads da imagen do produto" })
        }

        if (!mongoose.isObjectIdOrHexString(produtoId)) {
          removeFile(req.file.path)
          return res.status(400).json({ mensagem: "Erro ao fazer uploads da imagen do produto" })
        }

        const _produto = await Produto.findById(produtoId)

        if (!_produto) {
          removeFile(req.file.path)
          return res.status(400).json({ mensagem: "Erro ao fazer uploads produto" })
        }
        console.log(req.file, _produto.imagens, req.body)
        if (_produto.imagens.length == 3) {
          removeFile(req.file.path)
          return res.status(400).json({ mensagem: "Excedeu o número de imagen aceitevel pelo sistema." })
        }

        req.body.url = `${BASE_URL_IMAGE}/${req.file.filename}`

        const imageProduto = await Imagen.create(req.body)

        _produto.imagens.push(imageProduto._id)

        await _produto.save()

        const produto = await Produto.findById(_produto._id).populate(['imagens'])

        return res.status(200).json({ produto })
      })
    })

  router.put('/:produtoId/:imageId', function (req, res) {
    uploadsPut(req, res, async function (err) {
      const { produtoId, imageId } = req.params
      const { img: imgName } = req.query

      const isValid = validateImageProdutoFields(req, res, app)
      if (isValid !== true)
        return;

      if (err && err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE')
        return res.status(400).json({ mensagem: "Arquivo muito grande. requerido <= 2.5MB" })

      console.log(produtoId, imageId, imgName)

      if (err && err instanceof multer.MulterError && err.code === 'LIMIT_UNEXPECTED_FILE')
        return res.status(400).json({ mensagem: "Ficheiro não suportado" })

      if (err)
        return res.status(400).json({ mensagem: err.message })

      if (!produtoId) {
        removeFile(req.file.path)
        return res.status(400).json({ mensagem: "Erro ao fazer uploads. produto desconhecida" })
      }

      if (!mongoose.isObjectIdOrHexString(produtoId)) {
        removeFile(req.file.path)
        return res.status(400).json({ mensagem: "Erro ao fazer uploads. ocorrencia desconhecida" })
      }

      if (!imageId) {
        removeFile(req.file.path)
        return res.status(400).json({ mensagem: "Erro ao fazer uploads. id da imagen invalida" })
      }

      if (!mongoose.isObjectIdOrHexString(imageId)) {
        removeFile(req.file.path)
        return res.status(400).json({ mensagem: "Erro ao fazer uploads. imagen desconhecida" })
      }

      const _produto = await Produto.findById(produtoId).populate(['imagens'])

      if (!_produto) {
        removeFile(req.file.path)
        return res.status(400).json({ mensagem: "Erro ao fazer uploads. produto desconhecida" })
      }

      if (_produto.imagens.length === 0) {
        removeFile(req.file.path)
        return res.status(400).json({ mensagem: "Erro ao fazer uploads. nao há imagen para atualizar" })
      }

      const imageAtual = _produto.imagens.find(_image => {
        const resultFileName = REG_EXP_FILE_NAME.exec(_image.url)[1]
        if (resultFileName === imgName)
          return _image
      })

      if (!imageAtual) {
        removeFile(req.file.path)
        return res.status(400).json({ mensagem: "Erro ao fazer uploads.nao há imagen para atualizar" })
      }

      const imagen = await Imagen.findById(imageAtual._id)

      _produto.imagens = _produto.imagens.map(_image => {
        const resultURL = REG_EXP_FILE_NAME.exec(_image.url)[1]
        if (resultURL === REG_EXP_FILE_NAME.exec(imagen.url)[1]){
          _image.url = `${BASE_URL_IMAGE}/${req.file.filename}`;
          return _image
        }
        return _image
      })

      body.url = `${BASE_URL_IMAGE}/${req.file.filename}`
      await imageAtual.save()
      const produto = await _produto.save()

      removeFile(path.join(process.cwd(), '/public', pathAtualImage))

      return res.status(200).json({ produto })
    })
  })

  router.delete('/:produtoId', async function (req, res) {
    const { produtoId } = req.params
    const { photoid } = req.query

    if (!produtoId)
      return res.status(400).json({ mensagem: "Erro ao fazer uploads. ocorrencia desconhecida" })

    if (!photoid)
      return res.status(400).json({ mensagem: "Erro ao fazer apagar imagen. id da imagen invalida" })

    const _produto = await Ocorrencia.findById(produtoId)

    if (!_produto)
      return res.status(400).json({ mensagem: "Erro ao fazer apagar imagen. ocorrencia desconhecida" })


    if (_produto.imagens.length === 0)
      return res.status(400).json({ mensagem: "Erro ao fazer apagar imagen. ocorrencia desconhecida" })

    const pathAtualImage = _produto.imagens.find(_path => {
      const resultFileName = REG_EXP_FILE_NAME.exec(_path)[1]
      if (resultFileName === photoid)
        return _path
    })

    if (!pathAtualImage)
      return res.status(400).json({ mensagem: "Erro ao fazer apagar imagen. ocorrencia desconhecida" })

    _produto.imagens = _produto.imagens.filter(_path => {
      const resultFileName = REG_EXP_FILE_NAME.exec(_path)[1]
      return (resultFileName != photoid)
    })

    const ocorrencia = await _produto.save()

    removeFile(path.join(process.cwd(), '/public', pathAtualImage))
    res.status(200).json({ mensagem: "OK" })
  })

  app.use('/api/produto/uploads', router)
}