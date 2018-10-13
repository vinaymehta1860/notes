var express = require("express"),
    router = express.Router();

// User Object
var users = require("../models/users");

//Simple test route
router.get('/', function(req, res){
  return res.send("Hello from the Backend Folder.");
});

module.exports = router;