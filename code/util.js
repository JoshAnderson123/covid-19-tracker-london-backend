const axios = require("axios")
const cfg = require("./config")

const getData = async (queries) => {

  const endpoint = 'https://api.coronavirus.data.gov.uk/v1/data';
  const { data, status, statusText } = await axios.get(endpoint, {
    params: queries,
    timeout: 10000
  });
  if (status >= 400) throw new Error(statusText);
  return data
}


const getCases = async date => {

  const filters = [`areaType=utla`, `date=${date}`]
  const structure = {
    date: "date",
    name: "areaName",
    code: "areaCode",
    cases: {
      new: "newCasesByPublishDate",
      cumulative: "cumCasesByPublishDate"
    },
    deaths: {
      new: "newDeathsByDeathDate",
      cumulative: "cumDeathsByDeathDate"
    }
  }
  
  const apiParams = {
    filters: filters.join(";"),
    structure: JSON.stringify(structure),
  };

  const result = await getData(apiParams)
  if (!result.data) return null
  const londonData = result.data.filter(area => cfg.boroughNames.includes(area.name))
  return londonData
}

const caseFormatAPItoDB = data => {
  try {
    const formattedRecord = { date: data[0].date }
    const formattedData = data.reduce((acc, area) => [...acc, {
      name: area.name,
      cases: area.cases.new,
      deaths: area.deaths.new
    }], [])
    formattedRecord.data = formattedData
    return formattedRecord
  }
  catch (err) {
    return err
  }
}

const formatDate = date => {
  var d = new Date(date),
    month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2)
    month = '0' + month;
  if (day.length < 2)
    day = '0' + day;

  return [year, month, day].join('-');
}

const uploadAllCases = async () => {

  const startDateStr = "2020-03-15"
  const endDate = new Date("2020-12-25")

  let currentDate = new Date(startDateStr)
  while (currentDate <= endDate) {
    // console.log(formatDate(currentDate))
    axios.get(`http://localhost:8080/uploadCaseData?date=${formatDate(currentDate)}`)
    currentDate.setDate(currentDate.getDate() + 1);
  }
}

const uploadCases = async (currentDate, endDate) => {

  while (currentDate <= endDate) { // TODO - check if response was successful or not
    // console.log(formatDate(currentDate))
    axios.get(`http://localhost:8080/uploadCaseData?date=${formatDate(currentDate)}`)
    currentDate.setDate(currentDate.getDate() + 1);
  }
}



module.exports = {
  caseFormatAPItoDB,
  getData,
  getCases,
  uploadAllCases,
  uploadCases,
  formatDate
}