const express = require('express')
const pool = require('./pool.js')
const app = express()

function deleteReservationById(equipId) {
    const deleteReservationQuery = 'DELETE FROM reservation WHERE equip_id = $1 RETURNING *';
    const queryValues = [equipId];

    const equipmentQuery = 'UPDATE equipment SET is_available = $1 WHERE equip_id = $2'; // Updates the auto deleted reservation to True so it can be reserved once again
    const equipmentQueryVals = [true, equipId];   // Passes in the id via the request paramter so it knows which reservation to amend

    pool.query(deleteReservationQuery, queryValues)
      .then (response => {
        pool.query(equipmentQuery, equipmentQueryVals, (err, results) => {
          if (err) {
            return (console.log('Error encountered: ' + err)); // For security reasons, returns specific error to console-only
          }
          console.log('Updated equipment ' + equipId + ' with availablity "True"');
        })
      });
}
app.get('/', async (req, res) => {
  res.send('STATUS 200')
});


app.get('/api/authenticateUser/:email', async (req, res) => {
  const email = req.params.email;

  pool.query('SELECT * FROM user_table WHERE email = $1', [email], (err, results) => {
    if (err) {
      console.log('Error encountered: ' + err); // For security reasons, returns specific error to console-only
      return (res.json('Error encountered!'));
    }
    // If email doesn't exist, return json message
    else if (results.rows.length == 0) {
      return (res.status(404).json('No user found with this email'));
    }

    const userData = results.rows[0]; // Assigns shorter identifier to first (and only) result from query
    console.log('\nSuccessfully authenticated user: ' + email + ', ID: ' + userData['user_id']);
    res.status(200).json(userData['user_id']); // Accesses the returned object and returns only the ID to the API response
  })
})


// Checks if user has a valid reservation in DB for home screen
app.get('/api/checkUserHasReservation/:userId', async (req, res) => {
  const userId = req.params.userId;

  const checkUserHasReservation = 'SELECT * FROM reservation WHERE user_id = $1';
  const checkUserHasReservationVals = [userId];

  pool.query(checkUserHasReservation, checkUserHasReservationVals)
      .then (response => {
        if (response.rows.length === 0) {
          console.log('No equipment reserved by user with ID: ' + userId);
          return (res.status(200).json('No equipment reservations by userId: ' + userId))
        }

        const result = response.rows[0];
        const equipId = result['equip_id'];

        const getReservedEquipment = 'SELECT * FROM equipment e JOIN equipment_type et ON e.equip_type_id = et.equip_type_id WHERE equip_id = $1';
        const getReservedEquipmentVals = [equipId];
        console.log(equipId);

        pool.query(getReservedEquipment, getReservedEquipmentVals)
          .then (secondResponse => {
            const reservation = response.rows;
            const reservedEquipment = secondResponse.rows;
            res.status(200).json({reservation, reservedEquipment});
          })

        // const reservedEquipment = response.rows;
        // res.status(200).json({reservedEquipment});
      }).catch(e => console.error(e.stack))
});


app.get('/api/getEquipment', async (req, res) => {
  pool.query('SELECT * FROM equipment e JOIN equipment_type et ON e.equip_type_id = et.equip_type_id ORDER BY e.equip_type_id, equip_id ASC;', (err, results) => {
    if (err) {
      res.json('Error encountered!');
      console.log('Error encountered: ' + err); // Returns error to console only for securiy purposes
      return;
    }

    console.log('Successfully loaded equipment...');
    let data = results.rows // Assignsn shorter identifier to results
    res.status(200).json(data)
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


app.put('/api/createReservation/:equipId/:userId', async (req, res) => {
  const equipId = req.params.equipId;
  const userId = req.params.userId;
  let reservationTimer = 20000; // The timer for which reserved equipment lasts

  const checkEquipAvailable = 'SELECT is_available FROM equipment WHERE equip_id = $1'
  const checkEquipAvailableVals = [equipId]

  const checkIfUserHasReservation = 'SELECT * FROM reservation WHERE user_id = $1'
  const checkIfUserHasReservationVals = [userId]

  const reservationQuery = 'INSERT INTO reservation(equip_id, user_id, cat_name, category_desc) VALUES($1, $2, $3, $4)';
  const reservationQueryVals = [equipId, userId, 'Categ name', 'Categ description']; // UPDATE THIS

  const equipmentQuery = 'UPDATE equipment SET is_available = $1 WHERE equip_id = $2';
  const equipmentQueryVals = [false, equipId];   // Passes in the id via the request paramter so it knows which reservation to amend

  pool.query(checkEquipAvailable, checkEquipAvailableVals)
      .then (response => {
        const getAvailableField = response.rows[0];
        const equipmentIsAvailable = getAvailableField["is_available"];

        if (equipmentIsAvailable == false) {
          return (res.status(200).json('This equipment is already reserved!'));
        }

        pool.query(checkIfUserHasReservation, checkIfUserHasReservationVals)
          .then (secondResponse => {
            if (secondResponse.rows.length !== 0) { // Returns > 1 if user already has a reservation, erroring out below
              return (res.status(200).json('Error: You already have a reservation. Only one reservation can exist per user!'));
            }

            pool.query(reservationQuery, reservationQueryVals)
              .then (thirdResponse => {
                pool.query(equipmentQuery, equipmentQueryVals)
                .then (fourthResponse => {
                  console.log('Starting reservation deletion timer for: ' + reservationTimer + 'ms...')
                  setTimeout( () => { // Sets a timer to execute the delete function for a reservation from the db
                    deleteReservationById(equipId); // Runs function to delete reservation and update availability to true once timeout expires
                    console.log('Reservation for equipment with ID: ' + equipId + ', has expired!');
                  }, reservationTimer)
                })

                console.log('Created reservation for equipment ID: ' + equipId)
                res.status(201).json('Successfully created reservation for this equipment!');
              })
        })
        .catch(e => console.error(e.stack))
    });
});

app.delete('/api/deleteReservation/:resId/:userId/:equipId', async (req, res) => { // pass two paramters to the HTTP del request
  const reservationId = req.params.resId;
  const userId = req.params.userId;
  const equipId = req.params.equipId;
  console.log(reservationId);

  const confirmUserIdMatches = 'SELECT user_id FROM reservation WHERE user_id = $1' // Checks the delete request was sent with the correct userId matching the reservationId
  const confirmUserIdMatchesVals = [userId]

  const deleteUsersReservation = 'DELETE FROM reservation WHERE reservation_id = $1 RETURNING *';
  const deleteUsersReservationVals = [reservationId];   // Passes in the id via the request paramter so it knows which reservation to amend

  pool.query(confirmUserIdMatches, confirmUserIdMatchesVals)
      .then (response => {
        if (response.rows.length === 0) { // Handles if result is empty aka reservation doesn't exist / has no data
          return (res.status(403).json('Error: Reservation has already expired!'));
        }

        const getUserField = response.rows[0]; // Grabs the entire response
        const dbReservationsUserId = getUserField["user_id"]; // Grabs the userId from the returned database query

        if (dbReservationsUserId != userId) { // Handles if the provided reservationId and userId don't match the reservation_id and user_id in psql db
          return (res.status(404).json('This equipment is unavailable or is not reserved by you!'));
        }
        deleteReservationById(equipId);
        res.status(200).json('Successfully deleted reservation with ID of: ' + reservationId);
    }).catch(e => console.error(e.stack));
});


app.listen(8080, () => { console.log('Server established on port 8080')})
