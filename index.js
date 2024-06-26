const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const swaggerUI = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");
const itineraryRouter = require('./routes/itineraryPlan');
const usersRouter = require('./routes/users');
const cors = require('cors');
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

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Wander API",
      version: "1.0.0",
      description: "API to handle the backend of itinerary plan feature of the Wander App"
    },
    servers: [
      {
        url: "http://localhost:3000"
      },
      {
        url: "https://wander-itinerary-vjn7sf67na-et.a.run.app/"
      }
    ]
  },
  apis: ["./routes/*.js"]
}

const specs = swaggerJsDoc(options);

app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));

app.use(
  cors({
    origin: "*",
  })
);

app.use(bodyParser.json());

app.use((req, res, next) => {
  req.db = db;
  next();
});

const skipAuth = true;

const authenticateToken = async (req, res, next) => {
  if (skipAuth) {
    req.user = { uid: 'test-user-id' };
    return next();
  }

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
