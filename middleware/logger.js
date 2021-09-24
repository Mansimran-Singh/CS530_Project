const express = require('express');
const moment = require('moment');
const os = require('os');


const logger = (req, res, next) => {
    const protocol = req.protocol;
    const host = req.get('host');
    const url = req.originalUrl;
    const time = moment().format();
    const user = os.userInfo();

    // res.end = (chunk, encoding) => {
    //     console.log(`${time} (uid: ${user.uid} name:${user.username}): ${protocol}://${host}${url}   ${res.statusCode}`);
    // };
    // console.log(`${time} (uid: ${user.uid} name:${user.username}): ${protocol}://${host}${url} ${res.statusCode}`);
    
    next();
};


module.exports = logger;