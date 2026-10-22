export async function onRequestGet({ env }) {
  try {
    // Fetch paralel biar cepat
    const [btcRes, xauRes] = await Promise.all([
      fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT'),
      fetch('https://api.gold-api.com/price/XAU')
    ]);

    const btc = await btcRes.json();
    const xau = await xauRes.json();

    return Response.json({
      btcusd: {
        price: parseFloat(btc.lastPrice),
        change: parseFloat(btc.priceChangePercent),
        high: parseFloat(btc.highPrice),
        low: parseFloat(btc.lowPrice),
        source: 'Binance Real'
      },
      xauusd: {
        price: parseFloat(xau.price),
        change: xau.ch || 0, // gold-api gak kasih % change, kita hitung di frontend
        source: 'Gold Spot Real'
      },
      timestamp: Date.now()
    }, {
      headers: {
        'Cache-Control': 'public, max-age=2', // cache 2 detik biar super cepat tapi tetap real
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}