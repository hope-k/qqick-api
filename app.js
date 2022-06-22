require('dotenv').config();
const express = require('express');
const onError = require('./middlewares/onError');
const app = express();
const colors = require('colors');
const dbConnect = require('./config/dbConnect');
const PORT = process.env.PORT || 5000;
const cors = require('cors');
const chatsRoute = require('./routes/chatsRoute');
dbConnect()

app.use(onError)
app.use(cors({
    origin: process.env.FRONTEND_URL,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/api', chatsRoute);

app.listen(PORT, () => {
    console.log('server Started on port '.bold.italic.green + PORT.toString().bold.italic.green);
})








