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
const sendResponse = require('./middlewares/sendResponse');
const cookieParser = require('cookie-parser');
const cloudinary = require('cloudinary').v2;

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
app.use(onError)

app.listen(PORT, () => {
    console.log('server Started on port '.bold.italic.green + PORT.toString().bold.italic.green);
})








