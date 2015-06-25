#!/usr/bin/env node
'use strict';

var pg = require('pg');
var QueryStream = require('pg-query-stream');
var conString = "postgres://localhost/zoomator_new2";
var Writable = require('stream').Writable;
var deviceId = process.argv[2];
var util = require('util');
var  _ = require('lodash');

var WriteStream = function() {
  Writable.call(this, {objectMode: true});
};
util.inherits(WriteStream, Writable);

pg.connect(conString, function(err, client, done) {
    let counter = 0;
    let prev;
    if(err) {
      return console.error('error fetching client from pool', err);
    }

    var updateClampDuration = function(clampData){
      console.log(`row #${counter} | updating clamp #${clampData.id} with duration ${clampData.duration}`);
      let updateQuery = client.query(`UPDATE clamps SET duration = ${clampData.duration} WHERE id = ${clampData.id}`, function(err, result){
        if(err) {
          return console.error('error running query', err);
        }
      });
      updateQuery.on('end', function(){
         counter++;
         console.log(`clamp #${clampData.id} updated in database!`);
      });
    }

    WriteStream.prototype._write = function(chunk, encoding, callback) {
      if (!prev) {
        chunk.duration = 0;
        updateClampDuration(chunk);
      } else {
        let updatedDuration = ((+new Date(chunk.time)) - (+new Date(prev.time))) / 1000;
        chunk.duration = updatedDuration;
        updateClampDuration(chunk);
      }
      prev = chunk;
      callback();
    };

    let updateStream = new WriteStream();

    let query = new QueryStream(`SELECT id,time,type,duration,device_id FROM clamps WHERE device_id = ${deviceId} ORDER BY time ASC`);
    let readStream = client.query(query);
    readStream.pipe(updateStream);

    readStream.on('end', function(){
      console.log('finished', counter, 'clamps updating...');
    });

    client.on('drain', function() {
      console.log("update finished!");
    });
});