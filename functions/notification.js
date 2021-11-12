const express = require('express');
const router = express.Router();
const env = require('./env.js');
const db = require('./db');
const request = require('request');
const moment = require('moment');
const os = require('os');


// enable JSON serialization in requests
router.use(express.json());


// requests can be sent in one of two formats:
//      http://localhost:5001/notify/previousByEvent?id=123,987
//      http://localhost:5001/notify/previousByEvent?id=123&id=987
router.get('/previousByEvent/:id', (req, res) => {
   
    let eventid = req.params.id || req.query.id;
    if (!eventid) {
        res.status(400).send('No event ID provided');
        return;
    }

    if (typeof eventid === 'string' || eventid instanceof String) {
        eventid = eventid.split(',');
    }

    if (!Array.isArray(eventid)) {
        res.sendStatus(400);
        return;
    }

    db.client.connect((err, client) => {
        if (err) {
            res.status(500).send(`${JSON.stringify(err)}`);
            return;
        }

        //{category: {$exists: true,  $in: ["All", "Volunteer"]}}
        let collection = client.db(env.databaseName).collection('message_history');
        collection.find({'eventid': {$exists: true,  $in: eventid}}).toArray((err1, result) => {
            if (err1) {
                res.status(500).send(`${JSON.stringify(err1)}`);
                return;
            }

            res.send(result);
        });
    });
});


// requests can be sent in one of two formats:
//      http://localhost:5001/notify/previousByCategory?category=Volunteer,All
//      http://localhost:5001/notify/previousByCategory?category=Volunteer&category=All
router.get('/previousByCategory/:category?', (req, res) => {
   
    let category = req.params.category || req.query.category;
    if (!category) {
        res.sendStatus(400);
        return;
    }

    if (typeof category === 'string' || category instanceof String) {
        category = category.split(',');
    }

    if (!Array.isArray(category)) {
        res.sendStatus(400);
        return;
    }

    db.client.connect((err, client) => {
        if (err) {
            res.status(500).send(`${JSON.stringify(err)}`);
            return;
        }

        let collection = client.db(env.databaseName).collection('message_history');
        collection.find({'category': {$exists: true,  $in: category}}).toArray((err1, result) => {
            if (err1) {
                res.status(500).send(`${JSON.stringify(err1)}`);
                return;
            }

            res.send(result);
        });
    });
});


// sent a notification to the users
// http://localhost:5001/notify/send
// request body:
// {
//     "eventid": "798aie9ik05fkg9repr6jcnfjc",
//     "category": "Uncat",
//     "title": "HI EVERYONE",
//     "message": "Live during demo"
// }
router.post('/send', (req, res) => {
    const userInfo = os.userInfo();

    // Dan, don't use ?? operator here. You keep making this mistake. GCLOUD isn't using ES6 for some ungodly reason.
    const eventId = req.body.eventid ? req.body.eventid : null;
    const category = req.body.category ? req.body.category : 'Uncat';
    const title = req.body.title ? req.body.title : 'Spam Notification';
    const message = req.body.message ? req.body.message : null;

    let url = env.firebaseMessageEndpoint;
    let headers = {
        'content-type': 'application/json',
        'Authorization': `key=${env.firebaseMessagePrivateKey}`
    };
    let body = {
        to: `/topics/${category}`,
        priority: 'high',
        notification: {
            title: title,
            body: message,
        },
        data: {
            eventId: eventId
        }
    };

    request.post({url: url, json: true, headers: headers, body: body, }, (err, response, responseBody) => {
        if (err || response.statusCode !== 200) {
            res.status(500).send({
                url: url,
                body: body,
                statusCode: response.statusCode,
                message: response.statusMessage,
                
            });
            return;
        }

        db.client.connect((err, client) => {
            if (err) {
                res.status(500).send(`Error occurred while sending notification: ${JSON.stringify(err)}`);
                return;
            }

            let obj = {
                time: moment.utc().format(),
                url: url,
                body: body,
                
                username: userInfo.username,

                eventId: eventId,
                category: category,
                title: title,
                message: message,
            };

            let dbo = client.db(env.databaseName);
            dbo.collection('message_history').insertOne(obj, (err, result) => {
                if (err) {
                    res.status(500).send(`Error occurred while sending notification: ${JSON.stringify(err)}`);
                    return;
                }
    
                client.close();
                res.status(200).json(result);
            });
        });
    });

});

module.exports = router;