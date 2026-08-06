const Papa = require('papaparse');

module.exports = async function() {
  const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTOR-H3PkvgbIGzPxTWPi9pW0OD8_R85gI54eE79fTq5t_HwO2QxP8cQkO_B4x7vX_b33Qx8Q_72w_/pub?output=csv'; // Sesuaikan URL CSV kamu jika beda

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
