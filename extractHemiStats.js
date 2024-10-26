const axios = require('axios');
const cheerio = require('cheerio');
const readline = require('readline');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to format numbers
function formatNumber(num, isFeesAmount = false, isLastTxFee = false) {
  if (!num || num === '') return '0';
  num = num.replace(/[^\d.]/g, '');
  if (num.includes('.')) {
    const [whole, decimal] = num.split('.');
    if (isFeesAmount) {
      const decimals = isLastTxFee ? 5 : 2;
      const roundedDecimal = parseFloat(`0.${decimal}`).toFixed(decimals).split('.')[1];
      return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}.${roundedDecimal}`;
    }
    return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}.${decimal}`;
  }
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

async function getPubkeyFromBtcAddress(btcAddress) {
  try {
    const response = await axios.get(
      `https://testnet.popstats.hemi.network/pubkey/${btcAddress.toUpperCase()}.html`
    );

    const $ = cheerio.load(response.data);
    const metaRefresh = $('meta[http-equiv="refresh"]').attr('content');

    if (metaRefresh) {
      const match = metaRefresh.match(/pubkey\/([A-F0-9]+)\.html/i);
      if (match && match[1]) {
        return match[1];
      }
    }
    throw new Error('Pubkey not found in meta refresh');
  } catch (error) {
    console.error('Error converting BTC address:', error.message);
    return null;
  }
}

async function extractData(btcAddress) {
  try {
    console.log('\nConverting BTC address to pubkey...');
    const pubkey = await getPubkeyFromBtcAddress(btcAddress);
    if (!pubkey) {
      throw new Error('Failed to convert BTC address to pubkey');
    }
    console.log('Found pubkey:', pubkey);

    const url = `https://testnet.popstats.hemi.network/pubkey/${pubkey}.html`;
    console.log('Fetching data...\n');

    const axiosInstance = axios.create({
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      }
    });

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

    // Formatted display
    console.log('**All-Time Statistics**');
    console.log(`* Total PoP Txs: ${formatNumber(allTimeData.totalTxs)}`);
    console.log(`* Total Keystones Mined: ${formatNumber(allTimeData.totalKeystones)}`);
    console.log(`* Total PoP Fees: ${formatNumber(allTimeData.totalFees, true)} BTC`);
    
    console.log('\n**24-Hour Statistics**');
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
    console.error('\nError:', error.message);
  }

  askForAnother();
}

function askForAnother() {
  rl.question('\nWould you like to lookup another BTC address? (Y/N): ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      askForInput();
    } else {
      console.log('Goodbye!');
      rl.close();
    }
  });
}

function askForInput() {
  rl.question('Enter a Bitcoin address to lookup: ', (input) => {
    if (input.trim() === '') {
      console.log('Bitcoin address cannot be empty.');
      askForInput();
    } else {
      extractData(input);
    }
  });
}

// Welcome message and startup
console.log('Welcome to Hemi Network Statistics Extractor!');
console.log('Enter a Bitcoin address to get PoP mining statistics.\n');
askForInput();
