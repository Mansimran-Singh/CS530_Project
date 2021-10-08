
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const env = require('./../env');

const agg = [
  {
    '$match': {
      'category': {
        '$exists': true, 
        '$ne': null
      }
    }
  },
  {
    '$project': {
      'category': 1
    }
  },
  {
    '$group': {
      '_id': null, 
      'categories': {
        '$addToSet': '$category'
      }
    }
  }
];

MongoClient.connect(env.mongoDbConnectionString,{ useNewUrlParser: true, useUnifiedTopology: true }, function(connectErr, client) {
  assert.equal(null, connectErr);
  const coll = client.db('cs530').collection('message_history');
  coll.aggregate(agg, (cmdErr, result) => {
    assert.equal(null, cmdErr);
  });
  client.close();
});