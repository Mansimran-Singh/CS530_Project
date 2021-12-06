const express = require('express');
const router = express.Router();
const env = require('./env.js');
const db = require('./db');
const request = require('request');
const moment = require('moment-timezone');
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
//      http://localhost:5001/notify/previousByCategory?categories=Volunteer,Uncat
//      http://localhost:5001/notify/previousByCategory?categories=Volunteer&category=Uncat
router.get('/previousByCategory/:categories?', (req, res) => {
   
    let categories = req.params.categories || req.query.categories || req.query.category;
    if (!categories) {
        res.sendStatus(400);
        return;
    }

    if (typeof categories === 'string' || categories instanceof String) {
        categories = categories.split(',');
    }

    if (!Array.isArray(categories)) {
        res.sendStatus(400);
        return;
    }

    db.client.connect((err, client) => {
        if (err) {
            res.status(500).send(`${JSON.stringify(err)}`);
            return;
        }

        let query = {
            $or: [
                { 'categories': { $exists: true, $in: categories } },
                { 'category': { $exists: true, $in: categories } }, // TODO: remove when data cleanup is complete
            ]
        };

        if (categories.includes('Uncat')) {
            query.$or.push({ 'categories': { $exists: true, $eq: [] } });
        }

        let collection = client.db(env.databaseName).collection('message_history');
        collection.find(query).toArray((err1, result) => {
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
//     "categories": ["Uncat", "Volunteer"], //  "Uncat" or "Uncat","Volunteer"
//     "title": "HI EVERYONE",
//     "message": "Live during demo"
// }
router.post('/send', (req, res) => {
    const userInfo = os.userInfo();

    // Dan, we can use ?? operator again after upgrading node to v16 in GCLOUD.
    const eventId = req.body.eventid ?? null;
    const title = req.body.title ?? 'Spam Notification';
    const message = req.body.message ?? null;
    const categories = JSON.parse(req.body.categories) ?? [];

    let condition = '';

    // ** mobile app currently is not subscribing to topics per category (that part is commented out), it only uses "Uncat"
    // ** https://firebase.google.com/docs/cloud-messaging/android/topic-messaging#node.js_3
    // const conditionsLimit = 5;
    // if(categories.length > 0){
    //     categories.forEach( (category, index) => {
    //         if(index < conditionsLimit){
    //             condition += `'${category}' in topics`;
    //             if(index < categories.length -1 && index < conditionsLimit -1){
    //                 condition += ' || ';
    //             }
    //         }
    //     });
    // }
    // else
    // {
       condition = `'Uncat' in topics`;
    // }

    let url = env.firebaseMessageEndpoint;
    let headers = {
        'content-type': 'application/json',
        'Authorization': `key=${env.firebaseMessagePrivateKey}`
    };
    let body = {
        priority: 'high',
        // notification: {
        //     title: title,
        //     body: message,
        // },
        data: {
            eventId: eventId,
            title: title,
            body: message,
            categories: categories,
	          click_action: "FLUTTER_NOTIFICATION_CLICK"
        },
        condition: condition,
	      content_available: true
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
                categories: categories,
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