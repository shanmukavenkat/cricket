const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'cricketTeam.db')

let db = null

// Helper function to convert snake_case to camelCase
const toCamelCase = snakeCaseObj => {
  const camelCaseObj = {}
  for (const key in snakeCaseObj) {
    if (Object.hasOwnProperty.call(snakeCaseObj, key)) {
      const camelCaseKey = key.replace(/_([a-z])/g, g => g[1].toUpperCase())
      camelCaseObj[camelCaseKey] = snakeCaseObj[key]
    }
  }
  return camelCaseObj
}

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('The server is running on http://localhost:3000')
    })
  } catch (e) {
    console.log(`DB error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

// GET PLAYERS API
app.get('/players/', async (request, response) => {
  const getPlayersQuery = `
    SELECT
      * 
    FROM 
      cricket_team;
  `
  const playersArray = await db.all(getPlayersQuery)
  const camelCasedPlayersArray = playersArray.map(toCamelCase)
  response.send(camelCasedPlayersArray)
})

// POST means CREATE a DATABASE entry
app.post('/players/', async (request, response) => {
  const playerDetails = request.body
  const {playerName, jerseyNumber, role} = playerDetails

  const addPlayerQuery = `
    INSERT INTO
      cricket_team (player_name, jersey_number, role)
    VALUES (
      '${playerName}',
      ${jerseyNumber},
      '${role}'
    );
  `
  const dbResponse = await db.run(addPlayerQuery)
  response.send('Player Added to Team')
})

// GET THE SELECTED PLAYER
app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerQuery = `
    SELECT 
      * 
    FROM 
      cricket_team
    WHERE
      player_id = ${playerId};
  `
  const player = await db.get(getPlayerQuery)
  const camelCasedPlayer = toCamelCase(player)
  response.send(camelCasedPlayer)
})

// UPDATE PLAYER DATA
app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const playerDetails = request.body
  const {playerName, jerseyNumber, role} = playerDetails

  const updatePlayerQuery = `
    UPDATE 
      cricket_team
    SET 
      player_name = '${playerName}',
      jersey_number = ${jerseyNumber},
      role = '${role}'
    WHERE 
      player_id = ${playerId};
  `
  await db.run(updatePlayerQuery)
  response.send('Player Details Updated')
})

// DELETE PLAYER
app.delete('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const deletePlayerQuery = `
    DELETE FROM 
      cricket_team
    WHERE 
      player_id = ${playerId};
  `
  await db.run(deletePlayerQuery)
  response.send('Player Removed')
})

module.exports = app
