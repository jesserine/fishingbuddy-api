const functions = require('firebase-functions')
const admin = require('firebase-admin')
const express = require('express')
const cors = require('cors')
const app = express()
app.use(cors({ origin: true }))

var serviceAccount = require('./permissions.json')
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://fishingbuddy-mobile.firebaseio.com/',
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

// @desc    Fetch all products,
// @route   GET /api/productslist
// sample   https://us-central1-fishingbuddy-web.cloudfunctions.net/app/api/productslist
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

// @desc    Fetch single product.
// @route   GET /api/testlist/:id
// sample   https://us-central1-fishingbuddy-web.cloudfunctions.net/app/api/productslist
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

// @desc    Fetch top 3 recommended fishing gears.
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

// @desc    Fetch all newsfeed posts for social page.
// @route   GET /api/newsfeed
// sample   http://localhost:5001/fishingbuddy-web/us-central1/app/api/newsfeed
// sample   https://us-central1-fishingbuddy-web.cloudfunctions.net/app/api/newsfeed
app.get('/api/newsfeed', async (req, res) => {
  const snapshot = await db.ref('user')
  snapshot.on('value', (snapshot) => {
    const user = snapshot.val()
    const userslist = []
    for (let id in user) {
      const userID = id
      if(user[id].posts!=null){
        const userposts = user[id].posts
        for(let id in userposts){
          userposts[id]['postId'] = id
          userposts[id]['authorId'] = userID
          userslist.push(userposts[id])
        }
      }
    }
    userslist.sort((a,b) => a.datePosted - b.datePosted)

    res.status(200).send(JSON.stringify(userslist))
  })
})

// @desc    Fetch all news for discover page.
// @route   GET /api/news
// sample   GET http://localhost:5001/fishingbuddy-web/us-central1/app/api/news
// sample   https://us-central1-fishingbuddy-web.cloudfunctions.net/app/api/news
app.get('/api/news', async (req, res) => {
  const snapshot = await db.ref('discover/news')
  snapshot.on('value', (snapshot) => {
    const discover = snapshot.val()
    const newslist = []
    for (let id in discover) {
      newslist.push(discover[id])
    }
    console.log(newslist)
    res.status(200).send(JSON.stringify(newslist))
  })
})

// @desc    Fetch all fishes for discover page.
// @route   GET /api/fishlist
//sample    http://localhost:5001/fishingbuddy-web/us-central1/app/api/fishlist
app.get('/api/fishlist', async (req, res) => {
  const snapshot = await db.ref('discover/fishlist')
  snapshot.on('value', (snapshot) => {
    const fish = snapshot.val()
    const fishList = []
    for (let id in fish) {
      fish[id]['fishID'] = id
      fishList.push(fish[id])
    }
    res.status(200).send(JSON.stringify(fishList))
  })
})

// @desc    Fetch single product.
// @route   GET /api/testlist/:id
//sample    http://localhost:5001/fishingbuddy-web/us-central1/app/api/fishlist/-MVCA-81zxk1ntkrcnWw
app.get('/api/fishlist/:id', async (req, res) => {
  const paramId = req.params.id
  const snapshot = await db.ref(`discover/fishlist/${paramId}`)
  snapshot.on('value', (snapshot) => {
    const fish = snapshot.val()
    res.status(200).send(JSON.stringify(fish))
  })
})

// @desc    Fetch all fishes for discover page.
// @route   GET /api/fishingtechniques
//sample    http://localhost:5001/fishingbuddy-web/us-central1/app/api/fishingtechniques
app.get('/api/fishingtechniques', async (req, res) => {
  const snapshot = await db.ref('discover/fishingtechniques')
  snapshot.on('value', (snapshot) => {
    const technique = snapshot.val()
    const techniqueList = []
    for (let id in technique) {
      technique[id]['techniqueID'] = id
      techniqueList.push(technique[id])
    }
    res.status(200).send(JSON.stringify(techniqueList))
  })
})

