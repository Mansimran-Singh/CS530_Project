const env = require('./env.js');
const { MongoClient } = require("mongodb");

const client = new MongoClient(env.mongoDbConnectionString);

const db = {};

db.client = client;

db.ping = async () => {
    try {
        await client.connect();
        await client.db(env.databaseName).command({ ping: 1 });

        console.log("Connected successfully to server");

        return true;
    } finally {
        await client.close();
    }
}

module.exports = db;
