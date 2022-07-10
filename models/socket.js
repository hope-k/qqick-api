const mongoose = require('mongoose')

const socketSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        unique: false
    },
    socketId: {
        type: String,
        trim: true,
        unique:false
    },



}, {
    timestamps: true
})

module.exports = mongoose.model('Socket', socketSchema)


