const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
const multer = require("multer");
const jwt = require("jsonwebtoken");
require("dotenv").config(); // Load environment variables

const port = 4000;

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ MongoDB connected");

        // Start server only after DB is connected
        app.listen(port, () => {
            console.log("🚀 Server running on port " + port);
        });
    })
    .catch((err) => {
        console.error("❌ MongoDB connection error:", err);
    });

// Static folder for uploaded images
app.use('/images', express.static(path.join(__dirname, 'upload/images')));

// Multer Storage setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'upload/images'));
    },
    filename: (req, file, cb) => {
        cb(null, `product_${Date.now()}${path.extname(file.originalname)}`);
    },
});

const upload = multer({ storage });

// File Upload Endpoint
app.post("/upload", upload.single('product'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    res.json({
        success: true,
        image_url: `http://localhost:${port}/images/${req.file.filename}`
    });
});

// Test Route
app.get("/", (req, res) => {
    res.send("Express App is Running");
});
