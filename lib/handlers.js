/**
 * lib handlers
 */

const _data = require("./data");
const helpers = require("./helpers");

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

  const payload = data.payload;

  const { valid, errors } = helpers.validatePayload(payload, "create");

  if (!valid) {
    callback(400, {
      success: false,
      errors: errors,
    });
  } else {
    //make sure user doesnt already exist
    _data.read("users", payload.phone, function (err, data) {
      if (err) {
        //hash the password
        const { firstName, secondName, phone, tosAgreement, password } =
          payload;

        const hashedPassword = helpers.hash(payload.password);

        if (hashedPassword) {
          //create the user object

          const userObject = {
            firstName,
            secondName,
            phone,
            tosAgreement,
            password: hashedPassword,
          };

          _data.create("users", phone, userObject, function (err) {
            if (!err) {
              callback(200, {
                success: true,
              });
            } else {
              callback(400, {
                success: false,
                errors: [
                  {
                    message: err,
                  },
                ],
              });
            }
          });
        } else {
          callback(500, {
            success: false,
            errors: [
              {
                message: "error hashing password",
              },
            ],
          });
        }
      } else {
        callback(400, {
          success: false,
          errors: "user with phone number already exists",
        });
      }
    });
  }
};

// users - get
//required data phone
//@TODO only let authenticated users access their own file
handlers._users.get = function (data, callback) {
  const phone =
    typeof data.queryStringObject.phone === "string" &&
    data.queryStringObject.phone.trim().length === 10
      ? data.queryStringObject.phone
      : false;
  if (phone) {
    _data.read("users", phone, function (err, data) {
      if (!err && data) {
        //remove the hashed password

        const { password, ...restOfdata } = data;

        callback(200, { success: true, data: restOfdata });
      } else {
        callback(400, {
          success: false,
          errors: {
            message: err,
          },
        });
      }
    });
  } else {
    callback(400, {
      success: false,
      errors: {
        message: "missing phone number",
      },
    });
  }
};

// users - put
handlers._users.put = function (data, callback) {
  const payload = data.payload;

  const { valid, errors } = helpers.validatePayload(payload, "create");

  if (!valid) {
    callback(400, {
      success: false,
      errors: errors,
    });
  } else {
  }
};

// users - delete
handlers._users.delete = function (data, callback) {};

module.exports = handlers;
