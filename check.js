const http = require('http');

const data = JSON.stringify({ date: '2023-01-01', gameType: 'quickPlay' });
const options = {
    hostname: '127.0.0.1',
    port: 3000,
    path: '/stats/gameStatsReport',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`); // Expect 200
    res.on('data', d => process.stdout.write(d));
});

req.on('error', error => console.error(error));
req.write(data);
req.end();
