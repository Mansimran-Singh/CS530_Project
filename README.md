# Voluntary Spam App

The Voluntary Spam App is a framework designed to achieve the following ends. The primary goal of this framework is to allow Event Subscribers to receive notifications to their mobile device about events that may be of interest to them. These Event Subscribers can identify themselves with a set of categories relating to their interest in how they wish to interact with these events. An Event Coordinator will be able to schedule and categorize events on a calendar interface. From the same interface, the Event Coordinator will be able to send push notifications about those events to the phones of Event Subscribers that have selected categories relating to that event.

## Backlog

*Trello Link:* [User stories](https://trello.com/b/a6NauLwf/cs530)

## Calendar info

https://calendar.google.com/calendar/u/0?cid=ZjRiNW5zdG44YzFqbXE2a29mZjJyNjlhc2dAZ3JvdXAuY2FsZW5kYXIuZ29vZ2xlLmNvbQ

Calendar ID
f4b5nstn8c1jmq6koff2r69asg@group.calendar.google.com

https://cs530-beclawski.web.app

<iframe src="https://calendar.google.com/calendar/embed?src=f4b5nstn8c1jmq6koff2r69asg%40group.calendar.google.com&ctz=America%2FNew_York" style="border: 0" width="800" height="600" frameborder="0" scrolling="no"></iframe>

### Installation

required packages:

cd functions
npm install mongodb express mocha chai moment request googleapis@39 date-fns axios --save
npm install -D nodemon

### log out and log back in with new account if previously initialized the project with another

$ firebase logout
$ firebase login

### Firebase init, use legos gmail account

$ npm install -g firebase-tools

$ firebase init hosting

$ firebase init functions

### for local testing

$ firebase serve --only hosting,functions

### for production deployment

$ firebase deploy --only hosting,functions

### for local debugging using emulators

$ firebase emulators:start --inspect-functions

### runs all unit tests

$ npm test  
$ npm run dev

### google calendar notes

https://developers.google.com/calendar/api/quickstart/nodejs

https://developers.google.com/calendar/api/guides/auth

https://console.cloud.google.com/apis/api/calendar-json.googleapis.com/credentials?authuser=2&project=poised-resource-327222

https://console.cloud.google.com/apis/credentials/consent?authuser=2&project=poised-resource-327222


