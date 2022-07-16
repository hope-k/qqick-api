const asyncErrorHandler = require('../utils/asyncErrorHandler');
const sendError = require('../utils/sendError');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2
const bcrypt = require('bcryptjs');
const validator = require('validator');

exports.register = asyncErrorHandler(async (req, res, next) => {
    const { email, password, name, avatar, gender, confirmPassword } = req.body;
    if (password !== confirmPassword) {
        return next(new sendError('Passwords do not match'));
    }
    let avatarUrl;
    const userExists = await User.findOne({ email });
    if (userExists) {
        return next(new sendError('User already exists'));
    }
    await User.create({ email, name, password, gender })
    if (avatar) {
        const result = await cloudinary.uploader.upload(avatar, {
            folder: 'qqick/profiles',
            crop: 'scale',
            width: '150'

        })
        avatarUrl = result.secure_url;
        await User.findOneAndUpdate({ email }, { avatar: avatarUrl }, { new: true });

    }
    return res.sendResponse();
})


exports.login = asyncErrorHandler(async (req, res, next) => {
    const { email, password } = req.body;
    if (!validator.isEmail(email)) {
        return next(new sendError('Invalid email address'));
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        return next(new sendError('Incorrect user ID or password', 401));
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        return next(new sendError('Incorrect user ID or password', 401));
    }
    const token = await jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '24h' });

    let options = {
        maxAge: 24 * 60 * 60 * 1000, 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production' ? true : false,
        sameSite: 'none',
    }
    res.cookie('token', token, options);
    return res.sendResponse({token})


})

exports.me = asyncErrorHandler(async (req, res, next) => {
    if (!req.user) {
        return next(new sendError('You are not logged in', 401));
    }
    return res.sendResponse({ user: req.user });

})


exports.logout = asyncErrorHandler((req, res) => {
    res.clearCookie('token');
    return res.sendResponse();

});

exports.users = asyncErrorHandler(async (req, res, next) => {
    let users = [];
    if (!req.query.search.length > 0) {
        return res.sendResponse({ users })
    }
    const keyword = req.query.search ? {
        $or: [
            { name: { $regex: req.query.search, $options: 'i' } },
            { email: { $regex: req.query.search, $options: 'i' } }
        ]
    } : {}
    //find the users based on the keyword excluding the current user
    users = await User.find({ ...keyword, _id: { $ne: req.user._id } });

    return res.sendResponse({ users });
})

exports.setStatus = asyncErrorHandler(async (req, res, next) => {
    const { status } = req.body;
    req.user.status = status
    req.user.save()
    return res.sendResponse()
})

exports.getUser = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const user = await User.findById(id)
    if (!user) {
        return next(new sendError('User not found', 404));
    }
    return res.sendResponse({ user });
})