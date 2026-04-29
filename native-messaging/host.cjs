#!/usr/local/bin/node

const fs = require('fs');
const path = require('path');

// Keep track of buffer state
let lengthBytes = Buffer.alloc(0);
let messageBytes = Buffer.alloc(0);
let messageLength = -1;

// The directory where we save scrapers
const SCRAPERS_DIR = path.join(__dirname, '..', 'scrapers');

// Ensure directory exists
if (!fs.existsSync(SCRAPERS_DIR)) {
    fs.mkdirSync(SCRAPERS_DIR, { recursive: true });
}

function sendMessage(msgObj) {
    const msgBuffer = Buffer.from(JSON.stringify(msgObj), 'utf8');
    const header = Buffer.alloc(4);
    header.writeUInt32LE(msgBuffer.length, 0);
    process.stdout.write(header);
    process.stdout.write(msgBuffer);
}

function handleMessage(msg) {
    try {
        if (!msg || !msg.type) {
            sendMessage({ status: 'error', error: 'Invalid message format' });
            return;
        }

        if (msg.type === 'CHOOSE_FILE') {
            try {
                // AppleScript to prompt for a file, returns POSIX path
                const result = require('child_process').execSync(
                    `osascript -e 'POSIX path of (choose file with prompt "Select your scraper JS file")'`,
                    { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
                );

                const chosenPath = result.trim();

                if (chosenPath && fs.existsSync(chosenPath)) {
                    const code = fs.readFileSync(chosenPath, 'utf8');
                    sendMessage({ status: 'success', type: 'CHOOSE_FILE', absolutePath: chosenPath, code });
                } else {
                    sendMessage({ status: 'not_found', type: 'CHOOSE_FILE', error: 'File not found' });
                }
            } catch (err) {
                // Usually err means the user canceled the dialog
                sendMessage({ status: 'canceled', type: 'CHOOSE_FILE' });
            }
        }
        else if (msg.type === 'SAVE_FILE') {
            let filePath = msg.absolutePath;
            if (!filePath) {
                const fileName = msg.name.replace(/[^a-zA-Z0-9_-]/gi, '_') + '.js';
                filePath = path.join(SCRAPERS_DIR, fileName);
            }
            fs.writeFileSync(filePath, msg.code, 'utf8');
            sendMessage({ status: 'success', type: 'SAVE_FILE' });
        }
        else if (msg.type === 'LOAD_FILE') {
            let filePath = msg.absolutePath;
            if (!filePath) {
                const fileName = msg.name.replace(/[^a-zA-Z0-9_-]/gi, '_') + '.js';
                filePath = path.join(SCRAPERS_DIR, fileName);
            }

            if (fs.existsSync(filePath)) {
                const code = fs.readFileSync(filePath, 'utf8');
                sendMessage({ status: 'success', type: 'LOAD_FILE', code });
            } else {
                sendMessage({ status: 'not_found', type: 'LOAD_FILE' });
            }
        }
        else {
            sendMessage({ status: 'error', error: `Unknown message type: ${msg.type}` });
        }
    } catch (e) {
        sendMessage({ status: 'error', error: e.message });
    }
}


// Read from stdin chunk by chunk
process.stdin.on('data', (chunk) => {
    let unread = Buffer.concat([messageBytes, chunk]);

    while (unread.length > 0) {
        if (messageLength === -1) {
            if (unread.length >= 4) {
                messageLength = unread.readUInt32LE(0);
                unread = unread.slice(4);
            } else {
                messageBytes = unread;
                return;
            }
        }

        if (unread.length >= messageLength) {
            const msgObjStr = unread.slice(0, messageLength).toString('utf8');
            let msgObj = null;
            try {
                msgObj = JSON.parse(msgObjStr);
            } catch (e) {
                sendMessage({ status: 'error', error: 'Invalid JSON' });
            }
            if (msgObj) handleMessage(msgObj);

            unread = unread.slice(messageLength);
            messageLength = -1;
        } else {
            messageBytes = unread;
            return;
        }
    }
    messageBytes = Buffer.alloc(0);
});
