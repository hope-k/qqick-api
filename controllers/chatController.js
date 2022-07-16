const asyncErrorHandler = require("../utils/asyncErrorHandler");
const sendError = require("../utils/sendError");
const Chat = require("../models/chat");
const User = require("../models/user");
const cloudinary = require('cloudinary').v2
const Message = require("../models/message");


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
    }).populate('users').populate('latestMessage').populate({ path: 'latestMessage.sender', select: 'name email avatar' });

    if (!chatExist) {
        const newChat = await Chat.create({
            users: [senderId, receiverId],
            chatName: user.name,
        })
        const chat = await Chat.findById(newChat._id).populate('users').populate('latestMessage').populate({ path: 'latestMessage.sender', select: 'name email avatar' });
        return res.sendResponse({ chat });
    }
    return res.sendResponse({ chat: chatExist });

});
exports.getChats = asyncErrorHandler(async (req, res, next) => {
    const userId = req.user._id;
    const chats = await Chat.find({ $or: [{ users: userId }, { groupAdmin: req.user._id }] })
        .populate('users').populate('groupAdmin')
        .populate('latestMessage')
        .populate({ path: 'latestMessage', populate: { path: 'sender' } }).sort({ updatedAt: -1 });
    return res.sendResponse({ chats });

})
exports.getConversation = asyncErrorHandler(async (req, res, next) => {
    const { chatId } = req.query;
    const chat = await Chat.findById(chatId).populate('users').populate('groupAdmin', 'name email avatar').populate('latestMessage', 'name sender').populate({ path: 'latestMessage.sender', select: 'name email avatar' }).sort({ updatedAt: -1 });
    return res.sendResponse({ chat });
})
exports.createGroupChat = asyncErrorHandler(async (req, res, next) => {
    if (!req.body.groupName || !req.body.users) {
        return next(new sendError('Please provide group name and users'));
    }

    const { groupName, users } = req.body;
    const usersIncludingAdmin = [req.user._id, ...users];


    if (users?.length < 2) {
        return next(new sendError('Please select at least two users'));
    }

    let avatar;
    let avatarId;
    if (req.body.groupImage) {
        const result = await cloudinary.uploader.upload(req.body.groupImage, {
            folder: 'qqick/groupImages',
            crop: 'scale',
            width: '150'

        })
        avatar = result.secure_url;
        avatarId = result.public_id;

    }

    const newChat = await Chat.create({
        isGroupChat: true,
        chatName: groupName,
        groupAdmin: req.user._id,
        groupImage: avatar,
        groupImageId: avatarId,
        users: usersIncludingAdmin,
    })
    const chat = await Chat.findById(newChat._id).populate('groupAdmin', 'name email avatar').populate('users').populate('latestMessage').populate({ path: 'latestMessage.sender', select: 'name email avatar' });
    return res.sendResponse({ chat });

});

exports.updateGroupChat = asyncErrorHandler(async (req, res, next) => {
    const groupId = req.query.groupId;
    let chat;
    if (!groupId) {
        return next(new sendError('Please provide group id'));
    }
    const { groupName, users, groupImage } = req.body;

    chat = await Chat.findById(groupId)
    if (groupImage) {
        if (chat.groupImage !== groupImage) {
            // check if cloudinary has group image
            if (chat.groupImage) {
                await cloudinary.uploader.destroy(chat.groupImageId)
            }
            const result = await cloudinary.uploader.upload(groupImage, {
                folder: 'qqick/groupImages',
                crop: 'scale',
                width: '150'
            })
            chat.groupImage = result.secure_url;
            chat.groupImageId = result.public_id;
            chat.users = users;
            chat.chatName = groupName;
            await chat.save()
            return res.sendResponse({chat});
        }
    }
    chat.users = users;
    chat.chatName = groupName;
    await chat.save()

    return res.sendResponse({ chat });

});

exports.deleteGroupChat = asyncErrorHandler(async (req, res, next) => {
    const groupId = req.query.groupId;
    if (!groupId) {
        return next(new sendError('Please provide group id'));
    }
    const chat = await Chat.findById(groupId);
    if (chat?.groupImage) {
        await cloudinary.uploader.destroy(chat.groupImageId)
    }
    const messages = await Message.find({ chat: groupId });
    if (messages.length) {
        await Message.deleteMany({ chat: groupId });
    }
    await Chat.findByIdAndDelete(groupId);
    return res.sendResponse();

})
