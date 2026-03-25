import http from 'http';

http.get('http://localhost:3000', (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', () => {});
  res.on('end', () => {
    console.log('Server is up and running!');
  });
}).on('error', (e) => {
  console.error(`Got error: ${e.message}`);
});
