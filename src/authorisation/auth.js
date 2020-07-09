const User = require('../models/users')
const jwt = require('jsonwebtoken')
const { response } = require('express')

const auth = async (req, res, next) => {

    try {
        const token = req.header('authorization').replace("Bearer ", "")
        const decoded = jwt.verify(token, process.env.AUTH_SECRET_KEY)
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token })
        console.log(token)
        console.log(user)
        if (!user)
            throw new Error()
        req.user = user
        req.token = token
        next()
    } catch (e) {
        res.status(401).send({ error: "please authenticate" })
        console.log(e)
    }

}
module.exports = auth