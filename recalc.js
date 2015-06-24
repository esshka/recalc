#!/usr/bin/env node
'use strict';

var Sequelize = require('sequelize');
var db = new Sequelize('zoomator_new2', null, null, {
  dialect: 'postgres',
  logging: false
});
var _ = require('lodash');
var deviceId = process.argv[2];

var Clamp = db.define('clamp', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: Sequelize.STRING
  },
  duration: {
    type: Sequelize.STRING
  },
  time: {
    type: Sequelize.DATE
  },
  device_id: {
    type: Sequelize.INTEGER
  },
  updatedAt: {
    field: 'updated_at',
    type: Sequelize.DATE
  }
});

Clamp.findAll({
  attributes: ['id', 'time', 'type', 'duration'],
  where: { device_id: deviceId },
  order: '"time" ASC',
})
  .then(function(clamps) {
      var total = clamps.length;
      _.each(clamps, function(clamp, idx){
        if(idx === 0) {
          clamp.duration = 0;
        } else if (idx != total) {
          let next = clamps[idx+1];
          clamp.duration = ((+new Date(clamps[idx+1].time)) - (+new Date(clamp.time))) / 1000;
        } else {
          clamp.duration = ((+new Date()) - (+new Date(clamp.time))) / 1000;
        }
        clamp.save();
      });
  });