// standard modules
const express = require('express');
const env = require('./env.js');
const app = express();
const path = require('path');
const os = require('os');
const engines = require('consolidate');


// local modules
const db = require('./db');
const logger = require('./middleware/logger');
const errorhandler = require('./middleware/errorhandler');


// configuration
const port = env.httpPort ? env.httpPort : 5002;


// middleware registration
app.use(logger);

/********************************************************************************************** */
// main application
const runningRemotely = process.env.GCLOUD_PROJECT;
if (!runningRemotely) {
    app.listen(port, () => {
        console.log(`Example app listening at ${env.hostAddress}:${port}`);
    });

    // static file location, not needed with firebase hosting
    app.use(express.static(path.join(__dirname, './../public')));
}


// additional routes
app.use('/notify', require('./notification'));
app.get('/categories',  (req, res) => {
    res.redirect('/api/categories', 302);
});
app.use('/api/categories', require('./api/categories/categories'));

app.use('/api/calendar', require('./api/calendar/calendar'));

app.set('views', './views');
app.engine('ejs', engines.ejs);
app.set('view engine', 'ejs');



app.get('/', (req, res) => {
    db.client.connect((err, client) => {
        if (err !== undefined) {
            res.sendStatus(500);
        }
        if (runningRemotely)
            res.render('pages/index.ejs')
        else
            res.sendFile(path.join(__dirname, 'views/api', 'index.html'))
    });
});

app.get('/about', (req, res) => {
    res.render('pages/about.ejs');
  }
);

app.get('/error', (req, res) => {
    throw new Error('barf?');
});
app.use(errorhandler); // has to be at the end of app.js for... reasons?


module.exports = app;