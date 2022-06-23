const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: [true, 'Name is required'],
    },
    email: {
        type: String,
        trim: true,
        required: [true, 'Email is required'],
        unique: true,
    },
    password: {
        type: String,
        trim: true,
        required: [true, 'Password is required'],
        select: false
    },
    avatar: {
        type: String,
        trim: true,
    }
},
    {
        timestamps: true
    }
)


userSchema.pre('save', async function (next) {
    const user = this;
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }
    return next();
})

module.exports = mongoose.model('User', userSchema)