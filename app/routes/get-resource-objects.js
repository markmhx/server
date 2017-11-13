var app = require('app');
var async = require('async');
var convertResourceObjectUrlsToAbsolute = require('app/utils/convert-resource-object-urls-to-absolute');
var dumpError = require('app/utils/dump-error');
var fs = require('fs');
var path = require('path');
var sendResourceDocument = require('app/utils/send-resource-document');

module.exports = function(req, res) {
  // Replace with proper directory check regardless of presence of dot
  // Security check directory navigation with dots
  if (req.params.type.indexOf('.') !== -1) {
    return res.status(404).send('Not Found');
  }
  
  var getData = function(dataDirectory, done) {
    var directory = `${dataDirectory}/${req.params.type}`;

    var readDirectory = (done) => {
      fs.readdir(directory, function(error, files) {
        if (error) { return done(error); }

        if (!files.length) {
          var error = new Error('Unable to read directory and find files');
          dumpError(error);
          return done(error);
        }

        done(undefined, files);
      });
    };

    var getFilesData = (files, done) => {
      if (files.indexOf('index.json') !== -1) {
        fs.readFile(path.join(directory, 'index.json'), function(error, buffer) {
          done(error, JSON.parse(buffer));
        });
      } else {
        var files = files.map(function(file) { 
          return path.join(directory, file); 
        }).filter(function(file) {
          if (file.indexOf('.json') !== -1 && file.indexOf('.backup') === -1) { 
            return file; 
          }
        });

        async.map(files, fs.readFile, function(error, bufferArray) {
          if (bufferArray) {
            bufferArray = bufferArray.map((buffer) => { 
              var json = JSON.parse(buffer);

              if (fs.existsSync(`${directory}/${json.id}.md`)) {
                json.attributes.body = fs.readFileSync(`${directory}/${json.id}.md`, "utf8");
              }

              return json;
            });
          }

          done(error, bufferArray);
        });
      }
    };

    if (!fs.existsSync(directory)) { return done(); }

    async.waterfall([readDirectory, getFilesData], done);
  };

  async.map(app.dataDirectories, getData, (error, dataArray) => {
    if (error) {
      dumpError(error);
      return res.status(500).send('Internal Server Error');
    }

    var data = [].concat(...dataArray.filter((e) => e));

    if (Array.isArray(data)) {
      data.map((dataObject) => {
        return convertResourceObjectUrlsToAbsolute(dataObject, req)
      });
    } else {
      data = convertResourceObjectUrlsToAbsolute(data, req);
    }

    sendResourceDocument(req, res, data);
  });
};
