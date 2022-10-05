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
        return res.status(400).json({ mensagem: `informe a ${fieldForUpdate} da imagen?` })

      if (fieldForUpdate == 'largura' && !/^(\d+|\d+\.\d+)$/.test(req.body[fieldForUpdate].trim()))
        return res.status(400).json({ mensagem: `A ${fieldForUpdate} só suporta dado do tipo interio` })

      if (fieldForUpdate == 'altura' && !req.body[fieldForUpdate])
        return res.status(400).json({ mensagem: `informe a ${fieldForUpdate} da imagen?` })

      if (fieldForUpdate == 'altura' && !/^(\d+|\d+\.\d+)$/.test(req.body[fieldForUpdate].trim()))
        return res.status(400).json({ mensagem: `A ${fieldForUpdate} só suporta dado do tipo interio` })

      if (fieldForUpdate == 'aspectRatio' && !req.body[fieldForUpdate])
        return res.status(400).json({ mensagem: `informe o ${fieldForUpdate} da imagen?` })

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
  const multer = require('multer')
  const path = require('path')

  const mongoose = app.services.db
  const {
    getMimeType,
    allowedFiles,
    removeFile,
    BASE_URL_IMAGE
  } = require('../../util/file.js')

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
        // console.log("(>>>): " , _produto.imagens)
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

  router.put('/:produtoId', function (req, res) {
    uploadsPut(req, res, async function (err) {
      const { produtoId } = req.params
      const { imgid: imageId } = req.query

      const isValid = validateImageProdutoFields(req, res, app)
      if (isValid !== true)
        return;

      if (err && err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE')
        return res.status(400).json({ mensagem: "Arquivo muito grande. requerido <= 2.5MB" })

      // console.log(produtoId, imageId)

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
        return res.status(400).json({ mensagem: "Erro ao fazer uploads.  produto desconhecida" })
      }

      if (!imageId) {
        removeFile(req.file.path)
        return res.status(400).json({ mensagem: "Erro ao fazer uploads. id da imagen invalida" })
      }

      if (!mongoose.isObjectIdOrHexString(imageId)) {
        removeFile(req.file.path)
        return res.status(400).json({ mensagem: "Erro ao fazer uploads. imagen desconhecida" })
      }
      try {

        const _produto = await Produto.findById(produtoId)

        if (!_produto) {
          removeFile(req.file.path)
          return res.status(400).json({ mensagem: "Erro ao fazer uploads. produto desconhecida" })
        }

        if (_produto.imagens.length === 0) {
          removeFile(req.file.path)
          return res.status(400).json({ mensagem: "Erro ao fazer uploads. nao há imagen para deletar" })
        }

        const oldImagen = await Imagen.findOneAndDelete({ _id: imageId })

        if (!oldImagen) {
          removeFile(req.file.path)
          return res.status(400).json({ mensagem: "Erro ao fazer uploads. Erro ao localizar imagen" })
        }

        removeFile(path.join(process.cwd(), '/public', oldImagen.url))
        req.body.url = `${BASE_URL_IMAGE}/${req.file.filename}`

        const newImage = await Imagen.create(req.body)

        _produto.imagens = _produto.imagens.map((_imageId) => {
          if (_imageId == oldImagen._id)
            return newImage._id
          else return _imageId
        })
        await _produto.save()
        const produto = await Produto.findById(_produto._id).populate(['imagens'])
        return res.status(200).json({ produto })
      } catch (err) {
        return res.status(400).json({ mensagem: err.message })
      }
    })
  })

  router.delete('/:produtoId', async function (req, res) {
    const { produtoId } = req.params
    const { imgid: imageId } = req.query
    const _produto = await Produto.findById(produtoId)

    try{

      if (!produtoId) {
        removeFile(req.file.path)
        return res.status(400).json({ mensagem: "Erro ao fazer uploads. produto desconhecida" })
      }
  
      if (!mongoose.isObjectIdOrHexString(produtoId)) {
        removeFile(req.file.path)
        return res.status(400).json({ mensagem: "Erro ao fazer uploads.  produto desconhecida" })
      }
  
      if (!imageId) {
        removeFile(req.file.path)
        return res.status(400).json({ mensagem: "Erro ao fazer uploads. id da imagen invalida" })
      }
  
      if (!mongoose.isObjectIdOrHexString(imageId)) {
        removeFile(req.file.path)
        return res.status(400).json({ mensagem: "Erro ao fazer uploads. imagen desconhecida" })
      }
  
      if (_produto.imagens.length === 0)
        return res.status(400).json({ mensagem: "Erro ao fazer apagar imagen. Erro ao localizar imagen" })
  
  
      const oldImagen = await Imagen.findOneAndDelete({ _id: imageId })
  
      if (!oldImagen) {
        removeFile(req.file.path)
        return res.status(400).json({ mensagem: "Erro ao fazer uploads. Erro ao localizar imagen" })
      }
  
      removeFile(path.join(process.cwd(), '/public', oldImagen.url))
  
      _produto.imagens = _produto.imagens.filter(_imageId => (_imageId !== oldImagen._id))
  
      await _produto.save()
  
      return res.status(200).json({ mensagem: "OK" })
      
    }catch(err){
      return res.status(400).json({ mensagem: err.message })
    }
  })

  app.use('/api/produto/uploads', router)
}