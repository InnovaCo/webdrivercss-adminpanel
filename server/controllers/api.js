'use strict';

/**
 * Using Rails-like standard naming convention for endpoints.
 * GET   /api/repositories                     ->  getDirectoryList
 * GET   /api/repositories/:file               ->  downloadRepository
 * GET   /api/repositories/:project/:file      ->  getImage
 * GET   /api/repositories/:project/diff/:diff ->  getImage
 * POST  /api/repositories/confirm             ->  acceptDiff
 * POST  /api/repositories/*                   ->  syncImages
 */

var fs = require('fs-extra'),
    path = require('path'),
    glob = require('glob'),
    rimraf = require('rimraf'),
    targz = require('tar.gz'),
    async = require('async'),
    readDir = require('../utils/readDir'),
    imageDir = path.join(__dirname, '..', '..', '..', 'repositories'),
    tarDir = path.join(__dirname, '..', '..', '..', 'tar'),
    listDirectory = require('../utils/listDirectory');


exports.syncImages = function(req, res) {

    if (!req.files) {
        return res.send(500);
    }

    fs.readFile(req.files.gz.path, function(err, data) {
        var newPath = path.join(tarDir, req.params[0], req.files.gz.name);

        fs.remove(newPath.replace(/\.tar\.gz/, ''), function(err) {
            if (err) {
                throw err;
            }

            if (!fs.existsSync(path.join(tarDir, req.params[0]))) {
                rimraf.sync(path.join(tarDir, req.params[0]));
                fs.mkdirsSync(path.join(tarDir, req.params[0]), '0755', true);
            }

            fs.writeFile(newPath, data, function(err) {
                if (err) {
                    throw (err);
                }

                new targz().extract(newPath, path.join(imageDir, req.params[0]));
                res.send(200);
            });

        });
    });

};

exports.getDirectoryList = function(req, res) {

    readDir(tarDir, imageDir, function(err, list) {
        if (err) {
            throw err;
        }

        res.send(list);
    });

};

exports.getImage = function(req, res) {

    var processed = 0,
        filepath,
        project = req.params.primaryNav;

    if (req.params.tertiaryNav) {
        project = project + "\/" + req.params.secondaryNav + "\/" + req.params.tertiaryNav;
    } else if (req.params.secondaryNav) {
        project = project + "\/" + req.params.secondaryNav;
    }

    /**
     * directory was found
     * generate file path
     */
    if (req.params.file) {
        filepath = path.join(imageDir, project, req.params.file);
    } else {
        filepath = path.join(imageDir, project, 'diff', req.params.diff);
    }

    /**
     * check if requested file exists
     * return 404 if file doesn't exist otherwise send file content
     */
    res.sendfile(filepath, {}, function(err) {
        if (err) {
            return res.send(404);
        }
    });

};

exports.downloadRepository = function(req, res) {

    var file = req.params[0],
        project = file.replace(/\.tar\.gz/, ''),
        tmpPath = path.join(__dirname, '..', '..', '.tmp', 'webdrivercss-adminpanel', project).replace(/\\/g, "/"),
        tarPath = tmpPath + '.tar.gz',
        projectPath = path.join(imageDir, project).replace(/\\/g, "/");
    /**
     * create tmp directory and create tarball to download on the fly
     */
    async.waterfall([
        /**
         * check if project exists
         */
        function(done) {
            return fs.exists(projectPath, done.bind(this, null));
        },
        /**
         * make tmp dir
         */
        function(isExisting, done) {
            if (!isExisting) {
                return res.send(404);
            }

            return glob(projectPath + '/**/*.baseline.png', done);
        },
        /**
         * copy these files
         */
        function(files, done) {
            return async.map(files, function(file, cb) {
                return fs.copy(file, file.replace(projectPath, tmpPath), cb);
            }, done);
        },
        /**
         * create diff directory (webdrivercss breaks otherwise)
         */
        function(res, done) {
            return fs.ensureDir(tmpPath + '/diff', done);
        },
        /**
         * zip cleared
         */
        function(res, done) {
            return new targz().compress(tmpPath, tarPath, done);
        }
    ], function(err) {

        if (err) {
            return res.send(500);
        }

        res.sendfile(tarPath);

        /**
         * delete tmp directory
         */
        fs.remove(path.join(tmpPath, '..'));

    });

};

