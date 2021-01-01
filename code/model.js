const mongoose = require("mongoose");
const Schema = mongoose.Schema

const cases = new Schema({
  date: {type: String},
  data: []
}, {
  versionKey: false
});

const config = new Schema({
  startDate: {type: String},
  endDate: {type: String}
}, {
  versionKey: false
});

module.exports = {
  cases: mongoose.model("cases", cases, "cases"),
  config: mongoose.model("config", config, "config")
}