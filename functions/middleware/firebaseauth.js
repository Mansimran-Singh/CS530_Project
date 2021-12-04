const express = require('express');
const moment = require('moment');
const os = require('os');
const env = require('./../env.js');
// const { MongoClient } = require('mongodb');

// const client = new MongoClient(env.mongoDbConnectionString);

const firebaseAuth = (req, res, next) => {
    const userId = req.userId;
    if (!userId) {
        // res.status(400).send('No user ID provided');
        // return;
        console.error('No user ID provided');
        // TODO: uncomment the below line to enable booting non-logged in users
        // return;
    }

    // check firebase to ensure the user ID exists here



    next();
};


module.exports = firebaseAuth;