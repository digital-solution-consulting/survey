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

const express = require('express');
const crypto = require('crypto');
const base64url = require('base64url')
const mysql = require('mysql');
const winston = require('../../commons/logger');
const http = require('../../commons/http');
const appConf = require('../../config/production.conf');
const schema = require('./allBookingSchema');
const redis = require("redis");
const logger = winston.logger;
const router = express.Router();
const promise = require('promise');

// Get User profile 
function getProfile(req, res){
    
    var userName = req.USERID;
    var conn = mysql.createConnection({
        host: appConf.MYSQL_host,
        port: appConf.MYSQL_port,
        user: appConf.MYSQL_user,
        password: appConf.MYSQL_password,
        database: appConf.MYSQL_database
    });
    
    conn.connect(function(err) {
        
        logger.debug("Trying...");

        if ( err ) {
            logger.error("Cannot connect to mariadb");
            http.error(res, 500, 50000, "Cannot connect to mariadb");
            conn.end();
            return;
        }else{
            logger.debug("Database connected!");
            logger.debug("Search user name: " + userName);

            const qstr = "SELECT * FROM user_details \
            WHERE user_details.UserId = " + userName;
            //INNER JOIN passwords on user_details.UserId = passwords.Username \
            //WHERE passwords.username = '" + userName + "' and passwords.password = '"+ password +"'";

            conn.query(qstr, function(err, result, fields){
                if ( err ) {
                    logger.error( err );
                    http.error(res, 404, 404000, "Not found user or password");
                    conn.end();
                    return; 
                } else {
                    logger.debug( "result " + JSON.stringify(result));
                    var userDetails = result[0];
                    if ( result[0] != null ) {
                        http.success(res, { 
                            id: userDetails.UserID,
                            name: userDetails.Name,
                            surname: userDetails.Surname,
                            nameEN: userDetails.NameEn,
                            surnameEN: userDetails.SurnameEn,
                            nickName: userDetails.NickName,
                            tel: userDetails.Telephone,
                            email: userDetails.Email,
                            position: userDetails.Position,
                            department: userDetails.Department,
                            devision: userDetails.Segment,
                            level: userDetails.Level,
                            role: userDetails.Role
                        })
                        conn.end();
                    } else {
                        logger.error("invalid user or password");
                        http.error(res, 401, 401000, "invalid user or password");
                        conn.end();
                    }
                }
            });
        }
    });
}

// Get roomate by userid
function getRoommatesByUserId(req, res){

    var userId = req.params.userid;

    var conn = mysql.createConnection({
        host: appConf.MYSQL_host,
        port: appConf.MYSQL_port,
        user: appConf.MYSQL_user,
        password: appConf.MYSQL_password,
        database: appConf.MYSQL_database
    });

    conn.connect(function(err) {
        if ( err ) {
            logger.error("Cannot connect to mariadb");
            http.error(res, 500, 50000, "Cannot connect to mariadb");
            conn.end();
            return;
        } else {
            logger.debug("Database connected!");

            const qstr = "SELECT user_details.UserID,\
             user_details.Name, \
             user_details.Surname, \
             user_details.Position, \
             user_details.Department, \
             user_details.Segment \
             FROM user_details \
            INNER JOIN roommates on user_details.UserId = roommates.UserId \
            WHERE roommates.FriendID = " + userId;

            conn.query(qstr, function(err, result, fields) {
                if ( err ) {
                    logger.error( err );
                    http.error(res, 404, 404000, "not found user or password");
                    conn.end();
                    return; 
                } else {
                    var frientLists = [];
                    for ( i = 0 ;i < result.length; i++ ){
                        frientLists.push({
                            userId: result[i].UserID,
                            name: result[i].Name,
                            surname: result[i].Surname,
                            position: result[i].Position,
                            department: result[i].Department,
                            devision: result[i].Segment,
                            displayName: result[i].Name + " " 
                            + result[i].Surname + " / " 
                            + result[i].UserID + " / "
                            + result[i].Segment
                        });
                    }
                    http.success(res, {frientLists});
                    conn.end();
                }
            });
        }
    });
}

