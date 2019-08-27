
const express = require('express');
const morgan = require('morgan');
const fs = require('fs')
const path = require('path')
global.appRoot = path.resolve(__dirname);
const user = require('./components/users/index.js');
const survey = require('./components/surveys/index.js');
const auth = require('./components/auth/index.js');
const conf = require('./config/production.conf');
const app = express();



// create a write stream (in append mode)
var accessLogStream = fs.createWriteStream(path.join(__dirname, conf.accessLog), { flags: 'a' })

// setup the logger
app.use(morgan('combined', { stream: accessLogStream }))

app.use(express.json())

app.use('/v1/auth', auth);
app.use('/v1/users', user);
app.use('/v1/survey', survey);

module.exports = app;