const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { Binary } = require('mongodb')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    age: {
        type: Number,
        required: true,
        default: 0,
        validate(value) {
            if (value < 0)
                throw new Error("age must not be negative")
        }
    },
    email: {
        type: String,
        trim: true,
        unique: true,
        required: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value))
                throw new Error('email is not valid')
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validate(value) {
            if (value.toLowerCase().includes('password'))
                throw new Error("password cannot contain password")
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }

})
userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})


userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens

    return userObject
}




userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, process.env.AUTH_SECRET_KEY)

    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token
}


userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })

    if (!user) {
        throw new Error('Unable to login')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        throw new Error('Unable to login')
    }

    return user
}

userSchema.pre('save', async function (next) {
    if (this.isModified('password'))
        this.password = await bcrypt.hash(this.password, 8)
    next()
})
const User = mongoose.model('User', userSchema)

module.exports = User