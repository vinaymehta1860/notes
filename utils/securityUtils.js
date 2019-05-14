const crypto = require("crypto");

/*
 *  This utils file is used to generate secured hash to store the password in database.
 *  For now, it'll perform two actions:
 *  1) Create a hash for every new user so that the signup endpoint can then store that in db
 *  2) Verify the password by checking the stored hash for sign in operation
 */

module.exports = {
  getPasswordHash(password) {
    var result = {};

    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto
      .pbkdf2Sync(password, salt, 1000, 64, "sha512")
      .toString("hex");

    result.salt = salt;
    result.hash = hash;

    return result;
  },

  verifyPassword(password, passwordHash, salt) {
    const hash = crypto
      .pbkdf2Sync(password, salt, 1000, 64, "sha512")
      .toString("hex");

    if (hash === passwordHash) {
      return true;
    } else {
      return false;
    }
  }
};
