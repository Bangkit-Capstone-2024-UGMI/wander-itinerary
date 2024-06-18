const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

const destinationCategories = [
    "accounting",
    "airport",
    "amusement_park",
    "aquarium",
    "art_gallery",
    "atm",
    "bakery",
    "bank",
    "bar",
    "beauty_salon",
    "bicycle_store",
    "book_store",
    "bowling_alley",
    "bus_station",
    "cafe",
    "campground",
    "car_dealer",
    "car_rental",
    "car_repair",
    "car_wash",
    "casino",
    "cemetery",
    "church",
    "city_hall",
    "clothing_store",
    "convenience_store",
    "courthouse",
    "dentist",
    "department_store",
    "doctor",
    "drugstore",
    "electrician",
    "electronics_store",
    "embassy",
    "fire_station",
    "florist",
    "funeral_home",
    "furniture_store",
    "gas_station",
    "gym",
    "hair_care",
    "hardware_store",
    "hindu_temple",
    "home_goods_store",
    "hospital",
    "insurance_agency",
    "jewelry_store",
    "laundry",
    "lawyer",
    "library",
    "light_rail_station",
    "liquor_store",
    "local_government_office",
    "locksmith",
    "lodging",
    "meal_delivery",
    "meal_takeaway",
    "mosque",
    "movie_rental",
    "movie_theater",
    "moving_company",
    "museum",
    "night_club",
    "painter",
    "park",
    "parking",
    "pet_store",
    "pharmacy",
    "physiotherapist",
    "plumber",
    "police",
    "post_office",
    "primary_school",
    "real_estate_agency",
    "restaurant",
    "roofing_contractor",
    "rv_park",
    "school",
    "secondary_school",
    "shoe_store",
    "shopping_mall",
    "spa",
    "stadium",
    "storage",
    "store",
    "subway_station",
    "supermarket",
    "synagogue",
    "taxi_stand",
    "tourist_attraction",
    "train_station",
    "transit_station",
    "travel_agency",
    "university",
    "veterinary_care",
    "zoo"
];

const validateUserData = (req, res, next) => {
    const { name, gender, birthDate, destinationPreferences } = req.body;
  
    if (name && !/^[A-Za-z\s]+$/.test(name)) {
      return res.status(400).send('Name can not contain numbers or symbols');
    }
  
    if (gender && !['Male', 'Female', 'Other'].includes(gender)) {
      return res.status(400).send('Invalid input! Please choose Male, Female, or Other');
    }
  
    if (birthDate) {
      const birthDateObj = new Date(birthDate);
      const currentDate = new Date();
      if (isNaN(birthDateObj.getTime()) || birthDateObj > currentDate) {
        return res.status(400).send('Birth date must be a valid date and cannot be in the future');
      }
    }
  
    if (destinationPreferences) {
      if (!Array.isArray(destinationPreferences)) {
          return res.status(400).send('Invalid destination preferences format');
      }
  
      const validPreferences = destinationPreferences.every(pref => destinationCategories.includes(pref));
  
      if (!validPreferences) {
        return res.status(400).send('Invalid destination preferences categories');
      }
    }
  
    next();
};
  
router.post('/', validateUserData, async (req, res) => {
    try {
      const { name, gender, birthDate, destinationPreferences } = req.body;
      const userId = req.user.uid;
      const db = req.db;
      
      const userRef = db.collection('users').doc(userId);
      await userRef.set({
        name,
        gender,
        birthDate,
        destinationPreferences: destinationPreferences || [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
  
      res.status(200).send('User profile created successfully');
    } catch (error) {
      console.error('Error creating user profile:', error);
      res.status(500).send('Internal Server Error');
    }
});
  
router.get('/:id', async (req, res) => {
      try {
          const { id } = req.params;
          const db = req.db;
      
          const userRef = db.collection('users').doc(id);
          const userDoc = await userRef.get();
      
          if (!userDoc.exists) {
            return res.status(404).send('User not found');
          }
      
          res.status(200).send({ id: userDoc.id, ...userDoc.data() });
        } catch (error) {
          console.error('Error fetching user profile:', error);
          res.status(500).send('Internal Server Error');
        }
});
  
router.put('/:id', validateUserData, async (req, res) => {
      try {
        const { id } = req.params;
        const { name, gender, birthDate, destinationPreferences } = req.body;
        const db = req.db;
    
        const userRef = db.collection('users').doc(id);
        const userDoc = await userRef.get();
    
        if (!userDoc.exists) {
          return res.status(404).send('User not found');
        }
    
        const updatedUser = {
          name,
          gender,
          birthDate: new Date(birthDate),
          destinationPreferences: destinationPreferences !== undefined ? destinationPreferences : userDoc.data().destinationPreferences,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
    
        await userRef.update(updatedUser);
        res.status(200).send('User profile updated successfully');
      } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).send('Internal Server Error');
      }
});
  
router.delete('/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const db = req.db;
    
        const userRef = db.collection('users').doc(id);
        const userDoc = await userRef.get();
    
        if (!userDoc.exists) {
          return res.status(404).send('User not found');
        }
    
        await userRef.delete();
        res.status(200).send('User profile deleted successfully');
      } catch (error) {
        console.error('Error deleting user profile:', error);
        res.status(500).send('Internal Server Error');
      }
});
  
module.exports = router;