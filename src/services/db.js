const mongoose = require('mongoose')


mongoose.connect('mongodb://localhost:27017/negociosdb', {
  useNewUrlParser: true, 
  useUnifiedTopology: true,
  family: 4,
})
  .then(res => {
    console.log('API CONNECT DB NEGOCIOSDB')
  }).catch(err => {
    console.error("[MONGOOSE ERROR] ", err.message)
  })
mongoose.Promise = global.Promise

module.exports =  app => (mongoose)
