const express = require('express');
const router = express.Router();
const chats = require('../data/chats');


router.get('/chats', (req, res) => {
    return res.status(200).json({
        chats
    })
})

module.exports = router;