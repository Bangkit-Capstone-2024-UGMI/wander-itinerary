const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const itineraryRouter = require('./routes/itineraryPlan.js');

const app = express();
const port = process.env.PORT || 3000;

const serviceAccount = require('./firebaseConfig.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

app.use(bodyParser.json());
app.use('/api/itineraryPlan', (req, res, next) => {
  req.db = db;
  next();
}, itineraryRouter);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});