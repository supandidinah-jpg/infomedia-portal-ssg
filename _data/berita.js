const https = require('https');
const { parse } = require('csv-parse/sync');

module.exports = async function() {
  const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT0R-H3PkvgbIGzPxTWPi9pWOg0DFtsgWQcKlvbkbcRF-V9ClJqwUObdHXKcM4U8mG2H7wcO-9lSSR/pub?output=csv';

  return new Promise((resolve) => {
    https.get(SHEET_CSV_URL, (res) => {
      let csvData = '';
      
      // Jika Google Sheet melakukan Redirect
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

  try {
    // Parser CSV standar industri (aman dari enter & tanda petik di isi berita)
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    return records.map((row, index) => {
      const judul = row.judul || row.Judul || `artikel-${index + 1}`;
      
      // Slug URL SEO Google
      const slug = judul.toLowerCase().trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');

      return {
        judul: judul,
        kategori: row.kategori || 'BERITA',
        tanggal: row.tanggal || '',
        penulis: row.penulis || 'Supandi',
        gambar: row.gambar || '',
        caption: row.deskripsi_1 || row.deskripsi || '', 
        isi_berita: row.isi_berita || row.isi || '',
        slug: slug || `post-${index + 1}`
      };
    }).reverse();
  } catch (error) {
    console.error("Error parsing CSV:", error);
    return [];
  }
}
