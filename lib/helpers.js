/**
 * helpers for various tasks
 */

const crypto = require("crypto");
const config = require("./config");

const helpers = {};

helpers.hash = function (string) {
  if (typeof string === "string" && string.length > 0) {
    const hash = crypto
      .createHmac("sha256", config.hashingSecret)
      .update(string)
      .digest("hex");

    return hash;
  } else {
    return false;
  }
};

// parse a json sting to an object in all cases without throwing
helpers.parsedJsonToObject = function (buffer) {
  try {
    const obj = JSON.parse(buffer);
    return obj;
  } catch (error) {
    console.error();
    return {};
  }
};

helpers.validatePayload = function (payload) {
  const errors = [];
  const acceptedFields = [
    "firstName",
    "secondName",
    "phone",
    "password",
    "tosAgreement",
  ];

  if (acceptedFields !== Object.keys(payload)) {
    acceptedFields.forEach((field) => {
      if (!payload.hasOwnProperty(field)) {
        errors.push({
          message: `missing ${field} field`,
        });
      }
    });
  }

  Object.keys(payload).forEach((key) => {
    if (!acceptedFields.includes(key)) {
      errors.push({
        message:
          "invalid field sent accepted fields are  firstName, secondName,phone,password,tosAgreement,",
      });
    } else if (key !== "tosAgreement" && typeof payload[key] !== "string") {
      errors.push({
        message: `only string values are accepted`,
      });
    } else if (
      key === "tosAgreement" &&
      (typeof payload[key] !== "boolean" || !payload[key])
    ) {
      errors.push({
        message: !payload[key]
          ? "cannot proceed without accepting the terms of service"
          : `tos agreement should be boolean `,
      });
    } else if (key === "phone" && payload[key].trim().length !== 10) {
      errors.push({
        message: `phone number  should contain ten digits`,
      });
    } else if (key !== "tosAgreement" && payload[key].trim().length <= 0) {
      errors.push({
        message: `${key} field is required`,
      });
    }
  });

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
    };
  }

  return {
    valid: true,
    errors,
  };
};

module.exports = helpers;
