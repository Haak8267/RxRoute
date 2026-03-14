const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  items: [{
    medication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medication',
      required: false,   // ← was true; local catalog items have no DB ref
      default: null,
    },
    name: {
      type: String,
      default: 'Medication',
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    dose: {
      type: String,
      default: '',
    },
    requiresPrescription: {
      type: Boolean,
      default: false
    }
  }],
  prescriptionUrl: String,
  deliveryAddress: {
    street: {
      type: String,
      default: 'Default Street',   // ← was required; avoid crash on sparse objects
    },
    city: {
      type: String,
      default: 'Accra',
    },
    region: {
      type: String,
      default: 'Greater Accra',
    },
    postalCode: String,
    country: {
      type: String,
      default: 'Ghana'
    }
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
    default: 'Pending'
  },
  paymentMethod: {
    type: String,
    enum: ['Cash on Delivery', 'Mobile Money', 'Card'],
    default: 'Cash on Delivery'
  },
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative']
  },
  deliveryFee: {
    type: Number,
    default: 0,
    min: [0, 'Delivery fee cannot be negative']
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  },
  estimatedDelivery: {
    type: Date,
    default: () => {
      const d = new Date();
      d.setDate(d.getDate() + 4);
      return d;
    },
  },
  actualDelivery: Date,
  trackingNumber: String,
  notes: String,
  statusHistory: [{
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String
  }],
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

// Generate order number before saving
orderSchema.pre('save', function(next) {
  if (this.isNew) {
    this.orderNumber = 'RX-' + Date.now().toString().slice(-6);
  }
  next();
});

// Index for user orders
orderSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);