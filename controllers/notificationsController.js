const Notification = require('../models/notification');
const asyncErrorHandler = require('../utils/asyncErrorHandler');
const sendError = require('../utils/sendError');


exports.create = asyncErrorHandler(async (req, res, next) => {
    //need users the notification belongs to and the message
    const { message, users } = req.body;
    if (!message) {
        return next(new sendError('Message is required'));
    }
    await Notification.create({ message, users });
    return res.sendResponse();
})

exports.index = asyncErrorHandler(async (req, res, next) => {
    
    const notifications = await Notification.find({ users: req.user._id })
        .populate('message')
        .populate('users')
        .populate({ path: 'message', populate: { path: 'sender chat'} })
        .sort({ createdAt: -1 });
    return res.sendResponse({ notifications });
})

exports.delete = asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    await Notification.findByIdAndDelete(id);
    return res.sendResponse();
})