// Get list of available friends
function getRoommates(req, res){

    var conn = mysql.createConnection({
        host: appConf.MYSQL_host,
        port: appConf.MYSQL_port,
        user: appConf.MYSQL_user,
        password: appConf.MYSQL_password,
        database: appConf.MYSQL_database
    });

    conn.connect(function(err) {
        if ( err ) {
            logger.error("Cannot connect to mariadb");
            http.error(res, 500, 50000, "Cannot connect to mariadb");
            conn.end();
            return;
        } else {
            logger.debug("Database connected!");

            const qstr = "SELECT user_details.UserID,\
             user_details.Name, \
             user_details.Surname, \
             user_details.Position, \
             user_details.Department, \
             user_details.Segment \
             FROM user_details \
            INNER JOIN roommates on user_details.UserId = roommates.UserId \
            WHERE roommates.FriendID is null";

            conn.query(qstr, function(err, result, fields) {
                if ( err ) {
                    logger.error( err );
                    http.error(res, 404, 404000, "not found user or password");
                    conn.end();
                } else {
                    var frientLists = [];
                    for ( i = 0 ;i < result.length; i++ ){
                        frientLists.push({
                            userId: result[i].UserID,
                            name: result[i].Name,
                            surname: result[i].Surname,
                            position: result[i].Position,
                            department: result[i].Department,
                            devision: result[i].Segment,
                            displayName: result[i].Name + " " 
                            + result[i].Surname + " / " 
                            + result[i].UserID + " / "
                            + result[i].Segment
                        });
                    }
                    http.success(res, {frientLists});
                    conn.end();
                }
            });
        }
    });
}

// Binding a friend with the same room.
function bindRoommate(req, res){

    var ctx = req.body;
    var newFriend = ctx.friendId;
    var userId = req.params.userid;

    var conn = mysql.createConnection({
        host: appConf.MYSQL_host,
        port: appConf.MYSQL_port,
        user: appConf.MYSQL_user,
        password: appConf.MYSQL_password,
        database: appConf.MYSQL_database
    });

    try {
        conn.connect(function(err) {
            if ( err ) {
                logger.error("Cannot connect to mariadb");
                http.error(res, 500, 50000, "Cannot connect to mariadb");
                return;
            } else {
                logger.debug("Database connected!");
                // user and friend should be available.
                var qstr = "SELECT * FROM roommates"
                + " WHERE  (UserID =  " + userId + " AND friendID is null )"
                + " OR (UserId = " + newFriend + " AND friendID is null)";
                
                conn.query(qstr, function(err, result, fields) {
                    if ( err ) {
                        logger.error( err );
                        http.error(res, 500, 50000, err);
                        conn.end();
                    } else {
                       
                        if( result.length == 2 ){ 
                            //The both of you are available
                            qstr = "UPDATE roommates \
                                        SET FriendID = \"" + newFriend
                                        + "\" WHERE UserID = \"" + userId + "\" and FriendID is null";
                            conn.query(qstr, function(err, result, fields) {
                                if( err ) {
                                    logger.error( err );
                                    http.error(res, 500, 50000, err);
                                    conn.end();
                                } else {
                                    qstr = "UPDATE roommates \
                                        SET FriendID = \"" + userId
                                        + "\" WHERE UserID = \"" + newFriend + "\"";
                                    conn.query(qstr, function(err, result, fields) {
                                        if( err ) {
                                            logger.error( err );
                                            http.error(res, 500, 50000, err);
                                            conn.end();
                                        } else {
                                            http.success(res);
                                            conn.end();
                                        }
                                    });
                                }
                            });
                        } else { 
                            //Someone is not available
                            logger.error( "Someone is not available" );
                            http.error(res, 403, 403000, "Someone is not available");
                            conn.end();
                        }
                    }
                });
            }
        });
    } catch( ex ) {
        http.error(res, 500, 50000, ex);
    }

}

// Unbinding a friend
function unbindRoommate(req, res){

    var userId = req.params.userid;

    var conn = mysql.createConnection({
        host: appConf.MYSQL_host,
        port: appConf.MYSQL_port,
        user: appConf.MYSQL_user,
        password: appConf.MYSQL_password,
        database: appConf.MYSQL_database
    });

    conn.connect(function(err) {
        if ( err ) {
            logger.error("Cannot connect to mariadb");
            http.error(res, 500, 50000, "Cannot connect to mariadb");
            conn.end();
            return;
        } else {
            logger.debug("Database connected!");
            // user and friend should be available.
            var qstr = "SELECT * FROM roommates"
            + " WHERE  (UserID =  " + userId + " AND friendID is not null )";
            
            conn.query(qstr, function(err, result, fields) {
                if ( err ) {
                    logger.error(err);
                    http.error(res, 500, 50000, err);
                    conn.end();
                    return;
                } else {
                    console.log(result);
                    if( result[0] != null && result[0].UserID != 'undefined' && result[0].FriendID != 'undefined' ){ 
                        userId = result[0].UserID;
                        friendId = result[0].FriendID;

                        //The both of you are available
                        qstr = "UPDATE roommates \
                                    SET FriendID = null"
                                    + " WHERE UserID = \"" + userId + "\"";
                        conn.query(qstr, function(err, result, fields) {
                            if( err ) {
                                logger.error(err);
                                http.error(res, 500, 50000, err);
                                conn.end();
                                return;
                            } else {
                                qstr = "UPDATE roommates \
                                    SET FriendID = null"
                                    + " WHERE UserID = \"" + friendId + "\"";
                                conn.query(qstr, function(err, result, fields) {
                                    if( err ) {
                                        logger.error(err);
                                        http.error(res, 500, 50000, err);
                                        conn.end();
                                        return;
                                    } else {
                                        http.success(res);
                                        conn.end();
                                        return;
                                    }
                                });
                            }
                        });
                    } else { 
                        logger.end("Not found an user");
                        http.error(res, 404, 40400, "Not found an user");
                        conn.end();
                        return;
                    }
                }
            });
        }
    });
}

