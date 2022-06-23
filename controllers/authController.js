const asyncErrorHandler = require('../utils/asyncErrorHandler');
const sendError = require('../utils/sendError');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');


exports.register = asyncErrorHandler(async (req, res, next) => {
    const { email, password, name, avatar } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
        return next(new sendError('User already exists'));
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ email, name, avatar, password: hashedPassword })
    return res.sendResponse();
})


exports.login = asyncErrorHandler(async (req, res, next) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        return next(new sendError('Incorrect user ID or password', 401));
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        return next(new sendError('Incorrect user ID or password', 401));
    }
    const token = await jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.cookie('token', token,)
    return res.sendResponse()
    //24 hours to milliseconds: 24 * 60 * 60 * 1000


})

exports.user = asyncErrorHandler(async (req, res) => {
    const user = await User.findById(req.user);
    return res.sendResponse({ user });

})