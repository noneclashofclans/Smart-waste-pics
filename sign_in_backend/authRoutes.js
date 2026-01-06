const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('./User');

const router = express.Router();

router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    // if email or password is not found, then return error status
    if (!email || !password) {
        return res.status(400).json({ message: 'Missing values' })
    }

    // else logic here
    // find for mail
    const exists = await User.findOne({ email });

    // if present already
    if (exists) return res.status(400).json({ msg: "Entered user already exists. Kindly login." });
    // else logic 

    const hash = await bcrypt.hash(password, 10);
    await User.create({ email, password: hash });

    res.json({ msg: 'Registration successfull' });
})


router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const present = await User.findOne({ email });

    if (!present) return res.status(400).json({ msg: 'User not found' });

    const ok = await bcrypt.compare(password, present.password);
    if (!ok) return res.status(400).json({ msg: "Wrong password" });

    // token creation
    const token = jwt.sign({ id: present._id }, process.env.JWT_SECRET);
    res.json({ token });
})

module.exports = router;