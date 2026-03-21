const express = require("express");
const Order = require("../models/Order");
const Medication = require("../models/Medication");
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

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const isValidObjectId =
        item.medication &&
        mongoose.Types.ObjectId.isValid(item.medication) &&
        String(new mongoose.Types.ObjectId(item.medication)) ===
          String(item.medication);

      if (isValidObjectId) {
        // Try to find in DB
        const medication = await Medication.findById(item.medication);
        if (medication) {
          if (!medication.inStock) {
            return res.status(400).json({
              success: false,
              message: `${medication.name} is out of stock`,
            });
          }
          subtotal += medication.price * item.quantity;
          orderItems.push({
            medication: medication._id,
            name: medication.name,
            quantity: item.quantity,
            price: medication.price,
            dose: medication.dose || "",
            requiresPrescription: medication.requiresPrescription || false,
          });
          continue;
        }
      }

      // Fallback: local catalog item — use inline price/name
      if (item.price != null && item.quantity) {
        subtotal += item.price * item.quantity;
        orderItems.push({
          medication: null,
          name: item.name || "Medication",
          quantity: item.quantity,
          price: item.price,
          dose: item.dose || "",
          requiresPrescription: false,
        });
      } else {
        return res.status(400).json({
          success: false,
          message: `Invalid item: ${item.name || "Unknown"} — missing price or quantity`,
        });
      }
    }

    // Normalise delivery address
    let deliveryAddressObj;
    if (typeof deliveryAddress === "string") {
      deliveryAddressObj = {
        street: deliveryAddress,
        city: "Accra",
        region: "Greater Accra",
        country: "Ghana",
      };
    } else {
      deliveryAddressObj = {
        street: deliveryAddress?.street || "Default Street",
        city: deliveryAddress?.city || "Accra",
        region: deliveryAddress?.region || "Greater Accra",
        country: deliveryAddress?.country || "Ghana",
      };
    }

    const deliveryFee = subtotal > 100 ? 0 : 10;
    const totalAmount = subtotal + deliveryFee;

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

    // Populate only non-null medication refs
    try {
      await order.populate([
        { path: "user", select: "firstName lastName email phone" },
        { path: "items.medication", select: "name dose imageUrl" },
      ]);
    } catch (populateErr) {
      console.warn("Populate warning (non-fatal):", populateErr.message);
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
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate("items.medication", "name dose imageUrl")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    const normalisedOrders = orders.map((o) => ({
      _id: o._id,
      orderNumber: o.orderNumber,
      status: mapStatus(o.status),
      items: o.items.map((i) => ({
        name: i.medication?.name || i.name || "Medication",
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

function formatAddress(addr) {
  if (!addr) return "Unknown address";
  if (typeof addr === "string") return addr;
  const parts = [addr.street, addr.city, addr.region, addr.country].filter(
    Boolean,
  );
  return parts.join(", ") || "Unknown address";
}

// @route   DELETE /api/orders/clear
// @desc    Clear all user orders
router.delete("/clear", auth, async (req, res) => {
  try {
    // Delete all orders for the authenticated user
    const result = await Order.deleteMany({
      user: req.user._id,
    });

    res.json({
      success: true,
      message: "Order history cleared successfully",
      data: {
        deletedCount: result.deletedCount || 0,
      },
    });
  } catch (error) {
    console.error("Clear orders error:", error);
    res.status(500).json({
      success: false,
      message: "Server error clearing orders",
    });
  }
});

module.exports = router;
