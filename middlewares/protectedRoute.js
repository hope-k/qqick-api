const sendError = require('../utils/sendError');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const asyncErrorHandler = require('../utils/asyncErrorHandler');

module.exports = asyncErrorHandler(async (req, res, next) => {
    try {
        const token = req.headers?.authorization?.replace('Bearer ', '');
        if (!token) {
            return next(new sendError('You are not logged in', 401));
        }
        const decode = await jwt.verify(token, process.env.JWT_SECRET);
        console.log(decode._id, 'token');
        if (!decode) {
            return next(new sendError('Invalid token', 401));
        }
        console.log(decode, '----USER')
        const user = await User.findById(decode._id);
        if (!user) {
            return next(new sendError('User not found', 404));
        }
        req.user = user;
        return next();

    } catch (err) {
        if (err) {
            return next(new sendError(err?.message, 401));
        }
    }

})