const env = require('./env.js');
const { MongoClient } = require("mongodb");

const client = new MongoClient(env.mongoDbConnectionString);

const db = {};

db.client = client;

module.exports = db;
