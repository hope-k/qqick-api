const asyncErrorHandler = require('../utils/asyncErrorHandler');
const sendError = require('../utils/sendError');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2

exports.register = asyncErrorHandler(async (req, res, next) => {
    const { email, password, name, avatar, confirmPassword } = req.body;
    if (password !== confirmPassword) {
        return next(new sendError('Passwords do not match'));
    }
    let avatarUrl;
    const userExists = await User.findOne({ email });
    if (userExists) {
        return next(new sendError('User already exists'));
    }
    await User.create({ email, name, password })
    if (avatar) {
        const result = await cloudinary.uploader.upload(avatar, {
            folder: 'qqick/profiles',
            crop: 'scale',
            width: '150'

        })
        console.log(result.secure_url)
        avatarUrl = result.secure_url;
        await User.findOneAndUpdate({ email }, { avatar: avatarUrl }, { new: true });

    }
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


})

exports.user = asyncErrorHandler(async (req, res) => {
    const user = await User.findById(req.user);
    return res.sendResponse({ user });

})


exports.logout = asyncErrorHandler((req, res) => {
    res.clearCookie('token');
    return res.sendResponse();

});