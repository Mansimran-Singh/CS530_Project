const moment = require('moment-timezone');
const os = require('os');
const env = require('./../env');
const { MongoClient } = require("mongodb");

const client = new MongoClient(env.mongoDbConnectionString);


const errorhandler = (err, req, res, next) => {

    const protocol = req.protocol;
    const host = req.get('host');
    const url = req.originalUrl;
    const time = moment.utc().format();
    const user = os.userInfo();


    console.error(`${time} (uid: ${user.uid}, name:${user.username}): ${protocol}://${host}${url}`);
    console.error(`${err}`);
    
    client.connect((err1, client1) => {
        if (err1) {
            console.error(err1);
            return;
        }

        const user = os.userInfo();
        let obj = {
            time: moment.utc().format(),
            uid: user.uid,
            username: user.username,
            url: `${protocol}://${host}${url}`,
            message: err.message,
            stack: err.stack,
        };

        let dbo = client.db(env.databaseName);
        dbo.collection('errors').insertOne(obj, (err2, result2) => {
            if (err2) {
                console.error(err2);
                return;
            }

            client.close();
        });
    });


    next();
};


module.exports = errorhandler;