const mongoose = require('mongoose');

const userMedicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  name: {
    type: String,
    required: [true, 'Medication name is required'],
    trim: true
  },
  dose: {
    type: String,
    required: [true, 'Dose is required']
  },
  frequency: {
    type: String,
    required: [true, 'Frequency is required']
  },
  times: [{
    type: String,
    required: true
  }],
  color: {
    type: String,
    default: '#2A7A4F'
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    default: Date.now
  },
  endDate: Date,
  prescribedBy: String,
  notes: String,
  refillInDays: {
    type: Number,
    default: 30
  },
  lastRefill: Date,
  takenToday: {
    type: Boolean,
    default: false
  },
  adherence: [{
    date: Date,
    taken: Boolean,
    time: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for user medications
userMedicationSchema.index({ user: 1, isActive: 1 });

module.exports = mongoose.model('UserMedication', userMedicationSchema);
