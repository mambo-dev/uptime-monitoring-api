/**
 * library to store and retrieve data
 */

const fs = require("fs");
const path = require("path");
const helpers = require("./helpers");

// container for the module
const lib = {};

lib.baseDir = path.join(__dirname, "/../.data/");

//create a new file
lib.create = function (dir, file, data, callback) {
  // open the file for writing
  fs.open(
    lib.baseDir + dir + "/" + file + ".json",
    "wx",
    function (err, fileDescriptor) {
      if (!err && fileDescriptor) {
        const convertDataToString = JSON.stringify(data);

        //write to file and close it
        fs.writeFile(fileDescriptor, convertDataToString, function (err) {
          if (!err) {
            fs.close(fileDescriptor, function (err) {
              if (!err) {
                callback(false);
              } else {
                callback("error closing the new file");
              }
            });
          } else {
            callback("could not write  new file");
          }
        });
      } else {
        callback("could not create file, it may already exist");
      }
    }
  );
};

//read data from a file
lib.read = function (dir, fileName, callback) {
  fs.readFile(
    `${lib.baseDir}${dir}/${fileName}.json`,
    "utf8",
    function (err, data) {
      if (!err && data) {
        callback(false, helpers.parsedJsonToObject(data));
      } else {
        callback(err, helpers.parsedJsonToObject(data));
      }
    }
  );
};

// update an existing file with new data

lib.update = function (dir, fileName, data, callback) {
  //open the file for update
  fs.open(
    `${lib.baseDir}${dir}/${fileName}.json`,
    "r+",
    function (err, fileDescriptor) {
      if (!err && fileDescriptor) {
        const convertDataToString = JSON.stringify(data);

        fs.truncate(fileDescriptor, function (err) {
          if (!err) {
            fs.writeFile(fileDescriptor, convertDataToString, function (err) {
              if (!err) {
                fs.close(fileDescriptor, function (err) {
                  if (!err) {
                    callback(false);
                  } else {
                    callback("could not close the updated file");
                  }
                });
              } else {
                callback("could not update file");
              }
            });
          } else {
            callback("error truncating this file");
          }
        });
      } else {
        callback("could not open file for update, it may not exist");
      }
    }
  );
};

//delete a file
lib.delete = function (dir, fileName, callback) {
  // unlink the file
  fs.unlink(`${lib.baseDir}${dir}/${fileName}.json`, (err) => {
    if (!err) {
      callback(false);
    } else {
      callback("could not delete file");
    }
  });
};

// export

module.exports = lib;
