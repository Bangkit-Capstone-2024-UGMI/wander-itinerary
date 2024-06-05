const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
    try {
      const { userId, title, startDate, endDate, city, destinations } = req.body;
      const db = req.db;
  
      if (!userId || !title || !startDate || !endDate || !city || !destinations) {
        console.error('Missing required fields');
        return res.status(400).send('Missing required fields');
      }

      const startDatePlan = new Date(startDate);
      const endDatePlan = new Date(endDate);

      if (startDatePlan >= endDatePlan){
        console.error('Start date must be before end date');
        return res.status(400).send('start date must be before end date');
      }

      const visitTimesSet = new Set(); 

      const formatVisitTime = destinations.map(destination => {
        const visitTime = new Date(destination.visitTime);
        if (visitTime < startDatePlan || visitTime > endDatePlan) {
            console.error('Visit time must be between start and end dates');
            throw new Error('Visit time must be between start and end dates');
          }
    
          if (visitTimesSet.has(visitTime.getTime())) {
            console.error('Visit time overlapped with other destination');
            throw new Error('Visit time overlapped with other destination');
          }
    
          visitTimesSet.add(visitTime.getTime());
    
          return { ...destination, visitTime };
      });
  
      const itineraryPlan = {
        userId,
        title,
        startDate: startDatePlan,
        endDate: endDatePlan,
        city,
        destinations: formatVisitTime
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
      const { userId, title, startDate, endDate, city, destinations } = req.body;
      const db = req.db;
  
      const itineraryPlanRef = db.collection('ItineraryPlans').doc(id);
      const itineraryPlanDoc = await itineraryPlanRef.get();
  
      if (!itineraryPlanDoc.exists) {
        return res.status(404).send('Itinerary not found');
      }

      const currentItinerary = itineraryPlanDoc.data();
      const newStartDate = startDate ? new Date(startDate) : currentItinerary.startDate.toDate();
      const newEndDate = endDate ? new Date(endDate) : currentItinerary.endDate.toDate();

      if (newStartDate >= newEndDate){
        console.error('Start date must be before end date');
        return res.status(400).send('Start date must be before end date');
      }

      const visitTimesSet = new Set();

      const updatedDestinations = (destinations ? destinations : currentItinerary.destinations).map(destination => {
        const visitTime = new Date(destination.visitTime);
        
        if (visitTime < newStartDate || visitTime > newEndDate) {
          console.error('Visit time must be between start and end dates');
          throw new Error('Visit time must be between start and end dates');
        }
  
        if (visitTimesSet.has(visitTime.getTime())) {
          console.error('Visit time overlapped with other destination');
          throw new Error('Visit time overlapped with other destination');
        }
  
        visitTimesSet.add(visitTime.getTime());
  
        return { ...destination, visitTime };
      });

      const updatedItineraryPlan = {
        userId: userId !== undefined ? userId : currentItinerary.userId,
        title: title || currentItinerary.title,
        startDate: newStartDate,
        endDate: newEndDate,
        city: city || currentItinerary.city,
        destinations: updatedDestinations
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
  
      const itineraryPlans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
  
      res.status(200).send({ id: itineraryPlanDoc.id, ...itineraryPlanDoc.data() });
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