const port = 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const { error } = require("console");



app.use(express.json());
app.use(cors());

// Step 1: Connect to MongoDB FIRST, then start server
mongoose.connect("mongodb+srv://nikitakpawar2:030903090309@cluster1.ndtivct.mongodb.net/e-commerce")
    .then(() => {
        console.log("✅ MongoDB connected");

        // Step 2: Start server only after DB connected
        app.listen(port, () => {
            console.log("🚀 Server running on port " + port);
        });
    })
    .catch(err => {
        console.error("❌ MongoDB connection error:", err);
    });

// Static folder for uploaded images
app.use('/images', express.static('upload/images'));

// Multer Storage
const storage = multer.diskStorage({
    destination: './upload/images',
    filename: (req, file, cb) => {
        cb(null, `product_${Date.now()}${path.extname(file.originalname)}`);
    },
});


const upload = multer({ storage: storage });

// File Upload Endpoint
app.post("/upload", upload.single('product'), (req, res) => {
    res.json({
        success: 1,
        image_url: `http://localhost:${port}/images/${req.file.filename}`
    });
});

// Home route
app.get("/", (req, res) => {
    res.send("Express App is Running");
});

// Schema
const Product = mongoose.model("product", {
    id: { type: Number, required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    category: { type: String, required: true },
    new_price: { type: Number, required: true },
    old_price: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    available: { type: Boolean, default: true },
});

// Add product route
app.post('/addproduct', async (req, res) => {
    let products = await Product.find({});
    let id;
    if (products.length > 0) {
        let last_product_array = products.slice(-1);
        let last_product = last_product_array[0];
        id = last_product.id + 1;
    }
    else {
        id = 1;
    }
    try {
        const newProduct = new Product({
            id: id,
            name: req.body.name,
            image: req.body.image,
            category: req.body.category,
            new_price: req.body.new_price,
            old_price: req.body.old_price,
        });

        await newProduct.save();
        console.log("✅ Product saved:", newProduct);
        res.json({
            success: true,
            name: req.body.name,
        });
    } catch (error) {
        console.error("❌ Error saving product:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});
//creating API for deleting product

app.post('/removeproduct', async (req, res) => {
    await Product.findOneAndDelete({ id: req.body.id });
    console.log("Removed");
    res.json({
        success: true,
        name: req.body.name
    })
})

//Creating API For Getting all products
app.get('/allproducts', async (req, res) => {
    let products = await Product.find({});
    console.log("All Products Fetched")
    res.send(products);
})

//schema creating for User model

const Users = mongoose.model('Users', {
    name: {
        type: String,
    },
    email: {
        type: String,
        unique: true,
    },
    password: {
        type: String,
    },
    cartData: {
        type: Object,
    },
    date: {
        type: Date,
        default: Date.now,
    }
})

//Creating Endpoint for registration the user
app.post('/signup', async (req, res) => {

    let check = await Users.findOne({ email: req.body.email });
    if (check) {
        return res.status(400).json({ success: false, errors: "existing user found with same email address" })
    }
    let cart = {};
    for (let i = 0; i < 300; i++) {
        cart[i] = 0;
    }
    const user = new Users({
        name: req.body.username,
        email: req.body.email,
        password: req.body.password,
        cartData: cart,
    })

    await user.save();

    const data = {
        user: {
            id: user.id
        }
    }
    const token = jwt.sign(data, 'secret_ecom');
    res.json({ success: true, token });

})

//creating endpoint for user login

app.post('/login', async (req, res) => {
    let user = await Users.findOne({ email: req.body.email });
    if (user) {
        const passCompare = req.body.password === user.password;
        if (passCompare) {
            const data = {
                user: {
                    id: user.id
                }
            }
            const token = jwt.sign(data, 'secret_ecom');
            res.json({ success: true, token });
        }
        else {
            res.json({ success: false, errors: "wrong password" });
        }
    }
    else {
        res.json({ success: false, errors: "wrong Email Id" })
    }
})

//Creating endpoint for newCollection Data
app.get('/newcollections', async (req, res) => {
    let products = await Product.find({});
    let newcollection = products.slice(1).slice(-8);
    console.log("NewCollection Fetched");
    res.send(newcollection);
})

//creating endpoint for popular in women section 
app.get('/popularinwomen', async (req, res) => {
    let products = await Product.find({ category: "women" })
    let popular_in_women = products.slice(0, 4);
    console.log("popular in women fetched");
    res.send(popular_in_women)
})
//creating middleware for fetch user
const fetchUser = async (req, res, next) => {
    const token = req.header('auth-token');
    if (!token) {
        return res.status(401).json({ errors: "please authenticate using valid token" })
    }
    try {
        const data = jwt.verify(token, 'secret_ecom');
        req.user = data.user;
        next();
    } catch (error) {
        return res.status(401).json({ errors: "Invalid token" })
    }
};


//creating endpoint for adding products in cartdata
app.post('/addtocart', fetchUser, async (req, res) => {
    console.log("Added", req.body.itemId);
    let userData = await Users.findOne({ _id: req.user.id });
    userData.cartData[req.body.itemId] += 1;
    await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
    res.send("Added")
})

//creating endpoint to remove products from cartdata
app.post('/removefromcart', fetchUser, async (req, res) => {
    console.log("Removed", req.body.itemId);
    let userData = await Users.findOne({ _id: req.user.id });
    if (userData.cartData[req.body.itemId] <= 0)
        userData.cartData[req.body.itemId] -= 1;
    await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
    res.send("Removed")
})

//creating endpoint to get cartdata
app.post('/getcart', fetchUser, async (req, res) => {
    console.log("GetCart");
    let userData = await Users.findOne({ _id: res.user.id });
    res.json(userData.cartData);
})