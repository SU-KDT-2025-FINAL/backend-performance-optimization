const axios = require('axios');

async function fetchHtml(url) {
  const { data } = await axios.get(url, {
    headers: {
      // 모바일 UA
      'User-Agent':
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
      'Accept':
        'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    },
    timeout: 10000,
    maxRedirects: 5
  });
  return data;
}

module.exports = { fetchHtml };
