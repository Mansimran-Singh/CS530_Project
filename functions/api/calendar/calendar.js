const express = require('express');
const router = express.Router();
const calendarApi = require("../../model/calendar");
const moment = require("moment");
const env = require("../../env.js");

const {google} = require('googleapis');
const { oauth2 } = require('googleapis/build/src/apis/oauth2');
const {resolve} = require("path");


router.use(express.json());


// https://developers.google.com/calendar/api/v3/reference/events/list
router.get('/list', (req, res) => {
	res.redirect(302, '/api/events' /*+ req.path*/);
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
router.post('/create', (req, res) => {
	res.redirect(302, '/api/events' + req.path);
});

// https://developers.google.com/calendar/api/v3/reference/events/get
// usage: http://localhost:5001/api/calendar/get/ja3ac1m7aba7lf9cturv0gflug
router.get('/get/:id', (req, res) => {
	res.redirect(302, '/api/events/' + req.params.id);
});

// https://developers.google.com/calendar/api/v3/reference/events/update
// usage: http://localhost:5001/api/calendar/delete/3v54j0b5b8asnu5v8vmu6mjd3p
router.delete('/delete/:id', (req, res) => {
	res.redirect(303, '/api/events/' + req.params.id);
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
router.post('/update', (req, res) => {

	res.status(405).send('use PUT /api/events/:id');
});



module.exports = router;