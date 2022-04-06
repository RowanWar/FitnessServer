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

// Grabs the id in the format of http://35.202.135.188:8080/api/getreservation/1
app.get('/api/getReservation/:id', async (req, res) => {
  const id = req.params.id;

  try {
    // Queries the reservation via passed ID param above
    pool.query('SELECT * FROM reservation WHERE reservation_id = $1', [id], (err, results) => {

      if (err) {
        // Returns detailed error to console only for securiy reasons.
        console.log('Error encountered: ' + err);
        return (res.json('Error encountered!'));
      }

      else if (results.rows.length === 0) {
        console.log('No reservation with this ID');
        res.status(200).json('No reservation with this ID');
      }

      else {
        res.status(200).json(results.rows);
      }
    })
  }
  catch (catchError) {
    console.error(catchError);
  }
});

app.put('/api/createReservation/:id', async (req, res) => {
  const id = req.params.id;
  // const updatedReservation = req.body;

  const checkEquipAvailable = 'SELECT is_available from equipment WHERE equip_id = $1'
  const checkEquipAvailableVals = [id]

  const reservationQuery = 'INSERT INTO reservation(equip_id, user_id, cat_name, category_desc) VALUES($1, $2, $3, $4) RETURNING *';
  const reservationQueryVals = ['6', '1', 'Categ name', 'Categ description'];
  const equipmentQuery = 'UPDATE equipment SET is_available = $1 WHERE equip_id = $2 RETURNING *';
  // Passes in the id via the request paramter so it knows which reservation to amend
  const equipmentQueryVals = [false, id];

  pool.query(checkEquipAvailable, checkEquipAvailableVals)
      .then (res => {
        if (res.rows = !true) {
          console.log('If statement ran');
          res.status(200).json('This equipment is already reserved!');
          return;
        }
        console.log('Fist query = ' res);
        pool.query(reservationQuery, reservationQueryVals)
        console.log('1st promise')
        .then (res2 => {
          pool.query(equipmentQuery, equipmentQueryVals)
          console.log('2nd promise')
          .then (res3 => {
            console.log(res3.rows)
          })
          .catch(e => console.error(e.stack))
          })
    });

  // pool.query(reservationQuery, reservationQueryVals)
  //   .then (res => {
  //     console.log(res.rows)
  //     pool.query(equipmentQuery, equipmentQueryVals)
  //     .then (res2 => {
  //       console.log(res2.rows)
  //       })
  //       .catch(e => console.error(e.stack))
  //   })
});

    //SELECT * FROM equipment e JOIN equipment_type et ON e.equip_type_id = et.equip_type_id ORDER BY e.equip_type_id, equip_id ASC;
    // Queries the reservation via passed ID param above
    // pool.query('SELECT * FROM reservation r JOIN equipment e ON r.equip_id = e.equip_id WHERE reservation_id = $1 ORDER BY r.reserve_time DESC', [id], (err, results) => {
    // pool.query(UPDATE "reservation")
    // pool.query(INSERT INTO reservation()VALUES(), (err, results) => {
    //
    //   if (err) {
    //     // Returns detailed error to console only for securiy reasons.
    //     console.log('Error encountered: ' + err);
    //     return (res.json('Error encountered!'));
    //   }
    //
    //   else if (results.rows.length === 0) {
    //     console.log('No reservation with this ID');
    //     res.status(200).json('No reservation with this ID');
    //   }
    //
    //   else {
    //     // res.status(200).json(results.rows.reservation_id);
    //     // res.status(200).json(results.rows);
    //     // results.rows.is_available = updatedReservation;
    //     res.status(200).json(results.rows);
    //   }
    // })



app.listen(8080, () => { console.log('Server established on port 8080')})