// getAlluser
function getAllUser(conn){

    const qstr = "SELECT \
        t.*,\
        u2.Name  as FName,\
        u2.Surname as FSurname, \
        b.Vehicle, \
        b.Room, \
        b.Remark \
    FROM ( \
        SELECT   \
            u.userID, \
            u.Name, \
            u.Surname, \
            u.Department, \
            u.Segment, \
            r.FriendID FROM user_details as u \
    LEFT JOIN roommates as r \
    ON u.userId = r.UserID \
    ) as t \
    LEFT JOIN user_details as u2 on t.FriendID = u2.UserID \
    LEFT JOIN booking as b on b.userId = t.userId";

    return new promise(function(resolve, reject) {
        conn.query(qstr, function(err, result, fields){
            if ( err ) {
                logger.error( "query failed: " + err );
                reject( err );
            }
            else {
                conn.end();
                logger.debug( "qeury result: " + JSON.stringify( result ) );
                resolve( result );
            }
        });
    });
}

// mysql connection
function getConnection(){
    var conn = mysql.createConnection({
        host: appConf.MYSQL_host,
        port: appConf.MYSQL_port,
        user: appConf.MYSQL_user,
        password: appConf.MYSQL_password,
        database: appConf.MYSQL_database
    });
    return new promise(function(resolve, reject){
        conn.connect(function(err) {
            if ( err ) {
                logger.error( "mysql connect failed" );
                reject( err );
            } else {
                logger.debug( "mysql connected" );
                resolve( conn );
            }
        })
    });
}

// Get list booking 
function getAllBooking(req, res){

    let mysqlConn = getConnection();

    return new promise((resolve, reject) => {

        mysqlConn.catch( err => {
            http.error(res, 500, 500100, "connect to mysql failed: " + err);
            reject( err );
        })
        .then( conn =>{
            return getAllUser(conn);
         })    
        .catch( err => {
            http.error(res, 500, 500200, "cannot query data from mariadb: " + err);
            reject( err );
         }).then( allUsers => {
            console.log("affected row: " + allUsers.length);
            var lists = [];
            allUsers.forEach(e => {
                
                let fullFriendName = "";
                if ( e.FriendID != null && e.FName != null && e.FSurname != null){
                    fullFriendName = e.FName + " " + e.FSurname;
                }

                lists.push({
                    userId: e.userID,
                    fullname: e.Name + " " + e.Surname,
                    department: e.Department,
                    segment: e.Segment,
                    friend: fullFriendName,
                    room: e.Room,
                    vehicle: e.Vehicle,
                    remark: e.Remark,
                });
            });
            http.success(res, {
                columns: schema.allbooking(),
                data: lists
            });
            mysqlConn.end();
            resolve(true);
         });
    }); 
}

// set room and vehicle
function setRoomAndVehicle(req, res){

    var ctx = req.body;
    var userId = ctx.userId;
    var roomId = ctx.room;
    var vehicleId = ctx.vehicle;
    var remark = ctx.remark;

    let mysqlConn = getConnection();

    return new promise((resolve, reject) => {
        mysqlConn.catch( err => {
            http.error(res, 500, 500100, "connect to mysql failed: " + err);
            reject( err );
        })
        .then( conn =>{
            const qstr = "UPDATE booking \
                SET vehicle = " + vehicleId
                + ",room = " + roomId
                + " WHERE UserID = \"" + userId + "\"";
            conn.query(qstr, function(err, result, fields) {
                if( err ) {
                    logger.error( err );
                    http.error(res, 500, 50000, err);
                    conn.end();
                    reject( err );
                } else {
                    logger.debug( JSON.stringify( result ) );
                    http.success(res);
                    resolve( true );
                }
            });
        })    
        .catch( err => {
            http.error(res, 500, 500200, "cannot query data from mariadb: " + err);
            reject( err );
         });
    });
}

module.exports = {
    getProfile,
    getRoommatesByUserId,
    getRoommates,
    bindRoommate,
    unbindRoommate,
    getAllBooking,
    setRoomAndVehicle
};
