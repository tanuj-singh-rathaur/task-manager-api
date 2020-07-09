const express = require('express')
const User = require('../models/users')
const { findByIdAndRemove } = require('../models/users')
const auth = require('../authorisation/auth')
const router = express.Router()
const multer = require('multer')
const sharp = require('sharp')
const emails = require('../sendgrid/sendingemails')

const { sendWelcomeEmail, sendCancelationEmail } = require('../sendgrid/sendingemails')


router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try {
        await user.save()

        const token = await user.generateAuthToken()
        sendWelcomeEmail(user.email, user.name)
        res.status(201).send({ user, token })

    }
    catch (e) {
        res.status(400).send(e)
        console.log(e)

    }
})

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user, token })

    } catch (e) {
        res.status(400).send(e)
    }
})


router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()

        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

router.post('/users/logoutall', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})


router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})



router.patch('/users/me', auth, async (req, res) => {
    const allowedUpdates = ['name', 'age', 'email', 'password']
    const updates = Object.keys(req.body)
    const isValidOperation = updates.every((updates) => allowedUpdates.includes(updates))

    if (!isValidOperation)
        return res.send({ error: "the property you are trying to manipulate does not exist" })

    try {
        updates.forEach((update) => {
            req.user[update] = req.body[update]
        })
        await req.user.save()
        res.send(req.user)
    } catch (e) {
        res.status(500).send(e)

    }
})
router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove()
        sendCancelationEmail(req.user.email, req.user.name)
        res.send(req.user)
    } catch (e) {
        res.status(500).send(e)

    }

})

const upload = multer({
    limits: {
        size: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/))
            return cb(new Error('please upload files only in jpg, jpeg,and png format'))
        cb(undefined, true)
    }

})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})


router.delete('/users/me/avatar', auth, async (req, res) => {
    try {
        req.user.avatar = undefined
        await req.user.save()
        res.send()
    } catch (e) {
        console.log(error, e)
    }
})

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user | !user.avatar)
            throw new Error()
        res.set('Content-Type', 'image/png')
        res.send(avatar)

    } catch (e) {

    }
})
module.exports = router