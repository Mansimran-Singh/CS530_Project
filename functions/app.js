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


/******************* Shi...... stuff to delete **************************************************************************** */
// const isBrowser = (new Function("try {return this===window;}catch(e){ return false;}"))();
// const isNode = (new Function("try {return this===global;}catch(e){return false;}"))();
// const p = process.env;

// console.log(`${ JSON.stringify(p) }`)
// console.log(`isBrowser: ${isBrowser}`);
// console.log(`isNode:    ${isNode}`);

// const moment = require('moment');
// const { MongoClient } = require("mongodb");
// const client = new MongoClient(env.mongoDbConnectionString);
// client.connect((err, client) => {
//     if (err) {
//         console.error(JSON.stringify(err));
//         return;
//     }

//     const user = os.userInfo();
//     let obj = {
//         time: moment.utc().format(),
//         isBrowser: isBrowser,
//         isNode: isNode,
//         processEnvironment: p,
//     };

//     client.db(env.databaseName).collection('trace').insertOne(obj, (err, result) => {
//         if (err)
//             return;

//         client.close();
//     });
// });

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
app.use('/categories', require('./api/categories/categories'));
app.use('/calendar', require('./api/calendar/calendar'));


app.set('views', './views');
app.engine('ejs', engines.ejs);
app.set('view engine', 'ejs');



app.get('/', (req, res) => {
    db.client.connect((err, client) => {
        if (err !== undefined) {
            res.sendStatus(500);
        }
        if (runningRemotely)
            res.render('./views/pages/index.ejs')
        else
            res.sendFile(path.join(__dirname, 'views/api', 'index.html'))
    });
});

app.get('/team', (req, res) => {
    res.render('pages/team.ejs');
  }
);

app.get('/error', (req, res) => {
    throw new Error('barf?');
});
app.use(errorhandler); // has to be at the end of app.js for... reasons?


module.exports = app;