'use strict';

var fs = require('fs'),
    path = require('path');


module.exports = function(tarDir, cb) {

    var processed = 0,
        ret = {
            files: [],
            directories: []
        };

    fs.readdir(tarDir, function(err, files) {

        if (err) {
            return cb(err);
        }

        if (files.length === 0) {
            cb(null, ret);
        }

        files.forEach(function(file) {

            var abspath = path.join(tarDir, file);
            fs.stat(abspath, function(err, stat) {

                if (err) {
                    return cb(err);
                }

                if (stat.isDirectory()) {
                    ret.directories.push(file);
                } else {
                    ret.files.push(file);
                }

                if (++processed === files.length) {
                    cb(null, ret);
                }

            });
        });
    });
};
