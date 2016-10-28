'use strict';

var path = require('path');

var rootPath = path.normalize(__dirname + '/../../..');

module.exports = {
    env: 'production',
    ip: process.env.OPENSHIFT_NODEJS_IP || process.env.IP || '0.0.0.0',
    port: process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 8080,
    screenshotsRoot: "/var/local/innova/screenshots"
};
