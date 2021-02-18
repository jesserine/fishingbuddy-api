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

exports.app = functions.https.onRequest(app)
