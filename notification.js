const express = require('express');
const router = express.Router();
const env = require('./env.js');
const db = require('./db');

router.get('/:deviceid/:category/:message/', (req, res) => {
    const deviceid = req.params.deviceid;
    const category = req.params.category;
    const message = req.params.message;

    db.client.connect((err, client) => {
        if (err !== undefined) {
            res.sendStatus(`Error occurred while sending notification: ${JSON.stringify(err)}`); // TODO: remove before prod
        }
        res.send(`Notification sent`);
    });
});

module.exports = router;