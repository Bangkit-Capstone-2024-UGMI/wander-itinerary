const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const itineraryRouter = require('./routes/itineraryPlan');
const usersRouter = require('./routes/users');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN
}
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
