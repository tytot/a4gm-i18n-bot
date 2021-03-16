const express = require('express')
const app = express()
app.use(express.json())
const requests = require('./requests')
const port = 42069

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.post('/', (req, res) => {
    requests.processEvent(req.body)
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
