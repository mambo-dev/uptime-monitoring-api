/**
 * lib handlers
 */

// define handlers

const handlers = {};

// not found handler

handlers.notFound = function (data, callback) {
  callback(404);
};

handlers.ping = function (data, callback) {
  callback(200);
};

handlers.users = function (data, callback) {
  const acceptableHandlers = ["post", "get", "put", "delete"];
  if (acceptableHandlers.includes(data.method)) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

// container for the users sub methods
handlers._users = {};

// users - post
//required data firstname, lastname, password , phone, tosAgreement,
handlers._users.post = function (data, callback) {
  // check all required fields are filled out
  const errors = [];
  const payload = JSON.parse(data.payload);
  const acceptedFields = [
    "firstName",
    "secondName",
    "phone",
    "password",
    "tosAgreement",
  ];
  console.log(payload);
  Object.keys(payload).forEach((key) => {
    if (!acceptedFields.includes(key)) {
      return callback(200, {
        success: false,
        errors:
          "invalid field sent accepted fields are  firstName, secondName,phone,password,tosAgreement,",
      });
    }

    if (key !== "phone") {
      typeof payload[key] !== "string"
        ? errors.push(`${payload[key]} is required`)
        : "";
    } else {
      typeof payload[key] !== "number"
        ? errors.push(`${payload[key]} is required`)
        : "";
    }
  });

  if (errors.length > 0) {
    return callback(403, {
      success: false,
      errors: errors,
    });
  }

  callback(200);
};

// users - get
handlers._users.get = function (data, callback) {};

// users - put
handlers._users.put = function (data, callback) {};

// users - delete
handlers._users.delete = function (data, callback) {};

module.exports = handlers;
