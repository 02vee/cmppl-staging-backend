const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  vehicleId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  location: {
    lat: { type: Number, required: true },  // Latitude
    lng: { type: Number, required: true },  // Longitude
  },
  locationName: { type: String },  // Added locationName
  deliveryLocation: { type: String },  // Added deliveryLocation
  deliveryLocationName: { type: String },  // Added deliveryLocationName
  tracking: {
    type: Boolean,
    default: true // Indicates if tracking is active
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;