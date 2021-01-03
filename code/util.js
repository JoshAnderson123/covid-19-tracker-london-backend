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

module.exports = {
  caseFormatAPItoDB,
  getCases,
  formatDate
}