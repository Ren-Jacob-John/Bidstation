const http = require('http');

http.get('http://localhost:5173/auction', (res) => {
  console.log('StatusCode:', res.statusCode);
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('BodyLength:', data.length);
    console.log('Preview:', data.slice(0, 200));
    process.exit(0);
  });
}).on('error', (e) => {
  console.error('ERR', e.message);
  process.exit(1);
});
