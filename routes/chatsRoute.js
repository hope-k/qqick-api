const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const protectedRoute = require('../middlewares/protectedRoute');


router.post('/chat/create', protectedRoute, chatController.createChat);
router.get('/chat/index', protectedRoute, chatController.getChats);
router.get('/chat/conversation', protectedRoute, chatController.getConversation);
router.post('/group-chat/create', protectedRoute, chatController.createGroupChat);
router.put('/group-chat/update', protectedRoute, chatController.updateGroupChat);
router.delete('/group-chat/delete', protectedRoute, chatController.deleteGroupChat);

module.exports = router;