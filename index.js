const express = require('express')
const app = express()

app.get('/', async (req, res) => {
  res.send('OK')
})

app.listen(8080, () => { console.log('Server established on port 8080')})