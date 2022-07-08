const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const protectedRoute = require('../middlewares/protectedRoute');

router.post('/message/send', protectedRoute, messageController.sendMessage);
router.get('/message/:chatId', messageController.getMessages);

module.exports = router;