// @desc    Fetch all fishes for discover page.
// @route   GET /api/fishingtechniques/:id
//sample    http://localhost:5001/fishingbuddy-web/us-central1/app/api/fishingtechniques/-MUU2UPHhWcVTsL60_GZ
app.get('/api/fishingtechniques/:id', async (req, res) => {
  const paramId = req.params.id
  const snapshot = await db.ref(`discover/fishingtechniques/${paramId}`)
  snapshot.on('value', (snapshot) => {
    const technique = snapshot.val()
    res.status(200).send(JSON.stringify(technique))
  })
})

// @desc    Fetch all fishes for discover page.
// @route   GET /api/bfarregulations
//sample    http://localhost:5001/fishingbuddy-web/us-central1/app/api/bfarregulations
app.get('/api/bfarregulations', async (req, res) => {
  const snapshot = await db.ref('discover/fishingregulations/bfarregulations')
  snapshot.on('value', (snapshot) => {
    const regulation = snapshot.val()
    const bfarregulations = []
    for (let id in regulation) {
      regulation[id]['regulationID'] = id
      bfarregulations.push(regulation[id])
    }
    res.status(200).send(JSON.stringify(bfarregulations))
  })
})

// @desc    Fetch all fishes for discover page.
// @route   GET /api/bfarregulations/:id
//sample    http://localhost:5001/fishingbuddy-web/us-central1/app/api/bfarregulations/-MUit6QQKWoidN_14eYl
app.get('/api/bfarregulations/:id', async (req, res) => {
  const paramId = req.params.id
  const snapshot = await db.ref(`discover/fishingregulations/bfarregulations/${paramId}`)
  snapshot.on('value', (snapshot) => {
    const bfarregulation = snapshot.val()
    res.status(200).send(JSON.stringify(bfarregulation))
  })
})

// @desc    Fetch all fishes for discover page.
// @route   GET /api/endangeredspecies
//sample    http://localhost:5001/fishingbuddy-web/us-central1/app/api/bfarregulations
app.get('/api/endangeredspecies', async (req, res) => {
  const snapshot = await db.ref('discover/fishingregulations/endangeredspecies')
  snapshot.on('value', (snapshot) => {
    const regulation = snapshot.val()
    const endangeredSpecies = []
    for (let id in regulation) {
      regulation[id]['regulationID'] = id
      endangeredSpecies.push(regulation[id])
    }
    res.status(200).send(JSON.stringify(endangeredSpecies))
  })
})

// @desc    Fetch all fishes for discover page.
// @route   GET /api/endangeredspecies/:id
//sample    http://localhost:5001/fishingbuddy-web/us-central1/app/api/endangeredspecies/-MUihfZpY5mdcaSvEPL-
app.get('/api/endangeredspecies/:id', async (req, res) => {
  const paramId = req.params.id
  const snapshot = await db.ref(`discover/fishingregulations/endangeredspecies/${paramId}`)
  snapshot.on('value', (snapshot) => {
    const endangeredSpecie = snapshot.val()
    res.status(200).send(JSON.stringify(endangeredSpecie))
  })
})

// @desc    Fetch all fishes for discover page.
// @route   GET /api/endangeredspecies
//sample    http://localhost:5001/fishingbuddy-web/us-central1/app/api/catchsizeregulations
app.get('/api/catchsizeregulations', async (req, res) => {
  const snapshot = await db.ref('discover/fishingregulations/catchsizerules')
  snapshot.on('value', (snapshot) => {
    const regulation = snapshot.val()
    const catchsizerules = []
    for (let id in regulation) {
      regulation[id]['regulationID'] = id
      catchsizerules.push(regulation[id])
    }
    res.status(200).send(JSON.stringify(catchsizerules))
  })
})

// @desc    Fetch all fishes for discover page.
// @route   GET /api/endangeredspecies/:id
//sample    http://localhost:5001/fishingbuddy-web/us-central1/app/api/endangeredspecies/-MUihfZpY5mdcaSvEPL-
app.get('/api/catchsizeregulations/:id', async (req, res) => {
  const paramId = req.params.id
  const snapshot = await db.ref(`discover/fishingregulations/catchsizerules/${paramId}`)
  snapshot.on('value', (snapshot) => {
    const catchsizerule = snapshot.val()
    res.status(200).send(JSON.stringify(catchsizerule))
  })
})

exports.app = functions.https.onRequest(app)
