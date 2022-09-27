const express = require('express')
const bodyParser = require('body-parser')
const consign = require('consign')
const path = require('path')
const app = express();

app.use(bodyParser.json({ limit: 1024 * 1024 * 3}));
// app.use(bodyParser.urlencoded({ limit: 1024 * 1024 * 3}));

app.use('/api/datas', express.static('../public'))


consign({ cwd: path.join(process.cwd(), '/src') })
	.include('./services/db.js')
	.then('./models')
	.then('./routers')
	.into(app)

app.listen(5000, () => console.log(`RUNNING IN PORT 5000...`))