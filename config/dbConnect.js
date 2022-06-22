const { bgRed } = require("colors")
const { default: mongoose } = require("mongoose")

module.exports = () => {
    mongoose.connect(process.env.MONGO_URI, ({ useNewUrlParser: true, useUnifiedTopology: true })).then(() => {
        console.log('Database connected successfully'.bgMagenta.bold.italic.white)
    }).catch(err => {
        console.log('Database connection failed'.bgRed.bold.italic, + err.message)
    })
}