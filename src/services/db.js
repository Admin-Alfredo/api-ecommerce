const mongoose = require('mongoose')


mongoose.connect('mongodb://localhost:27017/negociosdb')
  .then(res => {
    console.log('API CONNECT DB NEGOCIOSDB')
  }).catch(err => {
    console.error(err.message)
  })
mongoose.Promise = global.Promise

module.exports =  app => (mongoose)
