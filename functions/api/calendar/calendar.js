const express = require('express');
const router = express.Router();
const env = require('../../env.js');
const db = require('../../db');
const moment = require('moment');
const os = require('os');
// const fs = require('fs');
const {google} = require('googleapis');

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
const TOKEN_PATH = 'token.json';



async function authorizeAsync(credentials) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  return new Promise((resolve, reject) => {
    // fs.readFile(TOKEN_PATH, (err, token) => {
    //   if (err) {
    //       reject(oAuth2Client);
    //       return;
    //   }
    //   oAuth2Client.setCredentials(JSON.parse(token));

    //   resolve(oAuth2Client);
    // });

    db.client.connect((err, db) => {
      if (err) {
        reject(credentials);
        return;
      }
        
      let dbo = db.db(env.databaseName);
      dbo.collection('settings').findOne({ name: 'googleCalendarApiToken' }, (err, result) => {
        if (err) {
          reject(credentials);
          return;
        }

        db.close();
        oAuth2Client.setCredentials(result.value);
        resolve(oAuth2Client);
        return;
      });
    });
  });
}

async function getAccessTokenAsync(oAuth2Client) {
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

      // fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
      //   if (err)  {
      //     console.error(err);
      //     reject(oAuth2Client);
      //   }

      //   console.log('Token stored to', TOKEN_PATH);
      //   resolve(oAuth2Client);
      // });
      db.client.connect((err, db) => {
        if (err) {
          reject(oAuth2Client);
          return;
        }
          
        let replacement = {
          name: 'googleCalendarApiToken', 
          value: token
        };
        let dbo = db.db(env.databaseName);
        dbo.collection('settings').findOneAndReplace({ name: 'googleCalendarApiToken' }, replacement, (err, result) => {
          if (err) {
            reject(oAuth2Client);
            return;
          }
  
          db.close();
          resolve(oAuth2Client);
          return;
        });
      });
      
      
    });
  });
}

async function listEventsAsync(oAuth2Client) {
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
    
      if (events.length) {
        console.log('Upcoming events:');
        events.map((event, i) => {
          const start = event.start.dateTime || event.start.date;
          const end = event.end.dateTime || event.end.date;
          console.log(`${start} - ${event.summary}`);

          results.push({
            id: event.id,
            summary: event.summary,
            description: event.description,
            startTime: start,
            endTime: end,
            htmlLink: event.htmlLink,
            event: event,
          });
        });

      } else {
        console.log('No upcoming events found.');
      }
    
      resolve(results);
    });
  });
}

async function insertEventAsync(oAuth2Client) {
  return new Promise((resolve, reject) => {
    const calendar = google.calendar({version: 'v3', auth: oAuth2Client});
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const start = moment().format();
    const end = moment(start).add(30, 'minutes').format();
  
    let params = {
      sendUpdates: 'all',
      colorId: null,
      start: {
        dateTime: start,
        timeZone: tz,
      },
      end: {
        dateTime: end,
        timeZone: tz,
      },
      summary: 'test',
      description: 'test event',
    };
  
  
    calendar.events.insert({calendarId: env.googleCalendar.calendarId, resource: params}, (err, res) => {
      if (err) {
        console.error('The API returned an error: ' + err);
        reject(err);
      }
  
      resolve(res.data);
    });
  });
}



async function _googleLoginAnd(func, resolve, reject, params) {
  authorizeAsync(env.googleCalendar.getCredentials())
    .then((value) => {
      func(params != null ? params : value)
        .then(
          (value) => resolve(value), 
          (reason) => reject(reason)
        );
    }, 
    (reason) => {
      getAccessTokenAsync(reason)
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











router.use(express.json());

router.get('/list', (req, res) => {
  _googleLoginAnd(listEventsAsync, (value) => res.json(value), (reason) => res.sendStatus(500))
  // authorizeAsync(env.googleCalendar.getCredentials())
  //   .then((value) => {
  //     listEventsAsync(value)
  //       .then(
  //         (value) => { res.json(value); }, 
  //         (reason) => { res.sendStatus(500); }
  //       );
  //   }, 
  //   (reason) => {
  //     getAccessTokenAsync(reason)
  //       .then((value) => {
  //         listEventsAsync(value)
  //           .then(
  //             (value) => { res.json(value); }, 
  //             (reason) => { res.sendStatus(500); }
  //           );
  //       }, (reason) => {
  //         res.status(500).send('Unable to get Google authentication token');
  //       });
  //   });
});


router.post('/create', (req, res) => {
  // _googleLoginAnd(insertEventAsync, (value) => res.json(value), (reason) => res.sendStatus(500))

  authorizeAsync(env.googleCalendar.getCredentials())
    .then((value) => {
      insertEventAsync(value)
        .then(
          (value) => { res.json(value); }, 
          (reason) => { res.sendStatus(500); }
        );
    }, 
    (reason) => {
      getAccessTokenAsync(reason)
        .then((value) => {
          insertEventAsync(value)
            .then(
              (value) => { 
                
                // TODO: save to database


                res.json(value); 
              }, 
              (reason) => { res.sendStatus(500); }
            );
        }, (reason) => {
          res.status(500).send('Unable to get Google authentication token');
        });
    });
});


router.get('/token/link', (req,res) => {
  const {client_secret, client_id, redirect_uris} = env.googleCalendar.getCredentials().installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  const authUrl = oAuth2Client.generateAuthUrl({ access_type: 'offline', scope: SCOPES, });

  res.status(200).send({url: authUrl});
});


// router.post('/token/set', (req, res) => {
//   const {client_secret, client_id, redirect_uris} = env.googleCalendar.getCredentials().installed;
//   const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
//
//   let code = req.body.token;
//   if (!code) {
//     res.status(400).send('No token provided in request body');
//     return;
//   }
//
//   oAuth2Client.getToken(code, (err, token) => {
//     if (err) {
//         console.error('Error retrieving access token', err);
//         res.status(500).send('Unable to set access token');
//         return;
//     }
//
//     oAuth2Client.setCredentials(token);
//
//     storeToken(res, token, "post");
//   });
// });

router.get('/token/set', (req, res) => {
	const {client_secret, client_id, redirect_uris} = env.googleCalendar.getCredentials().installed;
	const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

	let code = req.query.code.toString();
	if (!code) {
		res.status(400).send('No authentication code provided in query string');
		return;
	}


	oAuth2Client.getToken(code, (err, token) => {
		if (err) {
			console.error('Error retrieving access token', err);
			res.status(500).send('Unable to set access token');
			return;
		}

		oAuth2Client.setCredentials(token);

    storeToken(res, token, "get");

	});
});

function storeToken(res, token, type) {
  db.client.connect((err, db) => {
    if (err) {
      res.status(500).send('Unable to connect to database');
      return;
    }

    let replacement = {
      name: 'googleCalendarApiToken',
      value: token,
      type: type,
      time: moment.utc().format(),
    };
    let dbo = db.db(env.databaseName);
    dbo.collection('settings').findOneAndReplace({name: 'googleCalendarApiToken'}, replacement, (err, result) => {
      if (err) {
        res.status(500).send('Unable to save access token');
        return;
      }

      db.close();
      res.status(200).send('Token set');
      return;
    });
  });
}


module.exports = router;