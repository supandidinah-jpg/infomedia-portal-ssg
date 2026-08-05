const Papa = require('papaparse');

module.exports = async function() {
  const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT0R-H3PkvgbIGzPXyTWPi9pWOg0DFtsgWQcKlvbkbcRF-V9ClJqwUObdHXKcM4U8mG2H7wcO-9lSSR/pub?output=csv';

  const response = await fetch(SHEET_CSV_URL);
  const csvText = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const articles = results.data.reverse().map(item => {
          const judul = item.judul || item.Judul || 'tanpa-judul';
          const slug = judul.toLowerCase().trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-');
          
          return { ...item, slug };
        });
        resolve(articles);
      },
      error: (err) => reject(err)
    });
  });
};
