const express = require('express');
const router = express.Router();
const calendarApi = require("../../model/calendar");
const moment = require("moment");
const env = require("../../env.js");


router.get('/list', (req, res) => {
	calendarApi._googleLoginAnd(calendarApi.listEventsAsync, (value) => res.json(value), (reason) => res.sendStatus(500))
});

router.post('/create', (req, res) => {
	// _googleLoginAnd(insertEventAsync, (value) => res.json(value), (reason) => res.sendStatus(500))

	const tz = req.body.tz ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
	const start = moment().format();
	const end = moment(start).add(30, 'minutes').format();

	let params = {
		sendUpdates: 'all',
		colorId: req.body.colorId ?? null,
		start: { dateTime: req.body.startTime ?? start, timeZone: tz, },
		end: { dateTime: req.body.endTime ?? end, timeZone: tz, },
		summary: req.body.summary ?? 'test',
		description: req.body.description ?? 'test event',
		category: req.body.category ?? 'Volunteer'
	};


	calendarApi.authorizeAsync(env.googleCalendar.getCredentials())
		.then((value) => {
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

router.use(express.json());

module.exports = router;