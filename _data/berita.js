const https = require('https');

module.exports = async function() {
  const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT0R-H3PkvgbIGzPxTWPi9pWOg0DFtsgWQcKlvbkbcRF-V9ClJqwUObdHXKcM4U8mG2H7wcO-9lSSR/pub?output=csv';

  return new Promise((resolve) => {
    https.get(SHEET_CSV_URL, (res) => {
      // Handle Redirect dari Google Sheets
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

  // Pisahkan baris dengan regex yang aman dari enter di dalam teks berita
  const lines = csvText.split(/\r?\n(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).filter(line => line.trim() !== '');
  if (lines.length < 2) return [];

  // Header dari Google Sheets: judul, kategori, tanggal, penulis, gambar, deskripsi, deskripsi_2, isi_berita
  return lines.slice(1).map(line => {
    // Regex split koma yang aman untuk sel dengan koma/tanda petik
    const matches = line.match(/(?:[^\",]+|\"[^\"]*\")+/g) || [];
    const values = matches.map(v => v.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));

    const item = {
      judul: values[0] || '',
      kategori: values[1] || 'BERITA',
      tanggal: values[2] || '',
      penulis: values[3] || 'Redaksi',
      gambar: values[4] || '',
      caption: values[6] || '',      // Kolom G (deskripsi kedua/sumber foto)
      isi_berita: values[7] || ''   // Kolom H (isi berita utama)
    };

    // Buat slug otomatis dari judul untuk URL SEO Google
    item.slug = item.judul.toLowerCase().trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');

    return item;
  }).filter(item => item.judul !== '').reverse();
}
