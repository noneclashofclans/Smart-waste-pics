const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./User');
const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { username, email, password, phone, age } = req.body;

        // Validate inputs
        if (!username || !email || !password || !phone || !age) {
            return res.status(400).json({ msg: "Fill all fields" });
        }

        if (password.length < 6) {
            return res.status(400).json({ msg: "Password must be at least 6 characters" });
        }

        const user = await User.findOne({ email });
        
        
        if (user) {
            return res.status(400).json({ msg: "User already exists" });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await new User({
            username,
            email,
            password: hashedPassword,
            age: parseInt(age),
            phone
        })

        await newUser.save();
        res.status(201).json({ msg: "Registration successful" });

    } catch (err) {
        console.error('Registration Error:', err);
        res.status(500).json({ msg: "Server error" });
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('Login attempt with:', { email, hasPassword: !!password });

        if (!email || !password) {
            return res.status(400).json({ msg: "Please fill all fields" });
        }

     
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(400).json({ msg: "Enter in a valid email format (e.g., user@example.com)" });
        }

        
        if (!user.username || !user.email || !user.password) {
            return res.status(400).json({ msg: "Please complete your registration first" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match:', isMatch);

        if (!isMatch) {
            return res.status(400).json({ msg: "Wrong password" });
        }

        const token = jwt.sign(
            { _id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "200d" }
        );

        console.log('Login successful for:', user.username);

        res.json({
            token,
            username: user.username,
            email: user.email,
            phone: user.phone
        });

    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ msg: "Server error" });
    }
});


module.exports = router;