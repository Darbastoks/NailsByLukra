// Quick test script to verify the API works
const API = 'http://localhost:5000/api/reservations';

async function test() {
    console.log('--- Testing POST ---');
    const postRes = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Test Klientas',
            phone: '+37061234567',
            service: 'Kombinuotas Manikiuras',
            date: '2026-03-15',
            notes: 'Test reservation'
        })
    });
    const postData = await postRes.json();
    console.log('POST status:', postRes.status);
    console.log('POST data:', JSON.stringify(postData, null, 2));

    console.log('\n--- Testing GET ---');
    const getRes = await fetch(API);
    const getData = await getRes.json();
    console.log('GET status:', getRes.status);
    console.log('Total reservations:', getData.length);
    if (getData.length > 0) {
        console.log('Latest:', JSON.stringify(getData[0], null, 2));
    }
    console.log('\nAll tests passed!');
}

test().catch(e => console.error('Test failed:', e.message));
