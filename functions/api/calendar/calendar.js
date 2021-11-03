const express = require('express');
const router = express.Router();
const calendarApi = require("../../model/calendar");
const moment = require("moment");
const env = require("../../env.js");

const {google} = require('googleapis');
const { oauth2 } = require('googleapis/build/src/apis/oauth2');


router.use(express.json());


// https://developers.google.com/calendar/api/v3/reference/events/list
router.get('/list', (req, res) => {
	calendarApi._googleLoginAnd(calendarApi.listEventsAsync, (value) => res.json(value), (reason) => res.sendStatus(500))
});

// https://developers.google.com/calendar/api/v3/reference/events/insert
router.post('/create', (req, res) => {
	// _googleLoginAnd(insertEventAsync, (value) => res.json(value), (reason) => res.sendStatus(500))

	const tz = req.body.tz || Intl.DateTimeFormat().resolvedOptions().timeZone;
	const start = moment().format();
	const end = moment(start).add(30, 'minutes').format();

	let params = {
		sendUpdates: 'all',
		colorId: req.body.colorId || null,
		start: { dateTime: req.body.startTime || start, timeZone: tz, },
		end: { dateTime: req.body.endTime || end, timeZone: tz, },
		summary: req.body.summary || 'test',
		description: req.body.description || 'test event',
		category: req.body.category || 'Volunteer'
	};


	calendarApi.authorizeAsync(env.googleCalendar.getCredentials())
		.then(
			(value) => {
				calendarApi.insertEventAsync(value, params)
					.then(
						(value) => { res.json(value); },
						(reason) => { res.sendStatus(500); }
					);
			},
			(reason) => {
				calendarApi.getAccessTokenAsync(reason)
					.then((value) => {
						calendarApi.insertEventAsync(value, params)
							.then(
								(value) => { res.json(value); },
								(reason) => { res.sendStatus(500); }
							);
					}, (reason) => {
						res.status(500).send('Unable to get Google authentication token');
					});
		});
});

// https://developers.google.com/calendar/api/v3/reference/events/get
// router.get('/get/:id', (req, res) => {
// 	const eventId = req.params.id;

// 	calendarApi.authorizeAsync(env.googleCalendar.getCredentials())
// 		.then(
// 			(value) => {

// 				let params = {
// 					calendarId: env.googleCalendar.calendarId,
// 					resource: {
// 						eventId: eventId,
// 					},
// 				};

// 				const calendar = google.calendar({version: 'v3', auth: value});
// 				calendar.events.get(params, (err, res1) => {
// 					if (err) {
// 						console.error(err.stack);
// 						reject(oAuth2Client);
// 						return;
// 					  }

// 					  res.json(res1.data);
// 					  return;
// 				});

				
// 			},
// 			(reason) => {
// 				calendarApi.getAccessTokenAsync(reason)
// 					.then((value) => {


// 						// TODO: finish
// 						res.status(599).send('not implemented');




// 					},
// 					(reason) => {
// 						res.status(500).send('Unable to get Google authentication token');
// 					});
// 		});

// 	// res.status(599).send('not implemented');
// });

// https://developers.google.com/calendar/api/v3/reference/events/update
router.delete('/delete/:id', (req, res) => {

	res.status(599).send('not implemented');
});

// https://developers.google.com/calendar/api/v3/reference/events/delete
router.post('/update/:id', (req, res) => {

	res.status(599).send('not implemented');
});



module.exports = router;