const express = require('express');
const env = require("../env.js");
const {google} = require("googleapis");
const router = express.Router();
const calendarApi = require("../model/calendar");
const db = require("./../db");


// renders the page for viewing
router.get('/', (req, res) => {

	db.client.connect((err, client) => {
		if (err !== undefined) {
			res.render('pages/error.ejs', {code: 500, message: "MongoDB Connection Failed, try again."});
		}
		else {
			let dbo = client.db(env.databaseName);
			dbo.collection('categories').find({}).toArray((err, result) => {
				if (err) {
					res.render('pages/error.ejs', {code: 500, message: "Failed to retrieve categories."});
					return;
				}
				client.close();

				let categories = result;

				calendarApi.authorizeAsync(env.googleCalendar.getCredentials())
				.then((value) => {
						// ** show it if authorized
						res.render('pages/calendar.ejs', {categories: categories});
					},
					(reason) => {
						// ** redirect to authorize
						res.render('pages/calendar-not-connected.ejs')
					});
			});
		}
	});
});


router.get('/connected', (req, res) => {
	res.render('pages/calendar-connected.ejs');
});


// because of how we are using Google Calendar API authentication,
// the link needs to be updated occasionally
router.get('/link', (req,res) => {
	calendarApi.authorizeAsync(env.googleCalendar.getCredentials())
		.then((value) => {
				console.log('authorized');
				res.render('pages/calendar-connected.ejs')
			},
			(reason) => {
				console.log('unauthorized');

				const {client_secret, client_id, redirect_uris} = env.googleCalendar.getCredentials().installed;
				const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
				const authUrl = oAuth2Client.generateAuthUrl({access_type: 'offline', scope: calendarApi.SCOPES,});

				res.writeHead(302, {
					'Location': authUrl
				});

				res.end();
			});
});


// resets the authencation token
router.get('/token/set', (req, res) => {
	const {client_secret, client_id, redirect_uris} = env.googleCalendar.getCredentials().installed;
	const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

	let code = req.query.code.toString();
	if (!code) {
		res.status(400).send('No authentication code provided in query string');
		return;
	}


	oAuth2Client.getToken(code, (err, token) => {
		if (err) {
			console.error('Error retrieving access token', err);
			res.status(500).send('Unable to set access token');
			return;
		}

		oAuth2Client.setCredentials(token);

		calendarApi.storeToken(  token, "get").then(
			(result) => {
				res.writeHead(302, {
					'Location': '/calendar/connected'
				});
				res.end();
			},
			(error) => {
				console.log(error);

				res.render('pages/error.ejs', {code: 500, message: error});
			}
		);

	});
});


router.use(express.json());

module.exports = router;