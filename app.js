const express = require('express')
const app = express()
const path = require('path')
const dbPath = path.join(__dirname, 'covid19India.db')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
let db = null
app.use(express.json())
const getObject = function (obj) {
  return {
    stateId: obj.state_id,
    stateName: obj.state_name,
    population: obj.population,
  }
}
const initialisedbAndServer = async function () {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, function () {
      console.log('Server is loading')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initialisedbAndServer()

app.get('/states/', async function (request, response) {
  const getStatesQuery = `
    SELECT * 
    FROM 
        state
    `
  const resultStates = await db.all(getStatesQuery)
  response.send(
    resultStates.map(function (each) {
      return {
        stateId: each.state_id,
        stateName: each.state_name,
        population: each.population,
      }
    }),
  )
})

app.get('/states/:stateId/', async function (request, response) {
  const {stateId} = request.params
  const getStateQuery = `
  SELECT * 
  FROM 
    state 
  WHERE 
    state_id=${stateId};
  `
  const resultState = await db.get(getStateQuery)
  response.send(getObject(resultState))
})

app.post('/districts/', async function (request, response) {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const postQuery = `
  INSERT INTO district 
    (district_name,state_id,cases,cured,active,deaths)
  VALUES 
    ('${districtName}',${stateId},${cases},${cured},${active},${deaths});
  `
  await db.run(postQuery)
  response.send('District Added Successfully')
})

app.get('/districts/:districtId/', async function (request, response) {
  const {districtId} = request.params
  const getDistrictQuery = `
  SELECT * 
  FROM 
    district 
  WHERE 
    district_id=${districtId};
  `
  const resultDistrict = await db.all(getDistrictQuery)
  response.send(
    resultDistrict.map(function (each) {
      return {
        districtId: each.district_id,
        districtName: each.district_name,
        stateId: each.state_id,
        cases: each.cases,
        cured: each.cured,
        active: each.active,
        deaths: each.deaths,
      }
    }),
  )
})

app.delete('/districts/:districtId/', async function (request, response) {
  const {districtId} = request.params
  const delQuery = `
  DELETE FROM district 
  WHERE 
    district_id=${districtId};
  `
  await db.run(delQuery)
  response.send('District Removed')
})

app.put('/districts/:districtId/', async function (request, response) {
  const {districtId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const putDistrictQuery = `
  UPDATE district 
  SET district_name='${districtName}',
      state_id=${stateId},
      cases=${cases},
      cured=${cured},
      active=${active},
      deaths=${deaths}
  WHERE 
    district_id=${districtId};

  `
  await db.run(putDistrictQuery)
  response.send('District Details Updated')
})

app.get('/states/:stateId/stats', async function (request, response) {
  const {stateId} = request.params
  const getDistrictCount = `
  SELECT 
    SUM(cases) as totalCases,
    SUM(cured) as totalCured,
    SUM(active) as totalActive,
    SUM(deaths) as totalDeaths
  FROM 
    district
  WHERE 
    state_id=${stateId};
  `
  const res = await db.get(getDistrictCount)
  response.send(res)
})

app.get('/districts/:districtId/details', async function (request, response) {
  const {districtId} = request.params
  const getDistrictDetails = `
  SELECT 
    state.state_name as stateName 
  FROM 
    state INNER JOIN district ON 
      state.state_id=district.state_id 
  WHERE 
    district.district_id=${districtId};
  `
  const dist = await db.get(getDistrictDetails)
  response.send(dist)
})
