const express = require('express');
const router = express.Router();
const env = require('./../../env');
const db = require('./../../db');

const calendarApi = require("../../model/calendar");
const moment = require('moment-timezone');
const {google} = require("googleapis");
const axios = require('axios');


router.use(express.json());

// https://developers.google.com/calendar/api/v3/reference/events/list
// usage: http://localhost:5001/api/events
// usage: http://localhost:5001/api/events?categories=Volunteer,Community
// GET all
router.get('/', async function (req, res) {
	let categories = req.body.categories || req.query.categories || req.body.category || req.query.category;
	if (typeof categories === 'string' || categories instanceof String) {
		categories = categories.split(',');
	}

	var mongoEvents = null;

	if (categories) {
		let query = {
            $or: [
                { 'categories': {$exists: true,  $in: categories} }
            ]
        };

		await db.client.connect();
		mongoEvents = await db.client
			.db(env.databaseName)
			.collection('events')
			.find(query)
			.project({
				id: true,
				summary: true,
				categories: true
			})
			.toArray();
	}

	calendarApi.authorizeAsync(env.googleCalendar.getCredentials())
		.then((oAuthClient) => {
			// ** authorized
			calendarApi.listEventsAsync(oAuthClient).then(
				(results) => {
					let filteredResults = [];

					// if we're filtering
					if (categories) {
						categories = [...new Set(categories)];

						for (var r of results) {
							let mongoEvent = mongoEvents.find(x => x.id === r.id);
							r.eventCategories = mongoEvent?.category || mongoEvent?.categories || null;

							if (mongoEvent) {
								if (categories?.some(x => r.eventCategories?.includes(x)) || (categories.includes('Uncat') && (r.eventCategories === null || r.eventCategories === undefined))) {
									filteredResults.push(r);
								}
							}

						}
						res.send(filteredResults);
						return;
					}

					res.send( results );
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
// 	"is_allday": "",  // unset for false
// 	"eventId":"",
// 	"summary":"test",
// 	"startDate":"2021-11-03",
// 	"startTime":"09:30:00",
// 	"endDate":"2021-11-03",
// 	"endTime":"10:30:00",
// 	"categories": "["Volunteer","Community"]"
// }
// CREATE
router.post('/', (req, res) => {
	const tz = req.body.tz || "America/New_York";
	const start = moment().format();
	const end = moment(start).add(30, 'minutes').format();

	let categories = JSON.parse(req.body.categories);

	if(categories.length === 0){
		categories.push("Uncat");
	}

	let params = {
		sendUpdates: 'all',
		colorId: req.body.colorId || null,
		start: { dateTime: req.body.startTime || start, timeZone: tz, },
		end: { dateTime: req.body.endTime || end, timeZone: tz, },
		summary: req.body.summary || 'No Title provided',
		description: req.body.description || 'No Description provided',
		categories: categories
	};

	// this causes errors with moment in date formats. why was this added and is it necessary? -- DAC
	// the web app is not sending date as js date string, it splits in into date and time fields, that why this is here
	if (req.body.startTime) {
		params.start = {
			dateTime: moment.tz(req.body.startDate + " " +  req.body.startTime, tz).format(),
			timeZone: tz
		}
	}
	else if(req.body.startDate) {
		params.start = {
			date: req.body.startDate,
			timeZone: tz }
	}

	if (req.body.endTime) {
		params.end = {
			dateTime: moment.tz(req.body.endDate + ' ' + req.body.endTime, tz).format(),
			timeZone: tz
		}
	}
	else if(req.body.endDate) {

		params.end = {
			// ** hack for GCal
			// fixing end time being 1 day short
			// *****
			date: moment(req.body.endDate).add(1, "days").format("YYYY-MM-DD"),
			timeZone: tz
		}
	}


	calendarApi.authorizeAsync(env.googleCalendar.getCredentials())
		.then(
			(value) => {
				calendarApi.insertEventAsync(value, params)
					.then(
						(value) => { 

							let data = {
								"eventid": null, //value.eventId,
								"categories": JSON.stringify(params.categories),
								"title": "New event created",
								"message": params.summary
							};
							let url = `${req.protocol}://${req.get('host')}/notify/send`;
						
							axios.post(url, data)
								.then((res) => {
									res.json(value);
								})
								.catch((err) => {
									res.json(value);
								});
						},
						(reason) => { res.status(500).send(reason); }
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
				calendar.events.get({ calendarId: env.googleCalendar.calendarId, eventId: eventId,}, (err, remoteResult) => {
					if (err) {
						console.error(err.stack);
						reject(oAuth2Client);
						return;
					}

					// ** hack
					// fixing end time stretching into next day
					// for example a one day GCal all-day event will be returned as
					// starting on 2025-11-02 and
					// ending on 2025-11-03, toast calendar would show it as a two day event
					// *****
					if(remoteResult.data.end.date){
						remoteResult.data.end.date = moment(remoteResult.data.end.date).subtract(1, "days").format("YYYY-MM-DD");
					}

					db.client.connect().then( client => {
						db.client.db(env.databaseName).collection('events').findOne({id: remoteResult.data.id})
							.then(
								localResult => {
									if(localResult){
										remoteResult.data.eventCategories = localResult.categories;
									}
									res.json(remoteResult.data);
								},
									err => {
									res.status(500).send('failed to retrieve local data');
								});

					}, err => {
						res.status(500).send('failed to connect to db');
					})
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
				});
			},
			(reason) => {
				res.status(401).send('request not authorized');
			});

});

// https://developers.google.com/calendar/api/v3/reference/events/update
// usage: http://localhost:5001/api/calendar/update
// body:
// {
// 	"eventId": "ja3ac1m7aba7lf9cturv0gflug",
// 	"tz": "America/New_York",
// 	"colorId": null,
// 	"startDate":"2021-11-03",
// 	"startTime":"09:30:00",
// 	"endDate":"2021-11-03",
// 	"endTime":"10:30:00",
// 	"summary": "CS530",
// 	"description": "Regular class time",
// 	"categories": "["Volunteer","Community"]"
// }
// UPDATE
router.put('/:id', (req, res) => {
	const tz = req.body.tz || "America/New_York";
	if(req.body.eventId == null){
		res.status(400).send('event id is missing');
		return;
	}

	let categories = JSON.parse(req.body.categories);

	if(categories.length === 0){
		categories.push("Uncat");
	}

	const eventId = req.body.eventId;
	const params = {
		calendarId: env.googleCalendar.calendarId,
		eventId: eventId,
		resource: {}
	};

	if (req.body.colorId) params.resource.colorId = req.body.colorId;


	/**
	 * hack for google calendar
	 * add 1 day to event end
	 * we are doing the opposite on the front-end
	 */
	let endDate = moment(req.body.endDate).add(1, "days").format("YYYY-MM-DD");


	if (req.body.is_allday === undefined)
	{ params.resource.start = { dateTime: moment.tz(req.body.startDate + " " +  req.body.startTime, tz).format()} }
	else if(req.body.startDate)
	{ params.resource.start = { date: req.body.startDate, timeZone: tz } }

	if (req.body.is_allday === undefined)
	{ params.resource.end = { dateTime: moment.tz(req.body.endDate + " " + req.body.endTime, tz).format()} }
	else if(req.body.endDate)
	{ params.resource.end = { date: endDate, timeZone: tz } }

	if (req.body.summary) params.resource.summary = req.body.summary;
	if (req.body.description) params.resource.description = req.body.description;
	if (req.body.category) params.resource.category = req.body.category;

	calendarApi.authorizeAsync(env.googleCalendar.getCredentials())
		.then(
			(value) => {
				const calendar = google.calendar({version: 'v3', auth: value});
				calendar.events.update(params, (err, result) => {
					if (err) {
						if (err.code === 410) {
							res.status(err.code).send('event does not exist');
							return;
						}

						console.error(err.stack);
						res.status(err.code).send(err.message);
						return;
					}

					let event = result.data;
					event.categories = categories;

					db.client.connect((err, db) => {
						if (err) {
							res.status(400).send('failed to connect to db');
							return;
						}

						let dbo = db.db(env.databaseName);
						dbo.collection('events').findOneAndReplace({id: result.data.id}, event, {"upsert": true}, (err, result) => {
							if (err) {
								// res.status(400).send('failed to update local event');
								return;
							}

							db.close();
						});
					});

					res.json(result.data);
				});
			},
			(reason) => {
				res.status(401).send('request not authorized');
			});
});

module.exports = router;