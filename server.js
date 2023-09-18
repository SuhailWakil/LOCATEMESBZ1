const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve your static files (e.g., HTML, CSS, JS) here if needed
// app.use(express.static(__dirname + '/public'));

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('coordinates', (data) => {
        console.log('Received coordinates:', data);

        // Here, you can process and use the received coordinates as needed.
        // For this example, we're just displaying them in the console.
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
