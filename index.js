/**
 * primary file for the api
 *
 */

const http = require("http");
const https = require("https");
const url = require("url");
const StringDecoder = require("string_decoder").StringDecoder;
const config = require("./config");
const fs = require("fs");

//  the server should respond to all requests with a string

const httpServer = http.createServer(function (req, res) {
  unifiedServer(req, res);
});

// start the server and listen on port 3000

httpServer.listen(config.httpPort, function () {
  console.log(
    "the server is listening on port: " +
      config.httpPort +
      " in " +
      config.envName +
      " mode"
  );
});

//initiate the https server
const httpsServerOptions = {
  key: fs.readFileSync("./https/key.pem"),
  cert: fs.readFileSync("./https/cert.pem"),
};

const httpsServer = https.createServer(httpsServerOptions, function (req, res) {
  unifiedServer(req, res);
});

//listen to https server
httpsServer.listen(config.httpsPort, function () {
  console.log(
    "the server is listening on port: " +
      config.httpsPort +
      " in " +
      config.envName +
      " mode"
  );
});

// all the server logic for bth http and https server

const unifiedServer = function (req, res) {
  // get url and parse it
  const parsedUrl = url.parse(req.url, true);

  // get path from the url
  const path = parsedUrl.path;
  const trimmedPath = path.replace(/^\/+|\/+$/g, "");

  // get the query string as an object

  const queryStringObject = parsedUrl.query;

  //get the HTTP Method
  const method = req.method.toLowerCase();

  // get the headers

  const headers = req.headers;

  //get the payloads
  const decoder = new StringDecoder("utf-8");
  let buffer = "";

  req.on("data", function (data) {
    console.log(typeof data);
    buffer += decoder.write(data);
  });

  req.on("end", function () {
    buffer += decoder.end();

    // choose handler this request should go to  and if not found use not found handler

    const chosenHandler =
      typeof router[trimmedPath] !== "undefined"
        ? router[trimmedPath]
        : handlers.notFound;

    // construct data object to send to the handler

    const data = {
      trimmedPath,
      queryStringObject,
      method,
      headers,
      payload: buffer,
    };

    //route the request to the handler specified in the router

    chosenHandler(data, function (statusCode, payload) {
      // use status code  called by handler or default to 200
      statusCode = typeof statusCode === "number" ? statusCode : 200;

      // use payload called by handler  or default to an empty object

      payload = typeof payload === "object" ? payload : {};

      // convert the payload to a tring

      var payloadString = JSON.stringify(payload);

      //return the response
      res.setHeader("Content-Type", "application/json");
      res.writeHead(statusCode);
      res.end(payloadString);

      console.log("returning this response", statusCode, payload);
    });
  });
};

// define handlers

const handlers = {};

// not found handler

handlers.notFound = function (data, callback) {
  callback(404);
};

handlers.ping = function (data, callback) {
  callback(200);
};

//define a request router

const router = {
  ping: handlers.ping,
};