exports.acceptDiff = function(req, res) {

    /*
    The angular.js code still expects the new file to be suffixed '.new.png',
    but it's actually '.regression.png in the repository.

    We'll deal with this by assuming the .new.png in the file requested by the
    client is actually .regression.png
    */

    var imageName = req.body.file.split(".new.png")[0],
        newFile = imageName + ".regression.png",
        currentFile = imageName + ".baseline.png",
        diffFile = imageName + ".diff.png",
        project = req.body.project;

    /**
     * read directory to check if hash matches given files
     */
    async.waterfall([
        function(done) {
            var source = path.join(imageDir, project, newFile),
                dest = path.join(imageDir, project, currentFile);

            return fs.copy(source, dest, done);

        },
        /**
         * remove obsolete new.png file
         */
        function(done) {
            return fs.remove(path.join(imageDir, project, newFile), done);
        },
        /**
         * remove diff file
         */
        function(done) {
            return fs.remove(path.join(imageDir, project, 'diff', diffFile), done);
        }
    ], function(err) {

        if (err) {
            return res.send(err);
        }

        res.send(200);

    });

};

exports.removeImages = function(req, res) {

    /*
    The angular.js code still expects the new file to be suffixed '.new.png',
    but it's actually '.regression.png in the repository.

    We'll deal with this by assuming the .new.png in the file requested by the
    client is actually .regression.png
    */

    var imageName = req.body.file.split(".remove.png")[0],
        regressionFile = imageName + ".regression.png",
        currentFile = imageName + ".baseline.png",
        diffFile = imageName + ".diff.png",
        normalFile = imageName + ".png",
        project = req.body.project;
    /**
     * read directory to check if hash matches given files
     */
    async.waterfall([
            /**
             * remove refression file
             */
            function(done) {
                if (fs.existsSync(path.join(imageDir, project, regressionFile))) {
                    return fs.remove(path.join(imageDir, project, regressionFile), done);
                } else return done();
            },
            /**
             * remove baseline file
             */
            function(done) {
                if (fs.existsSync(path.join(imageDir, project, currentFile))) {
                    return fs.remove(path.join(imageDir, project, currentFile), done);
                } else return done();
            },
            /**
             * remove diff file
             */
            function(done) {
                if (fs.existsSync(path.join(imageDir, project, 'diff', diffFile))) {
                    return fs.remove(path.join(imageDir, project, 'diff', diffFile), done);
                } else return done();
            },
            /**
             * remove normal file if exists
             */
            function(done) {
                if (fs.existsSync(path.join(imageDir, project, normalFile))) {
                    return fs.remove(path.join(imageDir, project, normalFile), done);
                } else return done();
            },
            /**
             * remove tar if all screenshots were deleted
             */
            function(done) {
                listDirectory(path.join(imageDir, project), function(err, structure) {
                    if (structure.files.length === 0) {
                        return fs.remove(path.join(tarDir, project + ".tar.gz"), done);
                    } else return done();
                });
            }
        ],
        function(err) {

            if (err) {
                return res.send(err);
            }

            res.send(200);

        });

};


exports.deleteRepo = function(req, res) {

    /*
    The angular.js code still expects the new file to be suffixed '.new.png',
    but it's actually '.regression.png in the repository.

    We'll deal with this by assuming the .new.png in the file requested by the
    client is actually .regression.png
    */

    var project = req.body.project;
    /**
     * read directory to check if hash matches given files
     */
    async.waterfall([
            /**
             * remove regression file
             */
            function(done) {
                if (fs.existsSync(path.join(imageDir, project))) {
                    rimraf.sync(path.join(imageDir, project));
                    return done();
                } else return res.send(404);
            },
            /**
             * remove tar if all screenshots were deleted
             */
            function(done) {
                return fs.remove(path.join(tarDir, project + ".tar.gz"), done);
            }
        ],
        function(err) {

            if (err) {
                return res.send(err);
            }

            res.send(200);

        });

};


exports.denyDiff = function(req, res) {

    /*
    The angular.js code still expects the new file to be suffixed '.new.png',
    but it's actually '.regression.png in the repository.

    We'll deal with this by assuming the .new.png in the file requested by the
    client is actually .regression.png
    */

    var imageName = req.body.file.split(".deny.png")[0],
        regressionFile = imageName + ".regression.png",
        diffFile = imageName + ".diff.png",
        project = req.body.project;
    /**
     * read directory to check if hash matches given files
     */
    async.waterfall([
        /**
         * remove refression file
         */
        function(done) {
            if (fs.existsSync(path.join(imageDir, project, regressionFile))) {
                return fs.remove(path.join(imageDir, project, regressionFile), done);
            } else return done();
        },
        /**
         * remove diff file
         */
        function(done) {
            if (fs.existsSync(path.join(imageDir, project, 'diff', diffFile))) {
                return fs.remove(path.join(imageDir, project, 'diff', diffFile), done);
            } else return done();
        }
    ], function(err) {

        if (err) {
            return res.send(err);
        }

        res.send(200);

    });

};
