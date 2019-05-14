/*
 * This script was used to migrate previous users who didn't have salt and passwordHash to
 * get those entries into their db schema.
 */
const mongoose = require("mongoose"),
  usersModel = require("../models/users"),
  securityUtils = require("../utils/securityUtils");

mongoose.set("useCreateIndex", true);
const db = mongoose
  .connect("mongodb://localhost/notes-backend", { useNewUrlParser: true })
  .then(
    function() {
      //Successfull connection to mongoDB database.
      console.log("Successfully connected to MongoDB Database.");
    },
    function(err) {
      //Error while connecting to MongoDB database.
      console.log(err);
    }
  );

function migrate() {
  usersModel.find({}, function(error, response) {
    if (error) {
      console.log(error);
    }

    if (response) {
      response.forEach(user => {
        if (user.passwordHash === null || user.passwordHash === undefined) {
          const result = securityUtils.getPasswordHash(user.password);
          usersModel.updateOne(
            { email: user.email },
            { salt: result.salt, passwordHash: result.hash },
            (err, resp) => {
              if (err) {
                console.log(
                  "There was an error while saving user with email: " +
                    user.email
                );
                console.log("Error: " + err);
              }

              if (resp) {
                console.log(
                  "Update operation result for " + user.email + ". " + resp
                );
              }
            }
          );
        }
      });
    } else {
      console.log("There's something wrong in here.");
    }
  });
}

migrate();
