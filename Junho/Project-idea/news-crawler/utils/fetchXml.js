const axios = require('axios');
const xml2js = require('xml2js');

async function fetchXml(url) {
  const { data } = await axios.get(url, { timeout: 10000 });
  return xml2js.parseStringPromise(data, { explicitArray: false });
}

module.exports = { fetchXml };
