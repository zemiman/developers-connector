const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const config = require('config');
//@route    POST  api/users
//@does     Register user
//@accesss  public
router.post('/', [
    check('name', 'Name is required!')
        .not()
        .isEmpty(),
    check('email', 'please insert a valid email!').isEmail(),
    check('password', 'Please enter a password with 6 or more characters')
        .isLength({ min: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    const { name, email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ errors: [{ msg: 'User already exists' }] })
        }
        //Creating an avatar
        const avatar = gravatar.url(email, {
            s: "200",
            r: "pg",
            d: "mm"
        })
        user = new User({
            name,
            email,
            avatar,
            password
        })
        //Password hashing:
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
        //Creating Registeration token
        const payload = {
            user: {
                _id: user._id
            }
        }
        //jwt.
        jwt.sign(
            payload,
            config.get('jwtSecret'),
            (err, token) => {
                if (err) throw err;
                return res.json({ token })
            }
        )
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Serever error');
    }

})

module.exports = router;