const express = require('express')
const pool = require('./pool.js')
const app = express()

app.get('/', async (req, res) => {
  res.send('STATUS 200')
});

app.get('/api/getEquipment', async (req, res) => {
  pool.query('SELECT * FROM equipment', (err, results) => {
    if (err) {
      res.json('Error encountered!');
      console.log('Error encountered: ' + err); // Returns error to console only for securiy purposes
      return;
    }

    let data = results.rows // Assignsn shorter identifier to results
    console.log(data);
    res.status(200).json(data)
  })
});

app.get('/api/getUser', async (req, res) => {
  pool.query('SELECT * FROM user', (err, results) => {
    if (err) {
      res.json('Error encountered!');
      console.log('Error encountered: ' + err); // Returns error to console only for securiy purposes
      return;
    }

    let data = results.rows // Assignsn shorter identifier to results
    console.log(data);
    res.status(200).json(data)
  })
});

app.listen(8080, () => { console.log('Server established on port 8080')})
