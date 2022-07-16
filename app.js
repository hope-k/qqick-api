require('dotenv').config();
const express = require('express');
const onError = require('./middlewares/onError');
const app = express();
const colors = require('colors');
const dbConnect = require('./config/dbConnect');
const PORT = process.env.PORT || 5000;
const cors = require('cors');
const chatsRoute = require('./routes/chatsRoute');
const authRoute = require('./routes/authRoute');
const notificationRoute = require('./routes/notificationRoute');
const sendResponse = require('./middlewares/sendResponse');
const cookieParser = require('cookie-parser');
const cloudinary = require('cloudinary').v2;
const messageRoute = require('./routes/messageRoute');
const Socket = require('./models/socket');
const User = require('./models/user');
const Notification = require('./models/notification');
app.enable('trust proxy');


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

dbConnect()




app.use(cookieParser({
    secret: process.env.COOKIE_SECRET,
}));
app.use(sendResponse)
app.use(cors({
    origin: process.env.FRONTEND_URL,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api', chatsRoute);
app.use('/api', authRoute);
app.use('/api', messageRoute);
app.use('/api', notificationRoute)
app.use(onError)

const server = app.listen(PORT, () => {
    console.log('server Started on port '.bold.italic.green + PORT.toString().bold.italic.green);
})

const io = require('socket.io')(server, {
    pingInterval: 9000,
    pingTimeout: 15000,
    cors: {
        origin: process.env.FRONTEND_URL,
        methods: ["GET", "POST"],
        credentials: true
    },
    allowEIO3: true

});


io.on("connection", async (socket) => {
    console.log("New client connected".bgGreen.italic.bold);

    socket.on('setup', async (currentUser) => {
        let newUserOnline = await Socket.findOne({ $and: [{ user: currentUser?._id }, { socketId: socket.id }] });
        if (!newUserOnline) {
            newUserOnline = await Socket.create({ user: currentUser?._id, socketId: socket.id });
        }
        const user = await User.findById(newUserOnline.user);
        if (user) {
            user.status = 'available'
            await user.save();
        }
        socket.join(currentUser?._id)
        socket.emit('connected')
        console.log('socket connected', currentUser?.email);
    })

    socket.on('join chat', (room) => {
        socket.join(room)
        console.log('User joined: ', room)

    })

    socket.on('typing', (room) => {
        socket.in(room.id).emit('typing', room)
    })
    socket.on('stop typing', (room) => socket.to(room).emit('stop typing'))


    socket.on('send message', async (newMessageData) => {
        const newMessage = newMessageData.message;
        const chat = newMessage?.chat
        if (!chat?.users) {
            return console.log("Chat users not defined")
        }
        const users = chat?.users
        if (!newMessage?.chat?.isGroupChat) {
            const liveMessageRecipient = users?.filter(u => u?._id !== newMessageData.currentUser?._id)[0]
            if (liveMessageRecipient && liveMessageRecipient?.status !== 'available') {
                await Notification.create({
                    users: users.filter(u => u?._id !== newMessageData.currentUser?._id),
                    message: newMessage
                })
            }
        }
        users.forEach(async (user) => {
            if (newMessage?.chat?.isGroupChat) {
                if (user?.status !== 'available') {
                    await Notification.create({
                        users: users.filter(u => u?._id !== newMessage?.sender?._id),
                        message: newMessage
                    })
                }
            }
            if (user !== newMessage?.sender?._id) {
                socket.to(user._id).emit('message received', newMessage)
            } else {
                return
            }
        })

    })


    socket.off('setup', () => {
        console.log('socket disconnected')
    })



    socket.on("disconnect", async () => {
        const disconnectingUser = await Socket.findOne({ socketId: socket.id });
        if (disconnectingUser) {
            const user = await User.findById(disconnectingUser.user);
            if (user) {
                user.status = 'away'
                await user.save();
            }
        }
        await Socket.deleteMany({ socketId: socket.id })
        console.log("Client disconnected".bgRed.italic.bold, socket.id);
    })
})








