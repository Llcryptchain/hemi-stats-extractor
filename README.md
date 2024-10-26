# hemi-stats-extractor
A command-line tool to extract and display PoP miners statistics from Hemi Network (testnet) for a given Bitcoin (P2PKH) Address.

📋 **Description**
This script extracts and displays three types of statistics for a given Bitcoin Address:
- All-Time Statistics (total transactions, keystones, and fees)
- 24-Hour Statistics
- Last PoP Transaction Details

🚀 **Installation**

1. Clone the repository:
git clone https://github.com/Llcryptchain/hemi-stats-extractor.git

2. Navigate to the folder:
cd hemi-stats-extractor

3. Install dependencies:
pm install

💻 **Usage**

1. Run the script:
node extractHemiStats.js

2. Enter the Bitcoin Address when prompted

3. Statistics will be displayed in this format:

**All-Time Statistics**
* Total PoP Txs: XXX
* Total Keystones Mined: XXX
* Total PoP Fees: XXX BTC

**24-Hour Statistics**
* PoP Txs: XXX
* Unique Keystones Mined: XXX
* PoP Fees: XXX BTC
* Avg PoP Fee Rate: XXX

**Last PoP Transaction**
* Hemi Keystone #: XXX
* Fee: XXX BTC
* Fee Rate: XXX
* BTC Block #: XXX
* Timestamp: XXX

🔧 **Technologies Used**
- Node.js
- axios (for HTTP requests)
- cheerio (for HTML parsing)

📌 Sample Bitcoin Address for Testing
mhTpVABN9CpzheKdMBmNVPE7hFNgCmmbcg

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
