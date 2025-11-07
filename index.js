const { Client, GatewayIntentBits } = require('discord.js');
const fetch = require('node-fetch');

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ] 
});

const USER_ID = '646808808623448094'; // Twój ID
const CHANNEL_ID = '14335245645475745887'; // ID kanału #ogólny
let lastPrice = null;

client.once('ready', () => {
  console.log('Bot działa!');
  setInterval(sendPrice, 60000);
  sendPrice();
});

async function sendPrice() {
  try {
    const apis = [
      'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true',
      'https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT'
    ];

    let price = null;
    let change = 0;

    for (const api of apis) {
      try {
        const res = await fetch(api);
        const data = await res.json();
        if (api.includes('coingecko')) {
          price = data.solana?.usd;
          change = data.solana?.usd_24h_change || 0;
        } else {
          price = parseFloat(data.price);
        }
        if (price) break;
      } catch {}
    }

    if (!price) throw new Error('No price');

    const channel = client.channels.cache.get(CHANNEL_ID);
    if (!channel) return;

    const embed = {
      title: 'Solana (SOL)',
      fields: [
        { name: 'Cena', value: `$${price.toFixed(2)}`, inline: true },
        { name: '24h', value: `${change >= 0 ? '🟢' : '🔴'} ${change.toFixed(2)}%`, inline: true }
      ],
      footer: { text: 'Grok AI • co minutę' },
      color: 0x14F195
    };

    await channel.send({ embeds: [embed] });

    if (lastPrice && Math.abs((price - lastPrice) / lastPrice * 100) > 5) {
      const user = await client.users.fetch(USER_ID);
      user.send(`**ALERT SOLANA** ⚡\nCena: $${price.toFixed(2)}\nZmiana: ${Math.abs((price - lastPrice) / lastPrice * 100).toFixed(1)}%`);
    }
    lastPrice = price;
  } catch (e) {
    console.log('Błąd:', e);
    const channel = client.channels.cache.get(CHANNEL_ID);
    if (channel) channel.send('⚠️ Błąd pobierania ceny SOL – próbuję dalej...');
  }
}

client.login(process.env.BOT_TOKEN);
