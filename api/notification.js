const express = require('express');
const env = require('./../env.js');
const db = require('./db');
const app = express();

module.exports = function(app) {
    app.get('/notify', (req, res) => {
        db.client.connect((err, client) => {
            if (err !== undefined) {
                res.sendStatus(`Error occurred while sending notification: ${JSON.stringify(err)}`); // TODO: remove before prod
            }
            res.send(`Notification sent`);
        });
    });

}