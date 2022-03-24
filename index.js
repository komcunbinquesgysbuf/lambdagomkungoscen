const express = require('express')
require('dotenv').config()
const app = express()
const port = 3000

app.get('/', (req, res) => {
    res.send('Hello World! ' + JSON.stringify(process.env.FOO))
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
