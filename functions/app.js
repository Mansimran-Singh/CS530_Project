// standard modules
const express = require('express');
const env = require('./env.js');
const app = express();
const path = require('path');
const os = require('os');
const engines = require('consolidate');
const bodyparser = require('body-parser')
const moment = require('moment-timezone');

// local modules
const db = require('./db');
const logger = require('./middleware/logger');
const errorhandler = require('./middleware/errorhandler');

// configuration
const port = env.httpPort ? env.httpPort : 5002;


// middleware registration
app.use(logger);

app.use(bodyparser.urlencoded({extended:false}));
app.use(bodyparser.json());

app.locals.moment = moment;

/********************************************************************************************** */
// main application
// this switch in in place because when running locally, node needs app.listen, however
// in the firebase hosting, it creates a conflict so it should not be used. We are using
// the GCLOUD_PROJECT switch in the environment process as the indicator.

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
app.use('/api/events', require('./api/events/events'));
app.use('/api/calendar', require('./api/calendar/calendar'));
app.use('/calendar', require('./controllers/calendar'));


// view engine setup
app.set('views', './views');
app.engine('ejs', engines.ejs);
app.set('view engine', 'ejs');



// main web view routes
app.get('/', (req, res) => {
    db.client.connect((err, client) => {
        if (err !== undefined) {
            res.sendStatus(500);
        }

        res.render('pages/index.ejs')
    });
});

app.get('/about', (req, res) => {
    res.render('pages/about.ejs');
  }
);

app.get('/privacy', (req, res) => {
      res.render('pages/privacy.ejs');
  }
);

app.get('/error', (req, res) => {
    throw new Error('barf?');
});


 // This has to be at the end of app.js for... reasons?
app.use(errorhandler);

module.exports = app;