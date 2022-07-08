const express = require('express')
const router = express.Router()
const notificationsController = require('../controllers/notificationsController')
const protectedRoute = require('../middlewares/protectedRoute')


router.get('/notifications/index', protectedRoute, notificationsController.index)
router.post('/notifications/create', protectedRoute, notificationsController.create)
router.delete('/notifications/:id', protectedRoute, notificationsController.delete)


module.exports = router

