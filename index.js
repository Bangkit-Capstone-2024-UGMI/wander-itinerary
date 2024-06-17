const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const itineraryRouter = require('./routes/itineraryPlan');
const usersRouter = require('./routes/users'); 

const app = express();
const port = process.env.PORT || 3000;

const serviceAccount = require('./firebaseConfig.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

app.use(bodyParser.json());

app.use((req, res, next) => {
  req.db = db;
  next();
});

app.use('/api/itineraryPlan', itineraryRouter);
app.use('/api/users', usersRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
