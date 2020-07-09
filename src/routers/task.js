const express = require('express')
const Task = require('../models/tasks')
const auth = require('../authorisation/auth')
const router = express.Router()


router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })
    try {
        await task.save()
        res.status(201).send(task)
        console.log(task + 'saved')
    } catch (e) {
        res.status(400).send(e)
        console.log(e)
    }

})

router.get('/tasks', auth, async (req, res) => {
    const match = {}
    const sort = {}
    if (req.query.completed)
        match.completed = req.query.completed === 'true'
    if (req.query.sortby) {
        const parts = req.query.sortby.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }
    try {
        const tasks = await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip)
            },
            sort
        }).execPopulate()
        res.send(tasks.tasks)
    } catch (e) {
        res.status(500).send(e)
    }
})

router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id
    try {
        const task = await Task.findOne({ _id, owner: req.user._id })
        if (!task)
            res.status(404).send()
        res.send(task)
    } catch (e) {
        res.status(500).send(e)
        console.log(e)
    }
})



router.patch('/tasks/:id', auth, async (req, res) => {
    const allowedUpdates = ['description', 'completed']
    const updates = Object.keys(req.body)
    const isValidOperation = updates.every((updates) => allowedUpdates.includes(updates))
    if (!isValidOperation)
        return res.send({ error: "the property you are trying to manipulate does not exist" })
    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })
        if (!task)
            res.status(404).send()
        updates.forEach((update) => task[update] = req.body[update])
        await task.save()
        res.send(task)
    } catch (e) {
        res.status(500).send(e)
        console.log(e)
    }
})

router.delete('/tasks/:id', async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id })
        if (!task)
            res.status(404).send()
        res.send()
        console.log(task + 'deleted')
    } catch (e) {
        res.status(500).send()
    }
})
module.exports = router