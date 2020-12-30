const e = require("express");
const mongoose = require("mongoose");
const Schema = mongoose.Schema

let cases = new Schema({
  date: {type: String},
  data: []
}, {
  versionKey: false
});

module.exports = mongoose.model("cases", cases);