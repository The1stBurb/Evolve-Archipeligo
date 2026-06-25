const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/data') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            // console.log(`body: |${body}|`);
            const data = JSON.parse(body);

            fs.writeFileSync('./ap_2/data/actions.json',JSON.stringify(data,'',2));
            console.log('Received: data');


            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });

            res.end(JSON.stringify({
                success: true
            }));
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(3000, () => {
    console.log('Listening on port 3000');
});