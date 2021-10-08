const express = require('express');
const router = express.Router();
const env = require('./../../../env');
const { MongoClient } = require("mongodb");


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

router.post('/subscribe', (req, res) => {
    const deviceid = req.body.deviceid;
    const categories = req.body.categories;

    // TODO: finish
    res.sendStatus(500);
});

module.exports = router;


// const express = require('express');
// const env = require('./../env.js');
// const { MongoClient } = require("mongodb");
// const app = express();

// module.exports = (app) => {
//     app.get('/categories', (req, res) => {
//         const client = new MongoClient(env.mongoDbConnectionString);
//         client.connect((err, db) => {
//             if (err)
//                 throw err;
            
//             let dbo = db.db(env.databaseName);
//             dbo.collection('categories').find({}).toArray((err, result) => {
//                 if (err)
//                     throw err;

//                 db.close();
//                 res.json(result);
                
//             });
//         });


//         // db.client.connect((err, client) => {
//         //     if (err !== undefined) {
//         //         res.sendStatus(`Error occured while sending notification: ${JSON.stringify(err)}`); // TODO: remove before prod
//         //     }
//         //     res.send(`Notification sent`);
//         // });
//     });

// }