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

    // Navega al gráfico
    const url = `https://www.tradingview.com/chart/?symbol=${ticker}`;
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Espera que cargue el chart
    await page.waitForSelector('body');
    await new Promise(resolve => setTimeout(resolve, 8000));

    // Inyecta script para abrir el panel de indicadores y buscar MACD
    await page.evaluate(() => {
      // Abre el panel de indicadores
      const indicatorsButton = document.querySelector('[data-name="indicator-button"]');
      if (indicatorsButton) indicatorsButton.click();
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    await page.evaluate(() => {
      // Escribe "MACD" en el input de búsqueda
      const input = document.querySelector('[data-role="search-input"] input');
      if (input) {
        input.value = 'MACD';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    await page.evaluate(() => {
      // Hace clic en el primer resultado (el indicador MACD)
      const result = document.querySelector('[data-role="search-result"]');
      if (result) result.click();
    });

    // Espera a que se añada el indicador
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Toma la captura
    await page.screenshot({ path: rutaArchivo, fullPage: true });
    await browser.close();

    res.sendFile(rutaArchivo, () => {
      fs.unlinkSync(rutaArchivo);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
