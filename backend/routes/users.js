const express = require('express');
const UserMedication = require('../models/UserMedication');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/medications
// @desc    Get user's medications
router.get('/medications', auth, async (req, res) => {
  try {
    const { isActive = true } = req.query;

    const medications = await UserMedication.find({ 
      user: req.user._id,
      isActive: isActive === 'true'
    })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        medications
      }
    });
  } catch (error) {
    console.error('Get user medications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching medications'
    });
  }
});

// @route   POST /api/users/medications
// @desc    Add a new medication for user
router.post('/medications', auth, async (req, res) => {
  try {
    const {
      name,
      dose,
      frequency,
      times,
      color = '#2A7A4F',
      startDate,
      endDate,
      prescribedBy,
      notes,
      refillInDays = 30
    } = req.body;

    if (!name || !dose || !frequency || !times || !times.length) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required medication details'
      });
    }

    const medication = new UserMedication({
      user: req.user._id,
      name,
      dose,
      frequency,
      times,
      color,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      prescribedBy,
      notes,
      refillInDays
    });

    await medication.save();

    res.status(201).json({
      success: true,
      message: 'Medication added successfully',
      data: {
        medication
      }
    });
  } catch (error) {
    console.error('Add medication error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding medication'
    });
  }
});

// @route   PUT /api/users/medications/:id
// @desc    Update user medication
router.put('/medications/:id', auth, async (req, res) => {
  try {
    const medication = await UserMedication.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    const allowedUpdates = [
      'name', 'dose', 'frequency', 'times', 'color', 
      'endDate', 'prescribedBy', 'notes', 'refillInDays'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    if (updates.endDate) {
      updates.endDate = new Date(updates.endDate);
    }

    const updatedMedication = await UserMedication.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Medication updated successfully',
      data: {
        medication: updatedMedication
      }
    });
  } catch (error) {
    console.error('Update medication error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating medication'
    });
  }
});

// @route   DELETE /api/users/medications/:id
// @desc    Delete user medication (soft delete)
router.delete('/medications/:id', auth, async (req, res) => {
  try {
    const medication = await UserMedication.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    medication.isActive = false;
    await medication.save();

    res.json({
      success: true,
      message: 'Medication removed successfully'
    });
  } catch (error) {
    console.error('Delete medication error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error removing medication'
    });
  }
});

// @route   PUT /api/users/medications/:id/taken
// @desc    Mark medication as taken for today
router.put('/medications/:id/taken', auth, async (req, res) => {
  try {
    const { taken, time } = req.body;

    const medication = await UserMedication.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    medication.takenToday = taken;
    
    // Add to adherence history
    medication.adherence.push({
      date: new Date(),
      taken,
      time: time || new Date().toLocaleTimeString()
    });

    await medication.save();

    res.json({
      success: true,
      message: `Medication marked as ${taken ? 'taken' : 'not taken'}`,
      data: {
        medication
      }
    });
  } catch (error) {
    console.error('Mark medication taken error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating medication status'
    });
  }
});

// @route   GET /api/users/dashboard
// @desc    Get user dashboard data
router.get('/dashboard', auth, async (req, res) => {
  try {
    const medications = await UserMedication.find({ 
      user: req.user._id,
      isActive: true 
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const takenToday = medications.filter(med => med.takenToday).length;
    const urgent = medications.filter(med => med.refillInDays <= 5).length;

    res.json({
      success: true,
      data: {
        totalMedications: medications.length,
        takenToday,
        urgent,
        medications
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard data'
    });
  }
});

module.exports = router;
