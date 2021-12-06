const express = require('express');
const router = express.Router();
const env = require('./../../env');
const { MongoClient } = require("mongodb");

// returns a list of event category types from the database
router.get('/', (req, res) => {
    const client = new MongoClient(env.mongoDbConnectionString);
    client.connect((err, db) => {
        if (err) {
            res.sendStatus(500);
            return;
        }
        
        let dbo = db.db(env.databaseName);
        dbo.collection('categories').find({}).toArray((err, result) => {
            if (err) {
                res.sendStatus(500);
                return;
            }

            db.close();
            res.json(result);
            
        });
    });
});




module.exports = router;
