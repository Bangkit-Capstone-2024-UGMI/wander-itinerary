const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

const formatDate = (timestamp) => {
  const date = new Date(timestamp._seconds * 1000 + timestamp._nanoseconds / 1000000);
  return date.toISOString().split('T')[0];
};

/**
 * @swagger
 * tags:
 *   name: ItineraryPlans
 *   description: Operations related to itinerary plans
*/

/**
 * @swagger
 * components:
 *   schemas:
 *     ItineraryPlan:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The itinerary plan ID
 *         userId:
 *           type: string
 *           description: The user ID
 *         title:
 *           type: string
 *           description: The title of the itinerary plan
 *         startDate:
 *           type: string
 *           format: date
 *           description: The start date of the itinerary plan
 *         city:
 *           type: string
 *           description: The city of the itinerary plan
 *         destinations:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Destination'
 *           description: The list of destinations in the itinerary plan
 *     Destination:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the destination
 *         location:
 *           type: object
 *           properties:
 *             latitude:
 *               type: number
 *               format: float
 *               description: The latitude of the destination
 *             longitude:
 *               type: number
 *               format: float
 *               description: The longitude of the destination
*/

/**
 * @swagger
 * /api/itineraryPlan:
 *   post:
 *     summary: Create a new itinerary plan
 *     tags: [ItineraryPlans]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               city:
 *                 type: string
 *               destinations:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Destination'
 *             example:
 *               title: Yogyakarta New Trip 2
 *               startDate: 2024-08-01
 *               city: Sleman
 *               destinations:
 *                 - name: FMIPA UGM
 *                   location: { latitude: -7.637478622592584, longitude: 110.60331078543685 }
 *                 - name: Obie Cafe & Space
 *                   location: { latitude: -7.75637133211122, longitude: 110.37487495154251 }
 *     responses:
 *       201:
 *         description: Itinerary plan created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: The ID of the created itinerary plan
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal Server Error
*/

router.post('/', async (req, res) => {
    try {
      const { title, startDate, city, destinations } = req.body;
      const userId = req.user.uid; 
      const db = req.db;

      if (!title || !startDate || !city || !destinations) {
        console.error('Missing required fields');
        return res.status(400).send('Missing required fields');
      }

      const startDatePlan = new Date(startDate);

      const itineraryPlan = {
        userId,
        title,
        startDate: startDatePlan,
        city,
        destinations
      };

      const docRef = await db.collection('ItineraryPlans').add(itineraryPlan);
      res.status(201).send({ id: docRef.id });
    } catch (error) {
      console.error('Error creating itinerary:', error.message);
      res.status(500).send('Internal Server Error');
    }
});

/**
 * @swagger
 * /api/itineraryPlan/{id}:
 *   put:
 *     summary: Update an existing itinerary plan by ID
 *     tags: [ItineraryPlans]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The itinerary plan ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               city:
 *                 type: string
 *               destinations:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Destination'
 *             example:
 *               title: Yogyakarta New Trip
 *               startDate: 2024-08-01
 *               city: Sleman
 *               destinations:
 *                 - name: FMIPA UGM
 *                   location: { latitude: -7.637478622592584, longitude: 110.60331078543685 }
 *                 - name: Obie Cafe & Space
 *                   location: { latitude: -7.75637133211122, longitude: 110.37487495154251 }
 *     responses:
 *       200:
 *         description: Itinerary updated successfully
 *       400:
 *         description: Invalid request or missing fields
 *       404:
 *         description: Itinerary not found
 *       500:
 *         description: Internal Server Error
*/

router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { title, startDate, city, destinations } = req.body;
      const db = req.db;

      const itineraryPlanRef = db.collection('ItineraryPlans').doc(id);
      const itineraryPlanDoc = await itineraryPlanRef.get();

      if (!itineraryPlanDoc.exists) {
        return res.status(404).send('Itinerary not found');
      }

      const currentItinerary = itineraryPlanDoc.data();
      const newStartDate = startDate ? new Date(startDate) : currentItinerary.startDate.toDate();

      const updatedItineraryPlan = {
        userId: req.user.uid,
        title: title || currentItinerary.title,
        startDate: newStartDate,
        city: city || currentItinerary.city,
        destinations: destinations !== undefined ? destinations : currentItinerary.destinations
      };

      await itineraryPlanRef.update(updatedItineraryPlan);
      res.status(200).send('Itinerary updated successfully');
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
});

/**
 * @swagger
 * /api/itineraryPlan:
 *   get:
 *     summary: Retrieve all itinerary plans for the authenticated user
 *     tags: [ItineraryPlans]
 *     responses:
 *       200:
 *         description: List of itinerary plans retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ItineraryPlan'
 *       404:
 *         description: No itinerary found
 *       500:
 *         description: Internal Server Error
*/

router.get('/', async (req, res) => {
  try {
      const db = req.db;
      const snapshot = await db.collection('ItineraryPlans').where('userId', '==', req.user.uid).get();

      if (snapshot.empty) {
          return res.status(404).send('No itinerary found');
      }

      const itineraryPlans = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
              id: doc.id,
              userId: data.userId,
              title: data.title,
              startDate: formatDate(data.startDate),
              city: data.city,
              destinations: data.destinations
          };
      });
      res.status(200).send(itineraryPlans);
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});

/**
 * @swagger
 * /api/itineraryPlan/{id}:
 *   get:
 *     summary: Retrieve a specific itinerary plan by ID
 *     tags: [ItineraryPlans]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The itinerary plan ID
 *     responses:
 *       200:
 *         description: Itinerary plan retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ItineraryPlan'
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Itinerary not found
 *       500:
 *         description: Internal Server Error
*/

router.get('/:id', async (req, res) => {
  try {
      const { id } = req.params;
      const db = req.db;
      const itineraryPlanRef = db.collection('ItineraryPlans').doc(id);
      const itineraryPlanDoc = await itineraryPlanRef.get();

      if (!itineraryPlanDoc.exists) {
          return res.status(404).send('Itinerary not found');
      }

      const data = itineraryPlanDoc.data();
      if (data.userId !== req.user.uid) {
        return res.status(403).send('Forbidden');
      }
      const formattedData = {
          id: itineraryPlanDoc.id,
          userId: data.userId,
          title: data.title,
          startDate: formatDate(data.startDate),
          city: data.city,
          destinations: data.destinations
      };
      res.status(200).send(formattedData);
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});

/**
 * @swagger
 * /api/itineraryPlan/{id}:
 *   delete:
 *     summary: Delete an itinerary plan by ID
 *     tags: [ItineraryPlans]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The itinerary plan ID
 *     responses:
 *       200:
 *         description: Itinerary deleted successfully
 *       404:
 *         description: Itinerary not found
 *       500:
 *         description: Internal Server Error
*/

router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const db = req.db;
      const itineraryPlanRef = db.collection('ItineraryPlans').doc(id);

      const itineraryPlanDoc = await itineraryPlanRef.get();
      if (!itineraryPlanDoc.exists) {
        return res.status(404).send('Itinerary not found');
      }

      await itineraryPlanRef.delete();
      res.status(200).send('Itinerary deleted successfully');
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
