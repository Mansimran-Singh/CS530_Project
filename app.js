const express = require('express');
const env = require('./env.js');
const db = require('./api/db');
const app = express();
const path = require('path');

// additional modules
require('./api/notification')(app);

const port = env.httpPort ?? 5001;

app.use(express.static(path.join(__dirname, 'shared')));

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
