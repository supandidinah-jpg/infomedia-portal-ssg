const https = require('https');

module.exports = async function() {
  const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT0R-H3PkvgbIGzPxTWPi9pWOg0DFtsgWQcKlvbkbcRF-V9ClJqwUObdHXKcM4U8mG2H7wcO-9lSSR/pub?output=csv';

  return new Promise((resolve) => {
    https.get(SHEET_CSV_URL, (res) => {
      // Handle Redirect dari Google Sheets jika ada
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
  if (!csvText || csvText.includes('<!DOCTYPE html>')) return [];

  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());

  return lines.slice(1).map(line => {
    const matches = line.match(/(?:[^\",]+|\"[^\"]*\")+/g) || [];
    const values = matches.map(v => v.trim().replace(/^"|"$/g, ''));

    let item = {};
    headers.forEach((header, index) => {
      item[header] = values[index] || '';
    });

    // Buat slug otomatis untuk URL berita yang ramah SEO Google
    const judulRaw = item.judul || item["judul artikel"] || 'berita';
    item.slug = judulRaw.toLowerCase().trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');

    return item;
  }).reverse();
}
