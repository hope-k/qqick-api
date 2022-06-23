const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authentication = require('../middlewares/authentication');


router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/user', authentication, authController.user);

module.exports = router;