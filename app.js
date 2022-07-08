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


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

dbConnect()

app.use(cookieParser({
    secret: process.env.COOKIE_SECRET,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'none',
    secure: process.env.NODE_ENV === 'production' ? true : false

}));
app.use(sendResponse)
app.use(cors({
    origin: process.env.FRONTEND_URL,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api', chatsRoute);
app.use('/api', authRoute);
app.use('/api', messageRoute);
app.use('/api',notificationRoute)
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

io.on("connection", (socket) => {
    console.log("New client connected".bgGreen.italic.bold);

    socket.on('setup', (currentUser) => {
        socket.join(currentUser?._id)
        socket.emit('connected')

        console.log('socket connected', currentUser?.email);
    })

    socket.on('online', (user) => {
        socket.emit('online', user)
        console.log(`${user?.email} is online`)
    })
    
    socket.on('join chat', (room) => {
        socket.join(room)
        console.log('User joined: ', room)

    })

    socket.on('typing', (room) => {
        socket.in(room.id).emit('typing', room)
    })
    socket.on('stop typing', (room) => socket.to(room).emit('stop typing'))


    socket.on('send message', (newMessage) => {
        const chat = newMessage?.chat
        if (!chat?.users) {
            return console.log("Chat users not defined")
        }
        const users = chat?.users
        console.log('USERS BEFORE', users)

        users.forEach(user => {
            console.log('USERS AFTER', user)
            if (user !== newMessage?.sender?._id) {
                socket.to(user).emit('message received', newMessage)
            } else {
                return
            }
        })

    })
    

    socket.off('setup', () => {
        console.log('socket disconnected')
        socket.leave(user)
    })



    socket.on("disconnect", () => {
        console.log("Client disconnected".bgRed.italic.bold);
    })
})








