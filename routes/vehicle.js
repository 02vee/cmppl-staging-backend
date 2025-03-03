const express = require("express");
const router = express.Router();
const Vehicle = require("../models/vehicleModel");
const axios = require('axios');

// Route to update the location of a vehicle
router.post("/update-location", async (req, res) => {
  console.log(`[${new Date().toISOString()}] Received Data:`, req.body);

  const { vehicleId, lat, lng, tracking, locationName, deliveryLocation, deliveryLocationName } = req.body;
  const io = req.app.get("io"); // Get io from app instance

  if (!vehicleId || lat == null || lng == null || tracking == null || !locationName || !deliveryLocation || !deliveryLocationName) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    let vehicle = await Vehicle.findOne({ vehicleId });

    if (!vehicle) {
      vehicle = new Vehicle({ vehicleId, location: { lat, lng }, tracking, locationName, deliveryLocation, deliveryLocationName });
    } else {
      vehicle.location = { lat, lng };
      vehicle.tracking = tracking;
      vehicle.locationName = locationName; // Update location name
      vehicle.deliveryLocation = deliveryLocation; // Update delivery location
      vehicle.deliveryLocationName = deliveryLocationName; // Update delivery location name
    }

    await vehicle.save();

    // Emit location update to WebSocket clients
    io.emit("vehicleLocationUpdate", { vehicleId, lat, lng, locationName, deliveryLocationName, deliveryLocation });
    console.log("Emitting vehicleLocationUpdate event");

    res.status(200).json({ message: "Location updated successfully" });
  } catch (err) {
    console.error("Error updating location:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Route to get the location of a vehicle
router.get("/get-location/:vehicleId", async (req, res) => {
  const { vehicleId } = req.params;

  try {
    const vehicle = await Vehicle.findOne({ vehicleId });

    if (vehicle) {
      res.status(200).json({
        lat: vehicle.location.lat,
        lng: vehicle.location.lng,
        tracking: vehicle.tracking,
        locationName: vehicle.locationName,  // Include locationName in the response
        deliveryLocation: vehicle.deliveryLocation,  // Include deliveryLocation in the response
        deliveryLocationName: vehicle.deliveryLocationName  // Include deliveryLocationName in the response
      });
    } else {
      res.status(404).json({ message: "Vehicle not found" });
    }
  } catch (err) {
    console.error("Error fetching location:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// New route to get all vehicles
router.get("/", async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    res.status(200).json(vehicles);
  } catch (err) {
    console.error("Error fetching vehicles:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// New route to start tracking a vehicle
router.post("/track/:vehicleId", async (req, res) => {
  const { vehicleId } = req.params;
  const io = req.app.get("io");

  try {
    const vehicle = await Vehicle.findOne({ vehicleId });

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found. Please enter a correct number." });
    }

    console.log(`Received Data: { vehicleId: '${vehicleId}' }`);

    // Broadcast the vehicle location update to all connected clients
    io.emit("vehicleLocationUpdate", {
      vehicleId,
      lat: vehicle.location.lat,
      lng: vehicle.location.lng,
      locationName: vehicle.locationName,
      deliveryLocation: vehicle.deliveryLocation,
      deliveryLocationName: vehicle.deliveryLocationName,
      tracking: vehicle.tracking,
    });
    res.json({ message: 'Tracking started', lat: vehicle.location.lat, lng: vehicle.location.lng, locationName: vehicle.locationName, deliveryLocation: vehicle.deliveryLocation, deliveryLocationName: vehicle.deliveryLocationName });
  } catch (err) {
    console.error("Error starting tracking:", err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

// Route to calculate ETA using OSRM
router.get("/calculate-eta", async (req, res) => {
  const { startLat, startLng, endLat, endLng } = req.query;

  try {
    const response = await axios.get(`http://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=false`);
    const duration = response.data.routes[0].duration; // Duration in seconds

    res.status(200).json({ eta: duration / 60 }); // Convert to minutes
  } catch (err) {
    console.error("Error calculating ETA:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Export the routes for use in index.js
module.exports = router;