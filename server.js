require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/locationtracker';

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// Location Schema
const locationSchema = new mongoose.Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  accuracy: Number,
  userAgent: String,
  ip: String,
  timestamp: { type: Date, default: Date.now }
});

const Location = mongoose.model('Location', locationSchema);

// POST - Save location
app.post('/api/location', async (req, res) => {
  try {
    const { latitude, longitude, accuracy } = req.body;
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'latitude and longitude required' });
    }
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const location = new Location({ latitude, longitude, accuracy, ip, userAgent });
    await location.save();
    console.log(`📍 New location saved: ${latitude}, ${longitude}`);
    res.status(201).json({ message: 'Location saved', data: location });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - Get all locations
app.get('/api/locations', async (req, res) => {
  try {
    const locations = await Location.find().sort({ timestamp: -1 });
    res.json(locations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/ping', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
