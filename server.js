const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(__dirname + '/'));

io.on('connection', (socket) => {
    console.log('A socket connected');

    socket.on('coordinates', (data) => {
        console.log('Received coordinates:', data);

        // Emit the coordinates data to all connected clients
        io.emit('coordinates', data);
    });

    socket.on('disconnect', () => {
        console.log('A bus disconnected');
    });
});

const port = process.env.PORT || 3002;
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// Create a route to render the HTML page with the received data
app.get('/index', (req, res) => {
    // You can provide additional data here if needed
    res.sendFile(__dirname + '/index.html');
});
