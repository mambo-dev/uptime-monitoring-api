/**
 * create and export configuration variables
 *
 */

// container for all environments

const environments = {};

//staging as default env

environments.staging = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: "staging",
  hashingSecret: "this is a secret",
};

// production environment

environments.production = {
  httpPort: 5000,
  httpsPort: 5001,
  envName: "production",
  hashingSecret: "this is also a  secret",
};

//determine which env was passed in the command line

const currentEnvironment =
  typeof process.env.NODE_ENV === "string"
    ? process.env.NODE_ENV.toLowerCase()
    : "";

//check that current env is one of our possible env

const environmentToExport = environments.hasOwnProperty(currentEnvironment)
  ? environments[currentEnvironment]
  : environments.staging;

module.exports = environmentToExport;
