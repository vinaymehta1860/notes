const crypto = require("crypto");

/*
 *  This utils file is used to generate secured hash to store the password in database.
 *  For now, it'll perform two actions:
 *  1) Create a hash for every new user so that the signup endpoint can then store that in db
 *  2) Verify the password by checking the stored hash for sign in operation
 */

module.exports = {
  getPasswordHash(password) {
    const promise = new Promise((resolve, reject) => {
      const salt = crypto.randomBytes(16).toString("hex");
      const hash = crypto
        .pbkdf2Sync(password, salt, 1000, 64, "sha512")
        .toString("hex");

      resolve({ salt: salt, hash: hash });
    });
    return promise;
  },

  verifyPassword(password, passwordHash, salt) {
    const promise = new Promise((resolve, reject) => {
      const hash = crypto
        .pbkdf2Sync(password, salt, 1000, 64, "sha512")
        .toString("hex");

      if (hash === passwordHash) {
        resolve(true);
      } else {
        reject(false);
      }
    });

    return promise;
  }
};
