const moment = require('moment-timezone');
const os = require('os');
const env = require('./../env.js');
const { MongoClient } = require('mongodb');


const client = new MongoClient(env.mongoDbConnectionString);

const logger = (req, res, next) => {
    
    const protocol = req.protocol;
    const host = req.get('host');
    const url = req.originalUrl;
    const time = moment.utc().format();
    const user = os.userInfo();


    console.log(`${time} (uid: ${user.uid}, name:${user.username}): ${protocol}://${host}${url}`);
    
    client.connect((err, client) => {
        if (err)
            return;

        const user = os.userInfo();
        let obj = {
            time: moment.utc().format(),
            uid: user.uid,
            username: user.username,
            url: `${protocol}://${host}${url}`,
        };

        let dbo = client.db(env.databaseName);
        dbo.collection('trace').insertOne(obj, (err, result) => {
            if (err)
                return;

            client.close();
        });
    });


    next();
};


module.exports = logger;