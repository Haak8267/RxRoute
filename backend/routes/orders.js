const express = require('express');
const Order = require('../models/Order');
const Medication = require('../models/Medication');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/orders
// @desc    Create a new order
router.post('/', auth, async (req, res) => {
  try {
    const {
      items,
      deliveryAddress,
      paymentMethod = 'Cash on Delivery',
      notes,
      prescriptionUrl
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item'
      });
    }

    // Validate items and calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const medication = await Medication.findById(item.medication);
      if (!medication) {
        return res.status(400).json({
          success: false,
          message: `Medication not found: ${item.medication}`
        });
      }

      if (!medication.inStock) {
        return res.status(400).json({
          success: false,
          message: `${medication.name} is out of stock`
        });
      }

      const itemTotal = medication.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        medication: medication._id,
        quantity: item.quantity,
        price: medication.price,
        dose: medication.dose,
        requiresPrescription: medication.requiresPrescription
      });
    }

    // Calculate delivery fee (simple logic)
    const deliveryFee = subtotal > 100 ? 0 : 10;
    const totalAmount = subtotal + deliveryFee;

    // Set estimated delivery (3-5 days from now)
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + Math.floor(Math.random() * 3) + 3);

    const order = new Order({
      user: req.user._id,
      items: orderItems,
      deliveryAddress,
      paymentMethod,
      subtotal,
      deliveryFee,
      totalAmount,
      estimatedDelivery,
      notes,
      prescriptionUrl,
      statusHistory: [{
        status: 'Pending',
        timestamp: new Date(),
        note: 'Order placed'
      }]
    });

    await order.save();
    await order.populate([
      { path: 'user', select: 'firstName lastName email phone' },
      { path: 'items.medication', select: 'name dose imageUrl' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: {
        order
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating order'
    });
  }
});

// @route   GET /api/orders
// @desc    Get user's orders
router.get('/', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { user: req.user._id };
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('items.medication', 'name dose imageUrl')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching orders'
    });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    })
      .populate('items.medication', 'name dose imageUrl requiresPrescription')
      .populate('user', 'firstName lastName email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: {
        order
      }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching order'
    });
  }
});

// @route   PUT /api/orders/:id/cancel
// @desc    Cancel an order
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const order = await Order.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status !== 'Pending' && order.status !== 'Confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage'
      });
    }

    order.status = 'Cancelled';
    order.statusHistory.push({
      status: 'Cancelled',
      timestamp: new Date(),
      note: 'Order cancelled by user'
    });

    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: {
        order
      }
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error cancelling order'
    });
  }
});

module.exports = router;
