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

handlers._users.get = function (data, callback) {
  const phone =
    typeof data.queryStringObject.phone === "string" &&
    data.queryStringObject.phone.trim().length === 10
      ? data.queryStringObject.phone
      : false;
  if (phone) {
    //get token from headers
    const token =
      typeof data.headers.token === "string" ? data.headers.token : false;

    handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
      if (tokenIsValid) {
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
        callback(403, {
          success: false,
          errors: {
            message: "missing required token or invalid token provided",
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

  const phone =
    typeof payload.phone === "string" && payload.phone.trim().length === 10
      ? payload.phone
      : false;

  const { valid, errors } = helpers.validatePayload(payload, "update");
  const token =
    typeof data.headers.token === "string" ? data.headers.token : false;
  if (!valid) {
    callback(400, {
      success: false,
      errors: errors,
    });
  } else if (!phone) {
    callback(400, {
      success: false,
      errors: [
        {
          message: "phone number is required to update",
        },
      ],
    });
  } else {
    //look up users
    handlers._tokens.verifyToken(token, phone, function (tokenisValid) {
      if (tokenisValid) {
        _data.read("users", phone, function (err, userdata) {
          if (!err && userdata) {
            Object.keys(payload).forEach((value) => {
              if (value) {
                if (value === "password") {
                  userdata[value] = helpers.hash(payload[value]);
                } else {
                  userdata[value] = payload[value];
                }
              }
            });

            _data.update("users", phone, userdata, function (err) {
              if (!err) {
                const { password, ...withoutPassword } = userdata;

                callback(200, {
                  success: true,
                  data: withoutPassword,
                });
              } else {
                callback(500, {
                  success: false,
                  errors: [
                    {
                      message: "failed to update the user data",
                    },
                  ],
                });
              }
            });
          } else {
            callback(400, {
              success: false,
              errors: [
                {
                  message: "user does not exist",
                },
              ],
            });
          }
        });
      } else {
        callback(403, {
          success: false,
          errors: {
            message: "missing required token or invalid token provided",
          },
        });
      }
    });
  }
};

// users - delete
// required - phone

//@TODO only let user delete their objects and must be authenticated
//@TODO delete data associated with this user
handlers._users.delete = function (data, callback) {
  const phone =
    typeof data.queryStringObject.phone === "string" &&
    data.queryStringObject.phone.trim().length === 10
      ? data.queryStringObject.phone
      : false;

  if (phone) {
    const token =
      typeof data.headers.token === "string" ? data.headers.token : false;

    handlers._tokens.verifyToken(token, phone, function (tokenisValid) {
      if (tokenisValid) {
        _data.read("users", phone, (err, data) => {
          if (!err && data) {
            _data.delete("users", phone, (err) => {
              if (!err) {
                callback(200, { success: true });
              } else {
                callback(500, {
                  success: false,
                  errors: [
                    {
                      message: "failed to delete your account",
                    },
                  ],
                });
              }
            });
          } else {
            callback(400, {
              success: false,
              errors: [
                {
                  message: "user does not exist",
                },
              ],
            });
          }
        });
      } else {
        callback(403, {
          success: false,
          errors: {
            message: "missing required token or invalid token provided",
          },
        });
      }
    });
  } else {
    callback(400, {
      success: false,
      errors: [
        {
          message: "phone number is required to update",
        },
      ],
    });
  }
};

handlers.tokens = function (data, callback) {
  const acceptableHandlers = ["post", "get", "put", "delete"];
  if (acceptableHandlers.includes(data.method)) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};

handlers._tokens = {};

//required data is phone and password
handlers._tokens.post = function (data, callback) {
  const phone =
    typeof data.payload.phone === "string" &&
    data.payload.phone.trim().length > 0
      ? data.payload.phone
      : false;
  const password =
    typeof data.payload.password === "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password
      : false;

  if (phone && password) {
    //look up the user with that phone number
    _data.read("users", phone, (err, data) => {
      if (!err && data) {
        //hash sent the password and compare to password we have in user object
        const hashedPassword = helpers.hash(password);
        if (hashedPassword === data.password) {
          const tokenId = helpers.createRandomString(20);
          const expires = Date.now() + 1000 * 60 * 60;

          const tokenObject = {
            phone,
            id: tokenId,
            expires,
          };

          //store token

          _data.create("tokens", tokenId, tokenObject, (err) => {
            if (!err) {
              callback(200, {
                success: true,
                data: tokenObject,
              });
            } else {
              callback(500, {
                success: false,
                errors: [
                  {
                    message: "failed to issue token",
                  },
                ],
              });
            }
          });
        } else {
          callback(400, {
            success: false,
            errors: [
              {
                message: "invalid  password",
              },
            ],
          });
        }
      } else {
        callback(400, {
          success: false,
          errors: [
            {
              message: "could not find user",
            },
          ],
        });
      }
    });
  } else {
    callback(400, {
      success: false,
      errors: "missing required fields",
    });
  }
};

//required data is an id for the token
handlers._tokens.get = function (data, callback) {
  const token_id =
    typeof data.queryStringObject.token_id === "string" &&
    data.queryStringObject.token_id.trim().length === 20
      ? data.queryStringObject.token_id
      : false;

  if (token_id) {
    _data.read("tokens", token_id, (err, data) => {
      if (!err && data) {
        callback(200, {
          success: true,
          data: data,
        });
      } else {
        callback(400, {
          success: false,
          errors: [
            {
              message: "failed to get token",
            },
          ],
        });
      }
    });
  } else {
    callback(400, {
      success: false,
      errors: [
        {
          message: "an id is required",
        },
      ],
    });
  }
};

//two required fields id and extend
handlers._tokens.put = function (data, callback) {
  const token_id =
    typeof data.payload.token_id === "string" &&
    data.payload.token_id.trim().length === 20
      ? data.payload.token_id
      : false;
  const extend =
    typeof data.payload.extend === "boolean" && data.payload.extend
      ? data.payload.extend
      : false;

  if (token_id && extend) {
    // look up the token

    _data.read("tokens", token_id, (err, data) => {
      if (!err && data) {
        //check that token has not expired

        if (data.expires > Date.now()) {
          _data.update(
            "tokens",
            token_id,
            {
              ...data,
              expires: Date.now() + 1000 * 60 * 60,
            },
            (err) => {
              if (!err) {
                callback(200, {
                  success: true,
                });
              } else {
                callback(400, {
                  success: false,
                  errors: [
                    {
                      message: "could not extend your time",
                    },
                  ],
                });
              }
            }
          );
        } else {
          callback(400, {
            success: false,
            errors: [
              {
                message: "token is expired create a new one",
              },
            ],
          });
        }
      } else {
        callback(400, {
          success: false,
          errors: [
            {
              message: "specified token does not exist",
            },
          ],
        });
      }
    });
  } else {
    callback(400, {
      success: false,
      errors: [
        {
          message: "missing fields or fields sent are invalid",
        },
      ],
    });
  }
};

handlers._tokens.delete = function (data, callback) {
  const token_id =
    typeof data.queryStringObject.token_id === "string" &&
    data.queryStringObject.token_id.trim().length === 20
      ? data.queryStringObject.token_id
      : false;

  if (token_id) {
    _data.read("tokens", token_id, (err, data) => {
      if (!err && data) {
        _data.delete("tokens", token_id, (err) => {
          if (!err) {
            callback(200, { success: true });
          } else {
            callback(500, {
              success: false,
              errors: [
                {
                  message: "failed to delete your session",
                },
              ],
            });
          }
        });
      } else {
        callback(400, {
          success: false,
          errors: [
            {
              message: "session not found",
            },
          ],
        });
      }
    });
  } else {
    callback(400, {
      success: false,
      errors: [
        {
          message: "phone number is required to update",
        },
      ],
    });
  }
};

//verify that id is valid for the user
handlers._tokens.verifyToken = function (id, phone, callback) {
  _data.read("tokens", id, (err, data) => {
    if (!err && data) {
      //token is for given user and has not expired
      if (data.phone === phone && data.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};
module.exports = handlers;
