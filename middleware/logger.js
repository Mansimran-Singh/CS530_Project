const express = require('express');
const moment = require('moment');
const os = require('os');


const logger = (req, res, next) => {
    const protocol = req.protocol;
    const host = req.get('host');
    const url = req.originalUrl;
    const time = moment().format();
    const user = os.userInfo();

    console.log(`${time} -- ${user.uid} -- ${user.username}: ${protocol}://${host}${url}`);
    
    next();
};


module.exports = logger;