const asyncErrorHandler = require("../utils/asyncErrorHandler");
const sendError = require("../utils/sendError");
const Chat = require("../models/chat");
const User = require("../models/user");



exports.createChat = asyncErrorHandler(async (req, res, next) => {
    const { receiverId } = req.body;
    const senderId = req.user._id;
    const user = await User.findById(receiverId);

    const chatExist = await Chat.findOne({
        isGroupChat: false,
        $and: [
            { users: senderId },
            { users: receiverId }
        ]
    }).populate('users', 'name email avatar').populate('latestMessage').populate({ path: 'latestMessage.sender', select: 'name email avatar' });

    if (!chatExist) {
        const newChat = await Chat.create({
            users: [senderId, receiverId],
            chatName: user.name,
        })
        const chat = await Chat.findById(newChat._id).populate('users', 'name email avatar').populate('latestMessage').populate({ path: 'latestMessage.sender', select: 'name email avatar' });
        return res.sendResponse({ chat });
    }
    return res.sendResponse({ chat: chatExist });

});
exports.getChats = asyncErrorHandler(async (req, res, next) => {
    const userId = req.user._id;
    const chats = await Chat.find({ $or: [{ users: userId }, { groupAdmin: req.user._id }] })
        .populate('users', 'name email avatar').populate('groupAdmin')
        .populate('latestMessage')
        .populate({ path: 'latestMessage', populate: { path: 'sender' } }).sort({ updatedAt: -1 });
    return res.sendResponse({ chats });

})
exports.getConversation = asyncErrorHandler(async (req, res, next) => {
    const { chatId } = req.query;
    const chat = await Chat.findById(chatId).populate('users', 'name email avatar').populate('groupAdmin', 'name email avatar').populate('latestMessage', 'name sender').populate({ path: 'latestMessage.sender', select: 'name email avatar' }).sort({ updatedAt: -1 });
    return res.sendResponse({ chat });
})
exports.createGroupChat = asyncErrorHandler(async (req, res, next) => {
    if (!req.body.groupName || !req.body.users) {
        return next(new sendError('Please provide group name and users'));
    }
    const groupExist = await Chat.findOne({
        groupAdmin: req.user._id,
        chatName: req.body.groupName
    })
    if (groupExist) {
        return next(new sendError('Group already exist'));
    }
    const { groupName, users } = req.body;
    const usersIncludingAdmin = [req.user._id, ...users];


    if (users.length < 2) {
        return next(new sendError('Please select at least two users'));
    }

    const newChat = await Chat.create({
        isGroupChat: true,
        chatName: groupName,
        groupAdmin: req.user._id,
        users: usersIncludingAdmin,
    })
    const chat = await Chat.findById(newChat._id).populate('groupAdmin', 'name email avatar').populate('users', 'name email avatar').populate('latestMessage').populate({ path: 'latestMessage.sender', select: 'name email avatar' });
    return res.sendResponse({ chat });

});

exports.updateGroupChat = asyncErrorHandler(async (req, res, next) => {
    let chat;
    const groupId = req.query.groupId;
    if (!groupId) {
        return next(new sendError('Please provide group id'));
    }
    const { groupName, users } = req.body;
    chat = await Chat.findByIdAndUpdate(groupId, { users, chatName: groupName }, { new: true });
    return res.sendResponse({ chat });

});

exports.deleteGroupChat = asyncErrorHandler(async (req, res, next) => {
    const groupId = req.query.groupId;
    if (!groupId) {
        return next(new sendError('Please provide group id'));
    }
    await Chat.findByIdAndDelete(groupId);
    return res.sendResponse();

})
