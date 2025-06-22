const express = require('express');
const nodemailer = require('nodemailer')
const User = require('../models/User');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fetchuser = require('../middleware/fetchuser')
const sendOTP = require('./sendOTP');
const Otp = require('../models/Otp')

const JWT_SECRET = 'AbdulRehmanIsAGoodB$oy';

// ROUTE 1: create a user using: POST "/api/auth/createuser". No login required
router.post('/createuser', [
    body('name', 'Enter a valid name').isLength({ min: 3 }),
    body('email', 'Enter valid email address').isEmail(),
    body('password', 'Password must contain more than 5 letters').isLength({ min: 5 })
], async (req, res) => {
    const { name, email, password } = req.body;
    //If there are errors, return Bad requests and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    //Check whether a user with this email exists already.
    try {
        let user = await User.findOne({ email: req.body.email });
        if (user) {
            return res.status(400).json({ success: false, error: "Sorry, a user already exists with this email address" });
        }

        // Generating the OTP
        const otp = Math.floor(100000 + Math.random() * 900000);

        // Save OTP to database with expiry of 5 minutes
        await Otp.create({
            name,
            email,
            password,
            otp,
            createdAt: Date.now(),
            expiresAt: Date.now() + 5 * 60 * 1000
        });

        // Sending the OTP
        await sendOTP(email, otp)

        res.status(200).json({success: true, message: "OTP sent to your email"})
    } catch (error) {
        console.error(error.message);
        res.status(500).send({success: false, error});
    }
})

// Authenticating the user using the sent OTP using: POST "/api/auth/verify-otp"
router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    try {
        const record = await Otp.findOne({ email, otp: Number(otp) });
        if (!record) return res.status(400).send({success: false, error: "Invalid OTP"});
        if (record.expiresAt < Date.now()) {
            await Otp.deleteOne({ _id: record._id });
            return res.status(400).send({success: false, error: "OTP Expired"})
        }

        const salt = await bcrypt.genSalt(10);
        const secPass = bcrypt.hash(record.password, salt);

        const user = await User.create({
            name: record.name,
            email: record.email,
            password: secPass
        });
        // .then(user => res.json(user))
        // .catch(err => {console.log(err),
        //     res.json({error: 'Please enter a unique value for email', message: err.message})
        // })
        // res.json({user});

        await Otp.deleteOne({ _id: record._id });

        const data = { user: { id: user.id } }
        const authtoken = jwt.sign(data, JWT_SECRET);

        res.json({ success: true, authtoken });
    } catch (error) {
        console.error(error.message);
        res.status(500).send({success: false, error});
    }
})

// ROUTE 2: Authenticate a user using: POST "/api/auth/login". No login required
router.post('/login', [
    body('email', 'Enter valid email address').isEmail(),
    body('password', 'password cannot be blank').exists()
], async (req, res) => {
    //If there are errors, return Bad requests and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (!user) {
            let success = false;
            return res.status(400).json({ success, error: "Please try to login with correct credentials" });
        }
        const passwordCompare = await bcrypt.compare(password, user.password);
        if (!passwordCompare) {
            let success = false;
            return res.status(400).json({ success, error: "Please try to login with correct credentials" });
        }
        const data = {
            user: {
                id: user.id
            }
        }
        const authtoken = jwt.sign(data, JWT_SECRET);
        // res.json({user});
        let success = true;
        res.json({ success, authtoken });

    } catch (error) {
        console.error(error.message);
        res.status(500).send({success: false, error});
    }
})

// ROUTE 3: Get logged in user's details: POST "/api/auth/getuser". Login required
router.post('/getuser', fetchuser, async (req, res) => {
    try {
        userId = req.user.id;
        const user = await User.findById(userId).select("-password");
        res.send(user);
    } catch (error) {
        console.error(error.message);
        res.status(500).send({success: false, error});
    }
})

module.exports = router;