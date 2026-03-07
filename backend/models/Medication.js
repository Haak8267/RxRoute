const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Medication name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Pain Relief', 'Antibiotics', 'Vitamins', 'Chronic', 'Cold & Flu', 'Allergy', 'Digestive', 'Other']
  },
  dose: {
    type: String,
    required: [true, 'Dose is required']
  },
  quantity: {
    type: String,
    required: [true, 'Quantity is required']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative']
  },
  rating: {
    type: Number,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot be more than 5'],
    default: 0
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  imageUrl: String,
  inStock: {
    type: Boolean,
    default: true
  },
  requiresPrescription: {
    type: Boolean,
    default: false
  },
  tags: [String],
  activeIngredients: [String],
  sideEffects: [String],
  manufacturer: String,
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

// Index for search functionality
medicationSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Medication', medicationSchema);
