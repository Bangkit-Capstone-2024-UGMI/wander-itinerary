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

const authenticateToken = async (req, res, next) => {
  const idToken = req.headers.authorization?.split('Bearer ')[1];
  
  if (!idToken) {
    return res.status(401).send('Unauthorized');
  }
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying ID token:', error);
    res.status(401).send('Unauthorized');
  }
};

app.use('/api/itineraryPlan', authenticateToken, itineraryRouter);
app.use('/api/users', authenticateToken, usersRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
