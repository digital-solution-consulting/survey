// MIT License

// Copyright 2019-present, Digital Government Development Agency (Public Organization) 

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
"use strict";
const express = require('express');
const cookieParser = require('cookie-parser');
const winston = require('../../../commons/logger');
const http = require('../../../commons/http');
const appConf = require('../../../config/production.conf');
const promise = require('promise');
const MongoClient = require('mongodb').MongoClient
const redis = require("redis");
const logger = winston.logger;
const router = express.Router();
const mongo = require('../../helpers/mongodb');
const uuidv4 = require('uuid/v4');



router.use(function (req, res, next) {
    logger.info('calling users api ' + req.path);
    logger.debug('request body: ' + JSON.stringify(req.body));
    next();
});

router.use(cookieParser(appConf.cookies.secreteKey, {
    maxAge: 1000 * 60 * 15, // would expire after 15 minutes
    httpOnly: true, // The cookie only accessible by the web server
    signed: appConf.cookies.signed // Indicates if the cookie should be signed
}));

router.use(function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    next();
});

/** Survey Management Services */

function saveSurvey(req, res) {

    console.log(req.body)

    var body = req.body

    var survey = {
        userid: body.userid,
        name: body.name,
        surveyid: body.surveyid,
        version: body.version,
        pages: body.pages
    }

    var filters = {
        userid: body.userid,
        name: body.name,
        surveyid: body.surveyid,
        version: body.version
    };

    mongo.insert(filters, survey, appConf.surveyCollections.survey).then(result => {
            http.success(res, result);
            return true;
        })
        .catch(err => {
            http.error(res, 500, 50000, "mongo error: " + err);
            return false;
        });
}

function createEmptySurvey(req, res) {
    console.log(req.body)

    var body = req.body

    var survey = {
        userid: body.userid,
        name: body.name,
        surveyid: body.surveyid,
        version: body.version
    }

    var filters = {
        userid: body.userid,
        name: body.name,
        surveyid: body.surveyid,
        version: body.version
    };

    mongo.insert(filters, survey, appConf.surveyCollections.survey).then(result => {
            http.success(res, result);
            return true;
        })
        .catch(err => {
            http.error(res, 500, 50000, "mongo error: " + err);
            return false;
        });
}

function getAllSurveysByOwnerId(req, res) {
    if (req.params.ownerid == 'undefined') {
        http.error(res, 400, 40000, "Not found owerid");
        return false;
    }

    var filters = {
        userid: req.params.ownerid
    };

    mongo.find(filters, appConf.surveyCollections.survey).then(results => {
            http.success(res, results);
            return true;
        })
        .catch(err => {
            http.error(res, 500, 50000, "mongo error: " + err);
            return false;
        });

}

function getSurveyById(req, res) {

    console.log(req);

    if (req.params.surveyId == 'undefined') {
        http.error(res, 400, 40000, "Not found owerid");
        return;
    }

    var filters = {
        surveyid: req.params.surveyId
    };

    mongo.find(filters, appConf.surveyCollections.survey).then(results => {
            http.success(res, results[0]);
            return true;
        })
        .catch(err => {
            http.error(res, 500, 50000, "mongo error: " + err);
            return false;
        });
};

function renameSurvey(req, res) {

    var filters = {
        surveyid: req.body.surveyid,
        userid: req.body.userid,
        version: req.body.version
    };


    var data = {
        $set: {
            name: req.body.name,
        }
    };

    mongo.update(filters, data, appConf.surveyCollections.survey).then(results => {
            http.success(res, results);
            return true;
        })
        .catch(err => {
            http.error(res, 500, 50000, "mongo error: " + err);
            return false;
        });
}

function deleteSurvey(req, res) {
    var filters = {
        userid: req.body.userid,
        surveyid: req.body.surveyid,
        version: req.body.version
    };

    mongo.remove(filters, true, appConf.surveyCollections.survey).then(result => {
            http.success(res, {
                affected: result.result.n
            });
            return true;
        })
        .catch(err => {
            http.error(res, 500, 50000, "mongo error: " + err);
            return false;
        });
}

/** Answer Management Services */
function getAllResultsBySurveyId(req, res) {

    var body = req.body;

    var filters = {
        surveyid: req.params.surveyId + "",
        userid: "reserved",
        version: 1
    }

    mongo.find(filters, appConf.surveyCollections.result).then(results => {
            http.success(res, results);
            return true;
        })
        .catch(err => {
            http.error(res, 500, 50000, "mongo error: " + err);
            return false;
        });

}

function getResultById(req, res){

    var body = req.body;

    var filters = {
        userid: "reserved",
        resultid: req.params.resultId
    }

    mongo.find(filters, appConf.surveyCollections.result).then(results => {
        http.success(res, results);
        return true;
    })
    .catch(err => {
        http.error(res, 500, 50000, "mongo error: " + err);
        return false;
    });
}

function saveResult(req, res) {

    var body = req.body;
    var resultid = 'undefined';

    if (body.resultid == 'undefined' || body.resultid == null) {
        resultid = uuidv4();
    } else {
        resultid = body.resultid;
    }

    var filters = {
        surveyid: body.surveyid,
        resultid: resultid,
        userid: "reserved",
        version: 1
    }

    var data = {
        surveyid: body.surveyid,
        resultid: resultid,
        userid: "reserved",
        result: body.result,
        version: 1
    }

    mongo.insert(filters, data, appConf.surveyCollections.result).then(result => {
            http.success(res, result);
            return true;
        })
        .catch(err => {
            http.error(res, 500, 50000, "mongo error: " + err);
            return false;
        });
}

// Survey Management Services
// /v2/survey/:userID
router.get('/surveys/:surveyId', getSurveyById);
router.get('/surveys/owner/:ownerid', getAllSurveysByOwnerId);
router.post('/surveys', saveSurvey);
router.post('/surveys/create', createEmptySurvey);
router.put('/surveys', renameSurvey);
router.delete('/surveys', deleteSurvey);

// /v2/results
router.get('/results/surveyid/:surveyId', getAllResultsBySurveyId); /* requires Question ID */
router.get('/results/:resultId', getResultById)
router.post('/results', saveResult);
module.exports = router;