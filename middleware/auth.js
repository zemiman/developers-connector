const jwt = require('jsonwebtoken');
const config = require('config');
module.exports = (req, res, next) => {
    //Get token from a header:
    const token = req.header('x-auth-token');
    //check it is a token or not:
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }
    //Verify the token
    try {
        const decoded = jwt.verify(token, config.get('jwtSecret'));
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid!' })
    }
}