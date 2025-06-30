const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config(); // .env config

const app = express();
app.use(express.json());
app.use(cors());

const port = process.env.PORT || 5000;

// ✅ Use MongoDB URI from .env
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ MongoDB connected");
        app.listen(port, () => {
            console.log(`🚀 Server running on port ${port}`);
        });
    })
    .catch((err) => {
        console.error("❌ MongoDB connection error:", err);
    });

// Sample route
app.get("/", (req, res) => {
    res.send("App is working!");
});
