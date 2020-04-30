const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false
  },
  phoneNumber: {
    type: String,
    required: false
  },
  location: {
    type: String,
    required: false
  },
  timeZone: {
    type: String,
    required: false
  }
});

module.exports = Users = mongoose.model("Users", userSchema);
