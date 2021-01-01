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

    model.cases.findOneAndUpdate({date}, formattedResult, {upsert: true}, (err, result) => {
      if (err) res.send(err)
      else res.send(result)
    })
  }, error => {
    res.send(`error: ${error}`)
  })
})

router.route("/showCaseData").get((req, res) => {

  const date = req.query.date

  util.getCases(date).then(result => {

    if (!result) {
      res.send(`Covid-19 API returned no data for ${date}`)
      return
    }

    const formattedResult = util.caseFormatAPItoDB(result)
    res.send(formattedResult)

  }, error => {

    res.send(`error: ${error}`)
  })
})

router.route("/getCaseData").get((req, res) => {
  model.cases.find({}, (err, result) => {
    if (err) res.send(err)
    else res.send(result)
  })
})

router.route("/getConfigData").get((req, res) => {
  model.config.find({}, (err, result) => {
    if (err) res.send(err)
    else res.send(result)
  })
})

router.route("/deleteAll").get((req, res) => {
  model.cases.deleteMany({}, (err, result) => {
    if (err) res.send(err)
    else res.send(result)
  })
})

router.route("/deleteRecord").get((req, res) => {

  const date = req.query.date

  model.cases.deleteMany({date: date}, (err, result) => {
    if (err) res.send(err)
    else res.send(result)
  })
})

router.route("/uploadDates").get((req, res) => {
  util.uploadAllCases()
  res.send("success")
})

router.route("/currentDate").get((req, res) => {
  const currentDate = util.formatDate(new Date())
  res.send(currentDate > "null")
})

router.route("/getDateSpan").get((req, res) => {
  model.config.find({}, (err, result) => {

    const startDate = new Date(result[0].startDate)
    const endDate = new Date(result[0].endDate)
    const dateSpan = Math.round((endDate - startDate) / (24*60*60*1000))

    if (err) res.send(err)
    else res.send(`${dateSpan}`)
  })
})


/// START SERVER ///
app.listen(PORT, () => {
  console.log("Server is running on Port: " + PORT);
  updateRecords()
  //setInterval(updateRecords, 24*60*60*1000) // Use this once the server is ready to upload
});


/// UPDATE RECORDS ///
function updateRecords() {
  model.config.find({}, (err, result) => {

    const currentDate = new Date(util.formatDate(new Date()))
    const endDate = new Date(result[0].endDate)

    if (currentDate > endDate) {
      console.log(`Updating Records. Last Date: ${endDate}, Current Date: ${currentDate}`)
      util.uploadCases(endDate, currentDate-1)
      model.config.findOneAndUpdate({}, {endDate: util.formatDate(currentDate)}, {upsert: true}, (err, result) => {
        if (err) console.log(`Error updating new date: ${err}`)
        else console.log(`Success updating new date: ${result}`)
      })
    } else {
      console.log(`Records up to date. Current date: ${util.formatDate(currentDate)}`)
    }
  })
}