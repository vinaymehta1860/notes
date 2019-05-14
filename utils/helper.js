const usersModel = require("../models/users");

module.exports = {
  // This function will verify if any users with the given emails are current users or not
  verifyUsers(emails) {
    let promise = new Promise((resolve, reject) => {
      let verifiedUsers = [];
      emails.forEach((email, index) => {
        usersModel
          .findOne({ email: email })
          .then(response => {
            verifiedUsers.push(response.email);
            // If you're done verifying all the email address, then resolve the promise.
            if (index === emails.length - 1) {
              resolve(verifiedUsers);
            }
          })
          .catch(error => {
            // console.log("Inside catch");
            // reject(verifiedUsers);
            // If you're done verifying all the email address, then resolve the promise.
            if (index === emails.length - 1) {
              resolve(verifiedUsers);
            }
          });
      });
    });

    return promise;
  }
};
