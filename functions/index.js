const functions = require("firebase-functions");
const express = require('express');
const engines = require('consolidate');
// const path = require("path");
const app = express();

// local modules
const db = require('../db');
const logger = require('../middleware/logger');

// additional modules
// require('./notification')(app);
app.use('/notify', require('./notification'));
app.use('/api/categories', require('./api/categories/categories'));

// middleware registration
app.use(logger);

app.set('views', './views');
app.engine('hbs', engines.handlebars);
app.set('view engine', 'hbs');
app.get('/', (req, res) => {
	db.client.connect((err, client) => {
		if (err !== undefined) {
			res.sendStatus(401); // TODO: remove before prod
		}

		res.render('index.hbs');
	});
});

app.get('/test', (req, resp) => {
	resp.json({result: "negative"});
})

exports.app = functions.https.onRequest(app);