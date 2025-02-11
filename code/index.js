const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")
const compression = require('compression')
const model = require("./model")
const axios = require("axios")
const cfg = require("./config")
const util = require("./util")

const PORT = process.env.PORT || 8080;
const app = express()
app.use(cors());
app.use(compression());


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

router.route("/test").get((req, res) => {
  res.send("Hello World!")
})

router.route("/fetchFromAPI").get((req, res) => {
  util.getCases(req.query.date).then(result => {
    res.send(result)
  }, error => {
    res.send(error)
  })
})

router.route("/uploadCaseData").get((req, res) => {

  uploadCase(req.query.date, (err, result) => {
    if (err) res.send(err)
    else res.send(result)
  })
})

router.route("/getCaseData").get((req, res) => {
  model.cases.find({}, (err, result) => {
    if (err) res.send(err)
    else res.send(result)
  })
})

router.route("/getProccessedData").get((req, res) => {
  model.cases.find({}, (err, result) => {
    if (err) res.send(err)
    const arr = processCaseData(result, req.query.area)
    res.send(arr)
  })
})

router.route("/getConfigData").get((req, res) => {
  model.config.find({}, (err, result) => {
    if (err) res.send(err)
    else res.send(result)
  })
})



/// START SERVER ///
app.listen(PORT, () => {
  console.log("Server is running on Port: " + PORT);
  updateRecords()
  setInterval(updateRecords, 24 * 60 * 60 * 1000) // Use this once the server is ready to upload
});


/// UPDATE RECORDS ///
function updateRecords() {
  model.config.find({}, (err, result) => {

    const currentDate = new Date(util.formatDate(new Date()))
    const endDate = new Date(result[0].endDate)

    const endDateAdd1 = new Date(endDate) // Accounts for the day lag in getting results
    endDateAdd1.setDate(endDate.getDate() + 1);
    const currentDateMin1 = new Date(currentDate) // Accounts for the day lag in getting results
    currentDateMin1.setDate(currentDate.getDate() - 1);

    if (currentDate > endDateAdd1) {
      console.log(`Updating Records. Last Date: ${endDate}, Current Date: ${currentDate}`)
      uploadCases(endDate, currentDateMin1)
      model.config.findOneAndUpdate({}, { endDate: util.formatDate(currentDateMin1) }, { upsert: true }, (err, result) => {
        if (err) console.log(`Error updating new date: ${err}`)
        else console.log(`Success updating new date: ${result}`)
      })
    } else {
      console.log(`Records up to date. Current date: ${util.formatDate(currentDate)}. Latest date: ${util.formatDate(currentDateMin1)}`)
    }
  })
}

/// UPLOAD CASES ///
async function uploadCase(date, callback) {

  util.getCases(date).then(result => {

    console.log("Date:", date, ". Result from API:", result)
    const formattedResult = util.caseFormatAPItoDB(result)

    model.cases.findOneAndUpdate({ date }, formattedResult, { upsert: true }, (err, result) => {
      if (err) callback(err, null)
      else callback(null, result)
    })
  }, error => {
    callback(error, null)
  })
}

async function uploadCases(currentDate, endDate) {

  while (currentDate <= endDate) {
    uploadCase(util.formatDate(currentDate), (err, result) => { console.log(err, result) })
    currentDate.setDate(currentDate.getDate() + 1);
  }
}

function processCaseData(data, areaName) {

  const d = data.sort((a, b) => a.date < b.date ? -1 : 1)
  const caseArr = [], deathArr = []

  for (let i = 0; i < d.length; i++) {
    const dateData = d[i].data

    const dailyCases = areaName ?
      dateData.filter(area => area.name === areaName)[0].cases :
      dateData.reduce((acc, area) => acc + area.cases, 0)
    caseArr.push(dailyCases)

    const dailyDeaths = areaName ?
      dateData.filter(area => area.name === areaName)[0].deaths :
      dateData.reduce((acc, area) => acc + area.deaths, 0)
    deathArr.push(dailyDeaths)
  }

  return {"area": areaName ? areaName : "London", "cases": caseArr, "deaths": deathArr}
}