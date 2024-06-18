const express = require('express');
const router = express.Router();

const formatDate = (timestamp) => {
  const date = new Date(timestamp._seconds * 1000 + timestamp._nanoseconds / 1000000);
  return date.toISOString().split('T')[0];
};

router.post('/', async (req, res) => {
    try {
      const { userId, title, startDate, city, destinations } = req.body;
      const db = req.db;

      if (!userId || !title || !startDate || !city || !destinations) {
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

router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { userId, title, startDate, city, destinations } = req.body;
      const db = req.db;

      const itineraryPlanRef = db.collection('ItineraryPlans').doc(id);
      const itineraryPlanDoc = await itineraryPlanRef.get();

      if (!itineraryPlanDoc.exists) {
        return res.status(404).send('Itinerary not found');
      }

      const currentItinerary = itineraryPlanDoc.data();
      const newStartDate = startDate ? new Date(startDate) : currentItinerary.startDate.toDate();

      const updatedItineraryPlan = {
        userId: userId !== undefined ? userId : currentItinerary.userId,
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

router.get('/', async (req, res) => {
  try {
      const db = req.db;
      const snapshot = await db.collection('ItineraryPlans').get();

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
