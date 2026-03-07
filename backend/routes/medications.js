const express = require('express');
const Medication = require('../models/Medication');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/medications
// @desc    Get all medications with optional filtering
router.get('/', async (req, res) => {
  try {
    const {
      category,
      search,
      minPrice,
      maxPrice,
      requiresPrescription,
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query = {};
    
    if (category) {
      query.category = category;
    }
    
    if (requiresPrescription !== undefined) {
      query.requiresPrescription = requiresPrescription === 'true';
    }
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    
    if (search) {
      query.$text = { $search: search };
    }

    const medications = await Medication.find(query)
      .populate('reviews.user', 'firstName lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Medication.countDocuments(query);

    res.json({
      success: true,
      data: {
        medications,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      }
    });
  } catch (error) {
    console.error('Get medications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching medications'
    });
  }
});

// @route   GET /api/medications/:id
// @desc    Get single medication by ID
router.get('/:id', async (req, res) => {
  try {
    const medication = await Medication.findById(req.params.id)
      .populate('reviews.user', 'firstName lastName');

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    res.json({
      success: true,
      data: {
        medication
      }
    });
  } catch (error) {
    console.error('Get medication error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching medication'
    });
  }
});

// @route   GET /api/medications/categories
// @desc    Get all medication categories
router.get('/categories/all', async (req, res) => {
  try {
    const categories = await Medication.distinct('category');
    
    res.json({
      success: true,
      data: {
        categories
      }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching categories'
    });
  }
});

// @route   POST /api/medications/:id/reviews
// @desc    Add review to medication
router.post('/:id/reviews', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const medication = await Medication.findById(req.params.id);
    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    // Check if user already reviewed
    const existingReview = medication.reviews.find(
      review => review.user.toString() === req.user._id.toString()
    );

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this medication'
      });
    }

    // Add review
    medication.reviews.push({
      user: req.user._id,
      rating,
      comment
    });

    // Calculate new average rating
    const totalRating = medication.reviews.reduce((sum, review) => sum + review.rating, 0);
    medication.rating = totalRating / medication.reviews.length;

    await medication.save();

    await medication.populate('reviews.user', 'firstName lastName');

    res.json({
      success: true,
      message: 'Review added successfully',
      data: {
        medication
      }
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding review'
    });
  }
});

module.exports = router;
