const http = require('http');

const makeRequest = (data) => {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/stats/gameStatsReport',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = body ? JSON.parse(body) : {};
                    resolve({ statusCode: res.statusCode, body: parsed });
                } catch (e) {
                    console.log('Raw Body:', body);
                    reject(new Error(`JSON Parse Error: ${e.message}`));
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(postData);
        req.end();
    });
};

const runTests = async () => {
    console.log('--- Starting Verification ---');

    // Test 1: Valid quickPlay
    try {
        console.log('\nTest 1: Valid quickPlay');
        const res1 = await makeRequest({ date: '2023-01-01', gameType: 'quickPlay' });
        console.log('Status:', res1.statusCode);
        console.log('Response:', JSON.stringify(res1.body, null, 2));
    } catch (e) { console.error('Test 1 Failed:', e.message); }

    // Test 2: Valid mulitiPlayer
    try {
        console.log('\nTest 2: Valid mulitiPlayer');
        const res2 = await makeRequest({ date: '2023-01-01', gameType: 'mulitiPlayer' });
        console.log('Status:', res2.statusCode);
        console.log('Response:', JSON.stringify(res2.body, null, 2));
    } catch (e) { console.error('Test 2 Failed:', e.message); }

    // Test 3: Invalid gameType
    try {
        console.log('\nTest 3: Invalid gameType');
        const res3 = await makeRequest({ date: '2023-01-01', gameType: 'invalidType' });
        console.log('Status:', res3.statusCode);
        console.log('Response:', JSON.stringify(res3.body, null, 2));
    } catch (e) { console.error('Test 3 Failed:', e.message); }

    console.log('\n--- Verification Complete ---');
};

runTests();
