const Notification = require('../models/notification');
const asyncErrorHandler = require('../utils/asyncErrorHandler');
const sendError = require('../utils/sendError');


exports.create = asyncErrorHandler(async (req, res, next) => {
    const { message } = req.body;
    if (!message) {
        return next(new sendError('Message is required'));
    }
    const messageExists = await Notification.findOne({ message });
    if (messageExists) {
        return next(new sendError('Message already exists'));
    }

    const user = req.user._id
    await Notification.create({ message, user });
    return res.sendResponse();
})

exports.index = asyncErrorHandler(async (req, res, next) => {
    const notifications = await Notification.find({ user: req.user._id }).populate('message').populate('user').populate({ path: 'message', populate: { path: 'sender chat' } }).sort({ createdAt: -1 });
    return res.sendResponse({ notifications });
})

exports.delete = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    await Notification.findByIdAndDelete(id);
    return res.sendResponse();
})


