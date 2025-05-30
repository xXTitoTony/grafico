// index.js
const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT;

app.use(express.json());

app.post('/generar', async (req, res) => {
  const { ticker = 'BINANCE:BTCUSDT', intervalo = '1W' } = req.body;
  const nombreArchivo = `grafico_${ticker.replace(':', '_')}_${intervalo}.png`;
  const rutaArchivo = path.join(__dirname, nombreArchivo);

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    const url = `https://www.tradingview.com/chart/?symbol=${ticker}`;

    await page.goto(url, { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 8000));

    await page.screenshot({ path: rutaArchivo, fullPage: true });
    await browser.close();

    res.sendFile(rutaArchivo, () => {
      fs.unlinkSync(rutaArchivo);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en 0.0.0.0:${PORT}`);
});
