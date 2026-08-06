const https = require('https');

module.exports = async function() {
  const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT0R-H3PkvgbIGzPxTWPi9pWOg0DFtsgWQcKlvbkbcRF-V9ClJqwUObdHXKcM4U8mG2H7wcO-9lSSR/pub?output=csv';

  return new Promise((resolve) => {
    https.get(SHEET_CSV_URL, (res) => {
      // Handle redirect dari Google Sheets jika ada
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, (redirectRes) => {
          let data = '';
          redirectRes.on('data', chunk => data += chunk);
          redirectRes.on('end', () => resolve(parseCSV(data)));
        });
        return;
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(parseCSV(data)));
    }).on('error', (err) => {
      console.error("Gagal Fetch CSV:", err);
      resolve([]);
    });
  });
};

function parseCSV(csvText) {
  if (!csvText || csvText.includes('<!DOCTYPE html>')) {
    console.error("Data yang diterima bukan CSV Valid / Google Sheet belum di-publish ke Web");
    return [];
  }

  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) return [];

  // Ambil Header Nama Kolom (dijadikan huruf kecil semua)
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());

  const articles = lines.slice(1).reverse().map(line => {
    // Regex fleksibel untuk memisah koma walaupun ada teks dalam tanda petik
    const matches = line.match(/(?:[^\",]+|\"[^\"]*\")+/g) || [];
    const values = matches.map(v => v.trim().replace(/^"|"$/g, ''));

    let item = {};
    headers.forEach((header, index) => {
      item[header] = values[index] || '';
    });

    return item;
  });

  return articles;
}
