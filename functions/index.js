const functions = require("firebase-functions");

const app = require('./app')

exports.app = functions.https.onRequest(app);

// app.get('/', (req, res) => {
// 	db.client.connect((err, client) => {
// 		if (err !== undefined) {
// 			res.sendStatus(401); // TODO: remove before prod
// 		}

// 		res.render('index.ejs');
// 	});
// });
