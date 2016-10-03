'use strict';

/**
 * https://gist.github.com/DelvarWorld/825583
 */

var fs = require('fs'),
    path = require('path'),
    listDirectory = require('./listDirectory');

/**
 * get image repository information
 * @param  {String}   tarDir    root path for tar.gz
 * @param  {String}   imageDir  root path for images
 * @param  {Function} callback to return result
 */
module.exports = function(tarDir, imageDir, callback) {
    var processed = 0,
        projectCnt = 0,
        files = {
            gz: [],
            repositories: {}
        };

    // Use lstat to resolve symlink if we are passed a symlink
    fs.lstat(tarDir, function(err, stat) {

        if (err) {
            return callback(err);
        }
        if (stat.isDirectory()) {
            var structure;
            structure = getFilesFromDir(tarDir, [".gz"])
            if (structure.directories.length === 0) {
                return callback(null, {
                    repositories: []
                });
            }

            structure.files = structure.files.filter(function(file) {
                if (file[0] === '.') {
                    return false;
                }

                return true;
            });

            files.gz = structure.files;
            projectCnt = structure.directories.length;
            fs.lstat(imageDir, function(err, stat) {

                if (err) {
                    return callback(err);
                }
                if (stat.isDirectory()) {
                    structure.directories.forEach(function(dir) {

                        files.repositories[dir] = {
                            images: [],
                            diffs: []
                        };

                        // get project directory
                        listDirectory(path.join(imageDir, dir), function(err, structure) {

                            // save regression images
                            files.repositories[dir].images = structure.files;

                            // get diffs
                            listDirectory(path.join(imageDir, dir, 'diff'), function(err, structure) {

                                files.repositories[dir].diffs = structure.files;

                                if (++processed === projectCnt) {
                                    callback(null, files);
                                }
                            });
                        });
                    });
                } else {
                    return callback(new Error('path: ' + imageDir + ' is not a directory'));
                }
            });

        } else {
            return callback(new Error('path: ' + tarDir + ' is not a directory'));
        }
    });
};

function getFilesFromDir(dir, fileTypes) {
    var filesToReturn = {
        "files": [],
        "directories": []
    };

    function walkDir(currentPath) {
        var files = fs.readdirSync(currentPath);
        for (var i in files) {
            var curFile = path.join(currentPath, files[i]);
            if (fs.statSync(curFile).isFile() && fileTypes.indexOf(path.extname(curFile)) != -1) {
                filesToReturn.files.push(curFile.replace(dir, '').replace(/\\/g, "/").replace("/", ""));
                filesToReturn.directories.push(curFile.replace(dir, '').replace('.tar.gz', '').replace(/\\/g, "/").replace("/", ""));
            } else if (fs.statSync(curFile).isDirectory()) {
                walkDir(curFile);
            }
        }
    };
    walkDir(dir);
    return filesToReturn;
}
