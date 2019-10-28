const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');
const config = require('config');
const auth = require('../../middleware/auth');
const User = require('../../models/User');
//@route    GET  api/auth
//@does     Test route
//@accesss  public
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        return res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

//@route    POST  api/auth
//@does     Authenticate user & get token:
//@accesss  public
router.post('/', [
    check('email', 'please insert a valid email!').isEmail(),
    check('password', 'password is required!').exists()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ errors: [{ msg: 'Invalid Credentials!' }] })
        }
        const ismatch = await bcrypt.compare(password, user.password);
        if (!ismatch) {
            return res.status(400).json({ errors: [{ msg: 'Invalid Credential!' }] })
        }
        //Creating token:
        const payload = {
            user: {
                _id: user._id
            }
        }
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