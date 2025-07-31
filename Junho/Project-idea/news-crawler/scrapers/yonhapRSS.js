function parse(xmlObj) {
    const items = xmlObj.rss.channel.item ?? [];
    return items.map((it) => ({
      title: it.title,
      url:   it.link,
      summary: it.description ?? ''
    }));
  }
  
  module.exports = { parse };
  