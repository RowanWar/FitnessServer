const express = require('express')
const pool = require('./pool.js')
const app = express()

app.get('/', async (req, res) => {
  res.send('STATUS 200')
});

app.get('/api/getEquipment', async (req, res) => {
  pool.query('SELECT * FROM equipment e JOIN equipment_type et ON e.equip_type_id = et.equip_type_id ORDER BY e.equip_type_id, equip_id ASC;', (err, results) => {
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
      // Returns detailed error to console only for securiy reasons.
      console.log('Error encountered: ' + err);
      return (res.json('Error encountered!'));
    }

    let data = results.rows // Assignsn shorter identifier to results
    console.log(data);
    res.status(200).json(data)
  })
});

app.get('/api/getAllReservations', async (req, res) => {
  pool.query('SELECT * FROM reservation', (err, results) => {
    if (err) {
      // Returns detailed error to console only for securiy reasons.
      console.log('Error encountered: ' + err);
      return (res.json('Error encountered!'));
    }

    res.status(200).json(results.rows);
  })
});

app.get('/api/getReservation/:id', async (req, res) => {
  //const id = parseInt(req.params.id);
  const id = req.params.id;
  try {
    pool.query('SELECT * FROM reservation WHERE reservation_id = $1', [id], (err, results) => {
      const data = results.rows;
      if (err) {
        // Returns detailed error to console only for securiy reasons.
        console.log('Error encountered: ' + err);
        return (res.json('Error encountered!'));
      }

      else if (data.length === 0) {
        console.log('No reservation with ID of $1', [id]);
        res.json('No reservation with ID of $1', [id]);

        return;
      }
      else {
        console.log(res.status);
        res.status(200).json(data);
      }
    })
  } catch (catchError) {
    console.error(catchError);
  }

});

app.listen(8080, () => { console.log('Server established on port 8080')})
