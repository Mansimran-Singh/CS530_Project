const express = require('express');
const router = express.Router();
const env = require('./env.js');
const db = require('./db');
const request = require('request');
const moment = require('moment');
const os = require('os');


router.use(express.json());


router.post('/', (req, res) => {
    const userInfo = os.userInfo();

    const eventid = req.body.eventid ?? null;
    const userid = req.body.userid ?? userInfo.uid;
    const deviceid = req.body.deviceid ?? null;
    const category = req.body.category ?? 'ALL';
    const title = req.body.title ?? 'Spam Notification';
    const message = req.body.message ?? null;

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
            deviceid: deviceid,
        }
    };

    request.post({url: url, json: true, headers: headers, body: body, }, (err, response, responseBody) => {
        if (err || response.statusCode !== 200) {
            res.sendStatus(501);
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
                headers: headers,
                body: body,
                
                username: userInfo.username,

                eventId: null,
                uid: userid,
                deviceid: deviceid,
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