const express = require('express');
const router = express.Router();
const env = require('./../../env');
const { MongoClient } = require("mongodb");
const db = require('./../../db');

const calendarApi = require("../../model/calendar");
const moment = require("moment");
const {google} = require("googleapis");


// https://developers.google.com/calendar/api/v3/reference/events/list
// GET all
router.get('/:category?', async function (req, res) {
	let categories = req.params.category || req.query.category;
	if (typeof categories === 'string' || categories instanceof String) {
		categories = categories.split(',');
	}

	var mongoEvents = null;

	if (categories) {
		await db.client.connect();
		mongoEvents = await db.client
			.db(env.databaseName)
			.collection('events')
			.find({'category': {$in: categories}})
			.project({
				id: true,
				category: true
			})
			.toArray();
	}

	calendarApi.authorizeAsync(env.googleCalendar.getCredentials())
		.then((oAuthClient) => {
			// ** authorized
			calendarApi.listEventsAsync(oAuthClient).then(
				(results) => {

					// if we're filtering
					if (categories) {
						for (var r of results) {
							r.category = mongoEvents.find(x => x.id == r.id)?.category;
						}
					}

					res.json(results);
				},
				(err) => {
					res.status(401).send('not authorized');
				});
		});
});

// https://developers.google.com/calendar/api/v3/reference/events/insert
// usage: http://localhost:5001/api/calendar/create
// request body:
// {
// 	"tz": "America/New_York",
// 	"colorId": null,
// 	"startTime": "2021-10-25T16:30:00-04:00",
// 	"endTime": "2021-10-25T17:45:00-04:00",
// 	"summary": "CS530",
// 	"description": "Regular class time",
// 	"category": "Community"
// }
// CREATE
router.post('/', (req, res) => {
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

	if (req.body.startTime)
	{ params.start = { dateTime: moment(req.body.startDate + " " +  req.body.startTime).local().format(), timeZone: req.body.tz || "America/New_York" } }
	else if(req.body.startDate)
	{ params.start = { date: req.body.startDate, timeZone: req.body.tz || "America/New_York" } }

	if (req.body.endTime)
	{ params.end = { dateTime: moment(req.body.endDate + ' ' + req.body.endTime).local().format(), timeZone: req.body.tz || "America/New_York" } }
	else if(req.body.endDate)
	{ params.end = { date: req.body.endDate, timeZone: req.body.tz || "America/New_York" } }

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
				res.status(401).send('request not authorized');
			});
});

// https://developers.google.com/calendar/api/v3/reference/events/get
// usage: http://localhost:5001/api/calendar/get/ja3ac1m7aba7lf9cturv0gflug
// GET by id
router.get('/:id', (req, res) => {
	const eventId = req.params.id;

	calendarApi.authorizeAsync(env.googleCalendar.getCredentials())
		.then(
			(value) => {
				const calendar = google.calendar({version: 'v3', auth: value});
				calendar.events.get({ calendarId: env.googleCalendar.calendarId, eventId: eventId,}, (err, results) => {
					if (err) {
						console.error(err.stack);
						reject(oAuth2Client);
						return;
					}

					results.categories =
						res.json(results.data);
				});

			},
			(reason) => {
				res.status(401).send('request not authorized');
			});
});

// https://developers.google.com/calendar/api/v3/reference/events/update
// usage: http://localhost:5001/api/calendar/delete/3v54j0b5b8asnu5v8vmu6mjd3p
// DELETE
router.delete('/:id', (req, res) => {

	const eventId = req.params.id;

	calendarApi.authorizeAsync(env.googleCalendar.getCredentials())
		.then(
			(value) => {
				const calendar = google.calendar({version: 'v3', auth: value});
				calendar.events.delete({ calendarId: env.googleCalendar.calendarId, eventId: eventId,}, (err, result) => {
					if (err) {
						if (err.code === 410) {
							res.status(err.code).send('event does not exist');
						}

						console.error(err.stack);
						reject(oAuth2Client);
						return;
					}

					res.json(result.data);
					return;
				});
			},
			(reason) => {
				res.status(401).send('request not authorized');
			});

});

// https://developers.google.com/calendar/api/v3/reference/events/delete
// usage: http://localhost:5001/api/calendar/update
// body:
// {
// 	"eventId": "ja3ac1m7aba7lf9cturv0gflug",
// 	"tz": "America/New_York",
// 	"colorId": null,
// 	"startTime": "2021-10-25T16:30:00-04:00",
// 	"endTime": "2021-10-25T17:45:00-04:00",
// 	"summary": "CS530",
// 	"description": "Regular class time",
// 	"category": "Community"
// }
// UPDATE
router.put('/:id', (req, res) => {

	if(req.body.eventId == null){
		res.status(400).send('event id is missing');
		return;
	}

	const eventId = req.body.eventId;
	const params = {
		calendarId: env.googleCalendar.calendarId,
		eventId: eventId,
		resource: {}
	};

	if (req.body.colorId) params.resource.colorId = req.body.colorId;

	if (!req.body.is_allday == null)
	{ params.resource.start = { dateTime: moment(req.body.startDate + " " +  req.body.startTime).local().format(), timeZone: req.body.tz || "America/New_York" } }
	else if(req.body.startDate)
	{ params.resource.start = { date: req.body.startDate, timeZone: req.body.tz || "America/New_York" } }

	if (!req.body.is_allday == null)
	{ params.resource.end = { dateTime: moment(req.body.endDate + ' ' + req.body.endTime).local().format(), timeZone: req.body.tz || "America/New_York" } }
	else if(req.body.endDate)
	{ params.resource.end = { date: req.body.endDate, timeZone: req.body.tz || "America/New_York" } }

	if (req.body.summary) params.resource.summary = req.body.summary;
	if (req.body.description) params.resource.description = req.body.description;
	if (req.body.category) params.resource.category = req.body.category;

	calendarApi.authorizeAsync(env.googleCalendar.getCredentials())
		.then(
			(value) => {
				const calendar = google.calendar({version: 'v3', auth: value});
				calendar.events.update(params, (err, res1) => {
					if (err) {
						if (err.code === 410) {
							res.status(err.code).send('event does not exist');
							return;
						}

						console.error(err.stack);
						res.status(err.code).send(err.message);
						return;
					}

					res.json(res1.data);
				});
			},
			(reason) => {
				res.status(401).send('request not authorized');
			});
});

module.exports = router;