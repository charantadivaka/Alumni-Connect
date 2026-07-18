const http = require('http');

http.get('http://localhost:5173/login', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (data.includes('vite-error')) {
      console.log('VITE ERROR FOUND:');
      const match = data.match(/<pre[^>]*>([\s\S]*?)<\/pre>/);
      if (match) console.log(match[1]);
      else console.log(data);
    } else {
      console.log('No vite error in HTML.');
    }
  });
}).on('error', err => console.log('Fetch error:', err.message));
