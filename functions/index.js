const functions = require('firebase-functions')
const admin = require('firebase-admin')
const express = require('express')
const cors = require('cors')
const app = express()
app.use(cors({ origin: true }))

var serviceAccount = require('./permissions.json')
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://fishingbuddy-web-default-rtdb.firebaseio.com/',
})
const db = admin.database()

// @desc    Create new test
// @route   POST /api/createlist
app.post('/api/createlist', async (req, res) => {
  const test = req.body
  await db.ref('test').push(test)
  res.status(201).send(JSON.stringify(test))
})

// @desc    Fetch all test
// @route   GET /api/testlist
app.get('/api/testlist', async (req, res) => {
  console.log(paramType)

  const snapshot = await db.ref('test')
  snapshot.on('value', (snapshot) => {
    const test = snapshot.val()
    const testList = []
    for (let id in test) {
      testList.push(test[id])
    }
    res.status(200).send(JSON.stringify(testList))
  })
})

// @desc    Fetch single test
// @route   GET /api/testlist/:id
app.get('/api/testlist/:id', async (req, res) => {
  const paramId = req.params.id
  const snapshot = await db.ref(`test/${paramId}`)
  snapshot.on('value', (snapshot) => {
    const test = snapshot.val()
    const testList = []
    for (let id in test) {
      testList.push(test[id])
    }
    res.status(200).send(JSON.stringify(testList))
  })
})

// @desc    Update a test
// @route   PUT /api/updatelist/:id
app.put('/api/updatelist/:id', async (req, res) => {
  const body = req.body
  const paramId = req.params.id
  await db.ref(`test/${paramId}`).update(body)
  res.status(200).send(JSON.stringify(body))
})

// @desc    Delete a test
// @route   DELETE /api/deletelist/:id
app.delete('/api/deletelist/:id', async (req, res) => {
  const paramId = req.params.id
  await db.ref(`test/${paramId}`).remove()

  res.status(200).send(JSON.stringify('removed'))
})

// @desc    Fetch all test
// @route   GET /api/productslist
app.get('/api/productslist', async (req, res) => {
  const snapshot = await db.ref('products')
  snapshot.on('value', (snapshot) => {
    const product = snapshot.val()
    const productslist = []
    for (let id in product) {
      productslist.push(product[id])
    }
    res.status(200).send(JSON.stringify(productslist))
  })
})

// @desc    Fetch single test
// @route   GET /api/testlist/:id
app.get('/api/productslist/:id', async (req, res) => {
  const paramId = req.params.id
  const snapshot = await db.ref(`products/${paramId}`)
  snapshot.on('value', (snapshot) => {
    const product = snapshot.val()
    const productslist = []
    for (let id in product) {
      productslist.push(product[id])
    }
    res.status(200).send(JSON.stringify(product))
  })
})


// @desc    Fetch all test
// @route   GET /api/recommendgear
// sample   http://localhost:5001/fishingbuddy-web/us-central1/app/api/recommendgear/spinning/spinning/multicolor/monofilament/minnow/shorecasting/small/amateur/5000
// sample   http://localhost:5001/fishingbuddy-web/us-central1/app/api/recommendgear/1/1/2/3/1/1/1/1/5000
// sample   https://us-central1-fishingbuddy-web.cloudfunctions.net/app/api/recommendgear/1/1/2/3/1/1/1/1/5000
app.get('/api/recommendgear/:reelType/:rodType/:braidlineType/:llineType/:lureType/:enviType/:catchType/:hobbyistType/:budget', async (req, res) => {
  const snapshot = await db.ref('gearsetup')
  snapshot.on('value', (snapshot) => {
    const gearsetup = snapshot.val()
    const gearsetuplist = []
    var discretizedPreferredSetup = [req.params.reelType, req.params.rodType, req.params.braidlineType, req.params.llineType, req.params.lureType, req.params.enviType, req.params.catchType, req.params.hobbyistType, (req.params.budget/1000).toFixed(2)]
    
    var discretizedGearSetupList = []
    var gearRecommendationResult = []
    for (let id in gearsetup) {
       gearsetuplist.push(gearsetup[id])
       var discretizedGearSetup = {rodScore: gearsetup[id].rodTypeIndex,reelScore: gearsetup[id].reelTypeIndex,braidlineScore: gearsetup[id].braidlineIndex,leaderlineScore: gearsetup[id].leaderlineIndex,lureScore: gearsetup[id].lureIndex,environmentScore: gearsetup[id].environmentTypeIndex,catchScore: gearsetup[id].catchTypeIndex,hobbyistScore: gearsetup[id].hobbyistTypeIndex,priceScore: (gearsetup[id].totalPrice/1000).toFixed(2),setupId: id, distanceScore: ''}
       var distanceScore = calculateKNN( discretizedPreferredSetup,discretizedGearSetup)
       discretizedGearSetup.distanceScore = distanceScore
       discretizedGearSetupList.push(discretizedGearSetup)
    }
    
    discretizedGearSetupList.sort((a,b) => a.distanceScore - b.distanceScore);
    var count = 0;
    while(count < 3){
    db.ref(`gearsetup/${discretizedGearSetupList[count].setupId}`).on('value',function(snapshot) {
      gearRecommendationResult.push(snapshot.val()) 
       })
       count+=1
      }
    res.status(200).send(JSON.stringify(gearRecommendationResult))
  })
})

function calculateKNN(userPreference, gearSetups){
  var distance = (Math.pow(userPreference[0]-gearSetups.rodScore,2)+Math.pow(userPreference[1]-gearSetups.reelScore,2)+Math.pow(userPreference[2]-gearSetups.braidlineScore,2)+Math.pow(userPreference[3]-gearSetups.leaderlineScore,2)+Math.pow(userPreference[4]-gearSetups.lureScore,2)+Math.pow(userPreference[5]-gearSetups.environmentScore,2)+Math.pow(userPreference[6]-gearSetups.catchScore,2)+Math.pow(userPreference[7]-gearSetups.hobbyistScore,2)+Math.pow(userPreference[8]-gearSetups.priceScore,2)).toFixed(2)
  
  return distance
}

exports.app = functions.https.onRequest(app)
