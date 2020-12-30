const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")
const model = require("./model")
const axios = require("axios")
const cfg = require("./config")
const util = require("./util")

const PORT = 8080;
const app = express()
app.use(cors());


/// CONNECT TO MONGODB ///
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect("mongodb+srv://josha:V82K1AjCfnspjvhu@cluster0.ami9e.mongodb.net/covidTracker?retryWrites=true&w=majority", {
  useNewUrlParser: true
});
const connection = mongoose.connection;
connection.once("open", function () {
  console.log("Connection with MongoDB was successful");
});


/// CREATE ROUTES ///
const router = express.Router();
app.use("/", router);

router.route("/loadData").get((req, res) => {
  util.getCases(req.query.date).then(result => {
    const formattedResult = util.caseFormatAPItoDB(result)
    res.send(formattedResult)
  }, error => {
    res.send(`error: ${error}`)
  })
})

router.route("/uploadCaseData").get((req, res) => {

  const date = req.query.date

  util.getCases(date).then(result => {

    const formattedResult = util.caseFormatAPItoDB(result)

    model.findOneAndUpdate({date}, formattedResult, {upsert: true}, (err, result) => {
      if (err) res.send(err)
      else res.send(result)
    })
  }, error => {
    res.send(`error: ${error}`)
  })
})

router.route("/getData").get((req, res) => {
  model.find({}, (err, result) => {
    if (err) res.send(err)
    else res.send(result)
  })
})

router.route("/deleteAll").get((req, res) => {
  model.deleteMany({}, (err, result) => {
    if (err) res.send(err)
    else res.send(result)
  })
})

router.route("/uploadDates").get((req, res) => {
  util.uploadAllCases()
  res.send("success")
})


/// START SERVER ///
app.listen(PORT, function () {
  console.log("Server is running on Port: " + PORT);
});