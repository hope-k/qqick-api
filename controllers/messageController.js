const asyncErrorHandler = require('../utils/asyncErrorHandler')
const sendError = require('../utils/sendError')
const Chat = require('../models/chat')
const Message = require('../models/message')

exports.sendMessage = asyncErrorHandler(async (req, res, next) => {
    const { chatId, text } = req.body;
    const senderId = req.user._id;
    const chat = await Chat.findById(chatId);
    if (!chat) {
        return next(new sendError('Chat not found', 404));
    }
    const newMessage = await Message.create({
        sender: senderId,
        text,
        chat: chatId,
    });

    const message = await Message.findById(newMessage._id)
        .populate('sender')
        .populate('chat')
        .populate({ path: 'chat', populate: { path: 'users', select: 'name email avatar status' } })
    const chatUpdate = await Chat.findByIdAndUpdate(chatId, { latestMessage: newMessage._id }, { new: true });


    return res.sendResponse({ message });
})

exports.getMessages = asyncErrorHandler(async (req, res, next) => {
    const { chatId } = req.params;
    const messages = await Message.find({ chat: chatId })
        .populate('sender', 'name email avatar status')
        .populate({ path: 'chat', populate: { path: 'users', select: 'name email avatar status' } })
        .sort({ createdAt: 1 });
    return res.sendResponse({ messages });
})