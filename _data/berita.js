const https = require('https');

module.exports = async function() {
  const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT0R-H3PkvgbIGzPxTWPi9pWOg0DFtsgWQcKlvbkbcRF-V9ClJqwUObdHXKcM4U8mG2H7wcO-9lSSR/pub?output=csv';

  return new Promise((resolve) => {
    https.get(SHEET_CSV_URL, (res) => {
      let csvData = '';

      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, (redirectRes) => {
          redirectRes.on('data', chunk => csvData += chunk);
          redirectRes.on('end', () => resolve(processCSV(csvData)));
        });
        return;
      }

      res.on('data', chunk => csvData += chunk);
      res.on('end', () => resolve(processCSV(csvData)));
    }).on('error', (err) => {
      console.error("Gagal Fetch CSV:", err);
      resolve([]);
    });
  });
};

function processCSV(csvText) {
  if (!csvText || csvText.includes('<!DOCTYPE html>')) return [];

  const lines = csvText.split(/\r?\n(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).filter(line => line.trim() !== '');
  if (lines.length < 2) return [];

  return lines.slice(1).map((line, index) => {
    const matches = line.match(/(?:[^\",]+|\"[^\"]*\")+/g) || [];
    const values = matches.map(v => v.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));

    const judul = values[0] || `Artikel ${index + 1}`;
    const slug = judul.toLowerCase().trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');

    return {
      judul: judul,
      kategori: values[1] || 'BERITA',
      tanggal: values[2] || '',
      penulis: values[3] || 'Supandi',
      gambar: values[4] || '',
      caption: values[6] || '',
      isi_berita: values[7] || values[5] || '',
      slug: slug || `post-${index + 1}`
    };
  }).reverse();
}
