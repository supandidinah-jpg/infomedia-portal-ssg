module.exports = async function() {
  const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTOR-H3PkvgbIGzPxTWPi9pW0OD8_R85gI54eE79fTq5t_HwO2QxP8cQkO_B4x7vX_b33Qx8Q_72w_/pub?output=csv';

  try {
    const response = await fetch(SHEET_CSV_URL);
    const csvText = await response.text();
    
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    const articles = lines.slice(1).reverse().map(line => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      let item = {};
      headers.forEach((header, index) => {
        item[header] = values[index] || '';
      });

      const judul = item.judul || item.Judul || 'tanpa-judul';
      const slug = judul.toLowerCase().trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');

      return { ...item, slug };
    });

    return articles;
  } catch (error) {
    console.error("Gagal mengambil data CSV:", error);
    return [];
  }
};
