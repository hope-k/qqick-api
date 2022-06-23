const sendError = require('../utils/sendError');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const asyncErrorHandler = require('../utils/asyncErrorHandler');

module.exports = asyncErrorHandler(async (req, res, next) => {
    const token = req.cookies?.token;
    console.log(token)

    if (!token) {
        return next(new sendError('You are not logged in', 401));
    }

    const decode = jwt.verify(token, process.env.JWT_SECRET);
    if (!decode) {
        return next(new sendError('Invalid token', 401));
    }
    const user = await User.findById(decode._id);
    req.user = user;

    return next();

})