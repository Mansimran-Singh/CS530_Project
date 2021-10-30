// const express = require('express');
// const router = express.Router();
const env = require('../env');
const db = require('../db');
const moment = require('moment');
const os = require('os');
// const fs = require('fs');
const {google} = require('googleapis');
const { oauth2 } = require('googleapis/build/src/apis/oauth2');

// event colors
// https://developers.google.com/calendar/api/v3/reference/colors/get#.net


// If modifying these scopes, delete token.json.
const SCOPES = [
    // 'https://www.googleapis.com/auth/calendar',	                    // read/write access to Calendars
    'https://www.googleapis.com/auth/calendar.readonly',	        // read-only access to Calendars
    'https://www.googleapis.com/auth/calendar.events',	            // read/write access to Events
    // 'https://www.googleapis.com/auth/calendar.events.readonly',	    // read-only access to Events
    // 'https://www.googleapis.com/auth/calendar.settings.readonly',	// read-only access to Settings
    // 'https://www.googleapis.com/auth/calendar.addons.execute',      // run as a Calendar add-on
];

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
// const TOKEN_PATH = 'token.json';


let calendarApi = {};

calendarApi.SCOPES = SCOPES;

const tokenDBFieldName = 'googleCalendarApiToken';

calendarApi.authorizeAsync =  async function authorizeAsync(credentials) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  return new Promise((resolve, reject) => {
    db.client.connect((err, db) => {
      if (err) {
        reject(credentials);
        return;
      }
        
      let dbo = db.db(env.databaseName);
      dbo.collection('settings').findOne({ name: tokenDBFieldName }, (err, result) => {
        if (result === null || err) {
          reject(credentials);
          return;
        }

        db.close();
        oAuth2Client.setCredentials(result.value);
        resolve(oAuth2Client);
      });
    });
  });
}

/** @deprecated
 *
 * */
calendarApi.getAccessTokenAsync = async function getAccessTokenAsync(oAuth2Client) {
  return new Promise((resolve, reject) => {
    const authUrl = oAuth2Client.generateAuthUrl({ access_type: 'offline', scope: SCOPES, });

    console.log('Authorize this app by visiting this url:', authUrl);
    let code = '';
    oAuth2Client.getToken(code, (err, token) => {
      if (err) {
          console.error('Error retrieving access token', err);
          reject(oAuth2Client);
      }
  
      oAuth2Client.setCredentials(token);

      db.client.connect((err, db) => {
        if (err) {
          reject(oAuth2Client);
          return;
        }
          
        let replacement = {
          name: tokenDBFieldName,
          value: token
        };
        let dbo = db.db(env.databaseName);
        dbo.collection('settings').findOneAndReplace({ name: tokenDBFieldName }, replacement, (err, result) => {
          if (err) {
            reject(oAuth2Client);
            return;
          }
  
          db.close();
          resolve(oAuth2Client);
        });
      });
    });
  });
}

calendarApi.listEventsAsync = async function listEventsAsync(oAuth2Client) {
  return new Promise((resolve, reject) => {
    const calendar = google.calendar({version: 'v3', auth: oAuth2Client});
    const params = {
        calendarId: env.googleCalendar.calendarId,
        // timeMin: (new Date()).toISOString(),
        maxResults: 250,
        singleEvents: true,
        orderBy: 'startTime',
    };
  
    calendar.events.list(params, (err, res) => {
      if (err) {
        console.error('The API returned an error: ' + err);
        console.error(err.stack);
        reject(oAuth2Client);
        return;
      }
    
      const events = res.data.items;
      let results = [];
      let ids = [];
    
      if (events.length) {
        console.log('Upcoming events:');
        events.map((event, i) => {
          const start = event.start.dateTime || event.start.date;
          const end = event.end.dateTime || event.end.date;
          console.log(`${start} - ${event.id} - ${event.summary}`);

          ids.push(event.id);
          results.push({
            id: event.id,
            summary: event.summary,
            description: event.description,
            startTime: start,
            endTime: end,
            htmlLink: event.htmlLink,
            event: event,
            notifications: [],

            /* tui.Calendar required fields, see https://nhn.github.io/tui.calendar/latest/Schedule */
            calendarId: env.googleCalendar.calendarId,
            title: event.summary,
            category: "time",
            start: start,
            end: end,
          });
        });

      } else {
        console.log('No upcoming events found.');
      }
    
      db.client.connect((err, db) => {
        if (err) {
          reject(oAuth2Client);
          return;
        }

        let dbo = db.db(env.databaseName);
        dbo.collection('message_history').find({'eventId': { $in: ids }}).toArray((err, dbEvents) => {
          if (err) {
              reject(oAuth2Client);
              return;
          }

          for (let event of results) {
            let n = dbEvents.filter(x => x.id === event.id)[0];
            if (n)
              event.notifications = n.notifications;
            let c = event.notifications?.length ?? 0;
            let a = c;
          }
          

          resolve(results);
        });
      });      
    });
  });
}

calendarApi.insertEventAsync = async function insertEventAsync(oAuth2Client, params) {
  return new Promise((resolve, reject) => {
    const calendar = google.calendar({version: 'v3', auth: oAuth2Client});
  
    calendar.events.insert({calendarId: env.googleCalendar.calendarId, resource: params}, (err, res) => {
      if (err) {
        console.error('The API returned an error: ' + err);
        reject(err);
        return;
      }

      let event = res.data;
      event.notifications = [];
      event.category = params.category;

      db.client.connect((err, db) => {
        if (err) {
          reject(oAuth2Client);
          return;
        }

        let dbo = db.db(env.databaseName);
        dbo.collection('events').insertOne(event, (err, result) => {
          if (err) {
            reject(oAuth2Client);
            return;
          }

          db.close();
          resolve({eventId: result.insertedId.toString()});
        });

      });
    });
  });
}

calendarApi._googleLoginAnd = async function _googleLoginAnd(func, resolve, reject, params) {
  calendarApi.authorizeAsync(env.googleCalendar.getCredentials())
    .then((value) => {
      func(params != null ? params : value)
        .then(
          (value) => resolve(value), 
          (reason) => reject(reason)
        );
    }, 
    (reason) => {
      calendarApi.getAccessTokenAsync(reason)
        .then((value) => {
          func(params != null ? params : value)
            .then(
              (value) => resolve(value), 
              (reason) => reject(reason)
            );
        }, (reason) => {
          res.status(500).send('Unable to get Google authentication token');
        });
    });
}

calendarApi.storeToken = async function storeToken(token, type) {

  return new Promise((resolve, reject) => {
    db.client.connect((err, db) => {
      if (err) {
        reject('Unable to connect to database');
        return;
      }

      let replacement = {
        name: tokenDBFieldName,
        value: token,
        type: type,
        time: moment.utc().format(),
      };
      let dbo = db.db(env.databaseName);
      dbo.collection('settings').findOneAndReplace({name: tokenDBFieldName}, replacement, {"upsert": true}, (err, result) => {
        if (err) {
          reject('Unable to save access token, please try again');
          return;
        }
        db.close();
        resolve(true);
      });
    });
  });
}


module.exports = calendarApi;