const axios = require('axios');
const cheerio = require('cheerio');
const readline = require('readline');

// Création de l'interface readline
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Fonction pour formater les nombres
function formatNumber(num, isFeesAmount = false, isLastTxFee = false) {
  if (!num || num === '') return '0';
  
  // Nettoyer le nombre
  num = num.replace(/[^\d.]/g, '');
  
  if (num.includes('.')) {
    const [whole, decimal] = num.split('.');
    if (isFeesAmount) {
      // 5 décimales pour le dernier fee, 2 pour les autres
      const decimals = isLastTxFee ? 5 : 2;
      const roundedDecimal = parseFloat(`0.${decimal}`).toFixed(decimals).split('.')[1];
      return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}.${roundedDecimal}`;
    }
    return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}.${decimal}`;
  }
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

async function extractPubkeyData(pubkey) {
  const url = `https://testnet.popstats.hemi.network/pubkey/${pubkey}.html`;
  
  const axiosInstance = axios.create({
    timeout: 10000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    }
  });

  try {
    console.log('\nRécupération des données pour la pubkey:', pubkey);
    const response = await axiosInstance.get(url);
    const $ = cheerio.load(response.data);
    
    // All-Time Statistics
    const allTimeStats = $('h2:contains("All-Time Statistics:")').next('table');
    const allTimeData = {
      totalTxs: allTimeStats.find('tr:eq(1) td:eq(0)').text().trim(),
      totalKeystones: allTimeStats.find('tr:eq(1) td:eq(1)').text().trim(),
      totalFees: allTimeStats.find('tr:eq(1) td:eq(2)').text().trim()
    };
    
    // 24-Hour Statistics
    const h24Stats = $('h2:contains("24-Hour Statistics:")').next('table');
    const h24Data = {
      popTxs: h24Stats.find('tr:eq(1) td:eq(0)').text().trim(),
      uniqueKeystones: h24Stats.find('tr:eq(1) td:eq(1)').text().trim(),
      popFees: h24Stats.find('tr:eq(1) td:eq(2)').text().trim(),
      avgFeeRate: h24Stats.find('tr:eq(1) td:eq(3)').text().trim()
    };

    // Last PoP Transaction
    const lastTxStats = $('h2:contains("Last PoP Transaction:")').next('table');
    const lastTxData = {
      keystoneId: lastTxStats.find('tr:eq(1) td:eq(0)').text().trim(),
      fee: lastTxStats.find('tr:eq(1) td:eq(1)').text().trim().replace(' BTC', ''),
      feeRate: lastTxStats.find('tr:eq(1) td:eq(2)').text().trim(),
      btcBlock: lastTxStats.find('tr:eq(1) td:eq(3)').text().trim(),
      timestamp: lastTxStats.find('tr:eq(1) td:eq(4)').text().trim()
    };

    // Affichage formaté
    console.log('\n**Statistiques All-Times**');
    console.log(`* Total PoP Txs: ${formatNumber(allTimeData.totalTxs)}`);
    console.log(`* Total Keystones Mined: ${formatNumber(allTimeData.totalKeystones)}`);
    console.log(`* Total PoP Fees: ${formatNumber(allTimeData.totalFees, true)} BTC`);
    
    console.log('\n**Statistiques H24**');
    console.log(`* PoP Txs: ${formatNumber(h24Data.popTxs)}`);
    console.log(`* Unique Keystones Mined: ${formatNumber(h24Data.uniqueKeystones)}`);
    console.log(`* PoP Fees: ${formatNumber(h24Data.popFees, true)} BTC`);
    console.log(`* Avg PoP Fee Rate: ${h24Data.avgFeeRate}`);

    console.log('\n**Last PoP Transaction**');
    console.log(`* Hemi Keystone #: ${lastTxData.keystoneId}`);
    console.log(`* Fee: ${formatNumber(lastTxData.fee, true, true)} BTC`);
    console.log(`* Fee Rate: ${lastTxData.feeRate}`);
    console.log(`* BTC Block #: ${lastTxData.btcBlock}`);
    console.log(`* Timestamp: ${lastTxData.timestamp}`);

  } catch (error) {
    console.error('\nErreur lors de la récupération:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText
    });
  }

  // Demander si l'utilisateur veut chercher une autre pubkey
  askForAnotherPubkey();
}

function askForAnotherPubkey() {
  rl.question('\nVoulez-vous consulter une autre pubkey? (O/N): ', (answer) => {
    if (answer.toLowerCase() === 'o' || answer.toLowerCase() === 'oui') {
      askForPubkey();
    } else {
      console.log('Au revoir!');
      rl.close();
    }
  });
}

function askForPubkey() {
  rl.question('Entrez la pubkey à consulter: ', (pubkey) => {
    if (pubkey.trim() === '') {
      console.log('La pubkey ne peut pas être vide.');
      askForPubkey();
    } else {
      extractPubkeyData(pubkey);
    }
  });
}

// Message d'accueil et démarrage
console.log('Bienvenue dans le script de consultation des statistiques Hemi Network!\n');
askForPubkey();