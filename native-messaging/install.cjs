const fs = require('fs');
const path = require('path');
const os = require('os');

const hostName = 'com.jobhunter.scrapers';
const extensionIdFirefox = 'abc@gmail.com'; 
const hostPath = path.join(__dirname, 'host.cjs');

const manifestFirefox = {
  "name": hostName,
  "description": "Native messaging host for saving/loading local scrapers.",
  "path": hostPath,
  "type": "stdio",
  "allowed_extensions": [ extensionIdFirefox ]
};

const manifestChrome = {
  "name": hostName,
  "description": "Native messaging host for saving/loading local scrapers.",
  "path": hostPath,
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://*/" // allow any chrome extension while developing unpacked
  ]
};

const homeDir = os.homedir();
const firefoxDir = path.join(homeDir, 'Library', 'Application Support', 'Mozilla', 'NativeMessagingHosts');
const chromeDir = path.join(homeDir, 'Library', 'Application Support', 'Google', 'Chrome', 'NativeMessagingHosts');

console.log(`Setting up Native Messaging Host for: ${hostName}`);

try {
  // Firefox
  if (!fs.existsSync(firefoxDir)) {
      fs.mkdirSync(firefoxDir, { recursive: true });
  }
  fs.writeFileSync(path.join(firefoxDir, `${hostName}.json`), JSON.stringify(manifestFirefox, null, 2));
  console.log(`✅ Installed Firefox manifest to ${firefoxDir}`);
  
  // Chrome
  if (!fs.existsSync(chromeDir)) {
      fs.mkdirSync(chromeDir, { recursive: true });
  }
  fs.writeFileSync(path.join(chromeDir, `${hostName}.json`), JSON.stringify(manifestChrome, null, 2));
  console.log(`✅ Installed Chrome manifest to ${chromeDir}`);

} catch (err) {
  console.error("Failed to install manifest:", err);
}
