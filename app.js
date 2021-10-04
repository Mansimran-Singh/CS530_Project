// standard modules
const express = require('express');
const env = require('./env.js');
const app = express();
const path = require('path');


// local modules
const db = require('./db');
const logger = require('./middleware/logger');
const errorhandler = require('./middleware/errorhandler');


// configuration
const port = env.httpPort ?? 5001;


// middleware registration
app.use(logger);



// static file location
app.use(express.static(path.join(__dirname, 'public')));


// main application
// if (env.runtime.node) {
//     app.listen(port, () => {
//         console.log(`Example app listening at ${env.hostAddress}:${port}`);
//     });
// }


// additional routes
app.use('/notify', require('./notification'));
app.use('/categories', require('./api/categories/categories'));


app.get('/', (req, res) => {
    db.client.connect((err, client) => {
        if (err !== undefined) {
            res.sendStatus(500);
        }
        res.sendFile(path.join(__dirname, 'views/api', 'index.html'))
    });
});


app.get('/error', (req, res) => {
    throw new Error('barf?');
});
app.use(errorhandler); // has to be at the end of app.js for... reasons?


module.exports = app;