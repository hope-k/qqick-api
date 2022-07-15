const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const protectedRoute = require('../middlewares/protectedRoute');


router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', protectedRoute, authController.me);
router.post('/status', protectedRoute, authController.setStatus);
router.get('/users', protectedRoute, authController.users)
router.post('/logout', authController.logout);
router.get('/user/:id', protectedRoute, authController.getUser);


module.exports = router;