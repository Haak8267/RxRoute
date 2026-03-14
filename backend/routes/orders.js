const express = require("express");
const Order = require("../models/Order");
const Medication = require('../models/Medication');
const auth = require("../middleware/auth");
const mongoose = require("mongoose");

const router = express.Router();

// @route   POST /api/orders
// @desc    Create a new order
router.post("/", auth, async (req, res) => {
  try {
    const {
      items,
      deliveryAddress,
      paymentMethod = "Cash on Delivery",
      notes,
      prescriptionUrl,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one item",
      });
    }

    // Validate items and calculate totals
    let subtotal = 0;
    const orderItems = [];
    const invalidItems = [];

    for (const item of items) {
      // Try to look up by MongoDB ID first
      const isValidObjectId = item.medication &&
        mongoose.Types.ObjectId.isValid(item.medication);

      if (isValidObjectId) {
        const medication = await Medication.findById(item.medication);
        if (medication) {
          if (!medication.inStock) {
            return res.status(400).json({
              success: false,
              message: `${medication.name} is out of stock`,
            });
          }
          const itemTotal = medication.price * item.quantity;
          subtotal += itemTotal;
          orderItems.push({
            medication: medication._id,
            quantity: item.quantity,
            price: medication.price,
            dose: medication.dose,
            requiresPrescription: medication.requiresPrescription,
          });
          continue;
        }
        // If valid ObjectId but not found, fall through to inline handling
      }

      // Fallback: accept inline item data (local catalog with non-ObjectId IDs)
      if (item.price != null && item.quantity) {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        orderItems.push({
          medication: null, // no DB reference
          quantity: item.quantity,
          price: item.price,
          dose: item.dose || "",
          requiresPrescription: false,
        });
      } else {
        invalidItems.push(item.name || item.medication || "Unknown item");
      }
    }

    if (invalidItems.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid items: ${invalidItems.join(", ")}`,
      });
    }

    // Normalise delivery address
    let deliveryAddressObj = deliveryAddress;
    if (typeof deliveryAddress === "string") {
      deliveryAddressObj = {
        street: deliveryAddress,
        city: "Accra",
        region: "Greater Accra",
        country: "Ghana",
      };
    } else if (deliveryAddress && !deliveryAddress.street) {
      // Handle {country: "Ghana"} or similar sparse objects
      deliveryAddressObj = {
        street: deliveryAddress.street || "Default Street",
        city: deliveryAddress.city || "Accra",
        region: deliveryAddress.region || "Greater Accra",
        country: deliveryAddress.country || "Ghana",
      };
    }

    // Calculate delivery fee (free over GHS 100)
    const deliveryFee = subtotal > 100 ? 0 : 10;
    const totalAmount = subtotal + deliveryFee;

    // Estimated delivery: 3–5 days
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(
      estimatedDelivery.getDate() + Math.floor(Math.random() * 3) + 3,
    );

    const orderNumber = `RX-${Date.now().toString().slice(-6)}`;

    const order = new Order({
      user: req.user._id,
      items: orderItems,
      deliveryAddress: deliveryAddressObj,
      paymentMethod,
      subtotal,
      deliveryFee,
      totalAmount,
      estimatedDelivery,
      notes,
      prescriptionUrl,
      orderNumber,
      statusHistory: [
        {
          status: "Pending",
          timestamp: new Date(),
          note: "Order placed",
        },
      ],
    });

    await order.save();

    // Only populate medication if it exists
    try {
      await order.populate([
        { path: "user", select: "firstName lastName email phone" },
        { path: "items.medication", select: "name dose imageUrl" },
      ]);
    } catch (populateErr) {
      // Non-fatal: some items may have null medication refs
      console.warn("Populate warning:", populateErr.message);
    }

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: {
        order,
        orderNumber: order.orderNumber,
      },
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating order",
      detail: error.message,
    });
  }
});

// @route   GET /api/orders
// @desc    Get user's orders
router.get("/", auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { user: req.user._id };
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate("items.medication", "name dose imageUrl")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    // Normalise each order so the frontend gets a flat, consistent shape
    const normalisedOrders = orders.map((o) => ({
      _id: o._id,
      orderNumber: o.orderNumber,
      status: mapStatus(o.status),
      items: o.items.map((i) => ({
        name: i.medication?.name || "Medication",
        qty: i.quantity,
        price: i.price,
      })),
      createdAt: o.createdAt,
      totalAmount: o.totalAmount,
      deliveryAddress: formatAddress(o.deliveryAddress),
      estimatedDelivery: o.estimatedDelivery
        ? o.estimatedDelivery.toLocaleDateString()
        : undefined,
    }));

    res.json({
      success: true,
      data: normalisedOrders,
    });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching orders",
    });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
      .populate("items.medication", "name dose imageUrl requiresPrescription")
      .populate("user", "firstName lastName email phone");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      data: { order },
    });
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching order",
    });
  }
});

// @route   PUT /api/orders/:id/cancel
// @desc    Cancel an order
router.put("/:id/cancel", auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.status !== "Pending" && order.status !== "Confirmed") {
      return res.status(400).json({
        success: false,
        message: "Order cannot be cancelled at this stage",
      });
    }

    order.status = "Cancelled";
    order.statusHistory.push({
      status: "Cancelled",
      timestamp: new Date(),
      note: "Order cancelled by user",
    });

    await order.save();

    res.json({
      success: true,
      message: "Order cancelled successfully",
      data: { order },
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({
      success: false,
      message: "Server error cancelling order",
    });
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Map DB status values to the frontend's expected set */
function mapStatus(status) {
  const map = {
    Pending: "Pending",
    Confirmed: "In Progress",
    Preparing: "In Progress",
    "Out for Delivery": "In Progress",
    Delivered: "Delivered",
    Cancelled: "Cancelled",
  };
  return map[status] || "In Progress";
}

/** Format a deliveryAddress object as a plain string for the frontend */
function formatAddress(addr) {
  if (!addr) return "Unknown address";
  if (typeof addr === "string") return addr;
  const parts = [addr.street, addr.city, addr.region, addr.country].filter(
    Boolean,
  );
  return parts.join(", ") || "Unknown address";
}

module.exports = router;