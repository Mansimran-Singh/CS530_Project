// standard modules
const express = require('express');
const env = require('./env.js');
const app = express();
const path = require('path');

// local modules
const db = require('./db');
const logger = require('./middleware/logger');

// additional modules
require('./notification')(app);
// require('./api/categories')(app);
const api_categories = require('./api/categories/categories');
app.use('/api/categories', api_categories);


const port = env.httpPort ?? 5001;

// static file location
app.use(express.static(path.join(__dirname, 'shared')));


// middleware registration
app.use(logger);


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
