const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();
const { cloudinary, storage } = require("./config/cloudinary");
const multer = require("multer");

const authRoutes = require("./routes/auth");
const medRoutes = require("./routes/medications");
const orderRoutes = require("./routes/orders");
const userRoutes = require("./routes/users");

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:19006",
      "exp://172.22.191.240:8081",
      "exp://172.22.191.240:8081",
      "http://localhost:8081",
      "http://127.0.0.1:8081",
      "http://localhost:*",
      "http://127.0.0.1:*",
    ], // Expo development URLs and localhost
    credentials: true,
  }),
);

// Body parser middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Multer configuration for file uploads
const upload = multer({ storage });

// Connect to MongoDB with graceful handling
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅MongoDB connected successfully");
  } catch (err) {
    console.error("❌MongoDB connection error:", err);
    console.log("⚠️  Continuing without database - some features may not work");
  }
};

connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/medications", medRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);

// File upload route
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    res.json({
      success: true,
      data: {
        url: req.file.path,
        publicId: req.file.filename,
        originalName: req.file.originalname,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      message: "Upload failed",
    });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
