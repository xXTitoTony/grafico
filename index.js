const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/generar', async (req, res) => {
  const { ticker = 'BINANCE:BTCUSDT', intervalo = '1W' } = req.body;
  const nombreArchivo = `grafico_${ticker.replace(':', '_')}_${intervalo}.png`;
  const rutaArchivo = path.join(__dirname, nombreArchivo);

  try {
    console.log('⏳ Lanzando navegador...');
    const browser = await puppeteer.launch({
      headless: true, // Clásico, no 'new'
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    const url = `https://www.tradingview.com/chart/?symbol=${ticker}`;
    console.log(`🌐 Navegando a: ${url}`);

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    console.log('🕒 Esperando a que cargue el gráfico...');
    await new Promise(resolve => setTimeout(resolve, 8000));

    console.log('📈 Intentando abrir panel de indicadores...');
    try {
      await page.evaluate(() => {
        const indicatorsButton = document.querySelector('[data-name="indicator-button"]');
        if (indicatorsButton) indicatorsButton.click();
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      await page.evaluate(() => {
        const input = document.querySelector('[data-role="search-input"] input');
        if (input) {
          input.value = 'MACD';
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      await page.evaluate(() => {
        const result = document.querySelector('[data-role="search-result"]');
        if (result) result.click();
      });

      console.log('✅ MACD añadido');
    } catch (macdError) {
      console.log('⚠️ Error añadiendo MACD:', macdError.message);
    }

    console.log('📷 Capturando imagen...');
    await page.screenshot({ path: rutaArchivo, fullPage: true });
    await browser.close();

    console.log('✅ Imagen generada. Enviando archivo...');
    res.sendFile(rutaArchivo, () => {
      fs.unlinkSync(rutaArchivo); // Borra el archivo después de enviarlo
    });
  } catch (err) {
    console.error('❌ Error general:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en 0.0.0.0:${PORT}`);
});
