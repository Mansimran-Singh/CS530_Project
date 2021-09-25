// standard modules
const express = require('express');
const env = require('./env.js');
const app = express();
const path = require('path');

// local modules
const db = require('./db');
const logger = require('./middleware/logger');

// configuration
const port = env.httpPort ?? 5001;


// additional modules
app.use('/notify', require('./notification'));
app.use('/categories', require('./api/categories/categories'));


// middleware registration
app.use(logger);


// static file location
app.use(express.static(path.join(__dirname, 'public')));


// main application
app.listen(port, () => {
    console.log(`Example app listening at ${env.hostAddress}:${port}`);
});

app.get('/', (req, res) => {

    db.client.connect((err, client) => {
        if (err !== undefined) {
            res.sendStatus(401); // TODO: remove before prod
        }
        res.sendFile(path.join(__dirname, 'views/api', 'index.html'))
        // res.json(...);
        // res.send(__dirname);
    });

});

app.get('/test/error', (req, res) => {
    res.sendStatus(500);
});


module.exports = app;