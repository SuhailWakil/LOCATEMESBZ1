
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sql = require('mssql');
const bodyParser = require('body-parser'); // Add body-parser

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Add body-parser middleware before defining routes
app.use(bodyParser.json());

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

const port = process.env.PORT || 3003;
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// Create a route to render the HTML page with the received data
app.get('/index', (req, res) => {
    // You can provide additional data here if needed
    res.sendFile(__dirname + '/index.html');
});

// Define your Azure SQL Database connection configuration
const config = {
    user: 'swakil',
    password: 'Sandiego!23',
    server: 'sbzsqlserver.database.windows.net',
    database: 'SBZDB5',
    options: {
        encrypt: true, // Use SSL
    },
};

// Define an API endpoint to fetch data from the database
app.get('/api/data', async (req, res) => {
    try {
        // Connect to the database
        await sql.connect(config);

        // Query the database (replace this with your SQL query)
        const result = await sql.query("SELECT * FROM dbo.SBZ_MENU where STATUS = 'A'");

        // Send the query result as JSON
        res.json(result.recordset);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'An error occurred' });
    } finally {
        // Close the database connection
        sql.close();
    }
});
app.get('/api/ownerdata', async (req, res) => {
    try {
        // Connect to the database
        await sql.connect(config);

        // Query the database (replace this with your SQL query)
        const result = await sql.query("SELECT * FROM dbo.SBZ_MENU");

        // Send the query result as JSON
        res.json(result.recordset);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'An error occurred' });
    } finally {
        // Close the database connection
        sql.close();
    }
});
// Define a new POST endpoint to update the SBZ_MENU table
app.post('/api/update-menu', async (req, res) => {
    try {
        // Connect to the database
        await sql.connect(config);

        // Define the update query
        const query = `
            UPDATE dbo.SBZ_MENU
            SET
                [ItemShortDesc] = '${req.body.ItemShortDesc}',
                [ItemLongDesc] = '${req.body.ItemLongDesc}',
                [Status] = '${req.body.Status}',
                [Price] = ${req.body.Price},
                [Quantity] = ${req.body.Quantity}
            WHERE [ItemID] = ${req.body.ItemID}
        `;

        // Execute the update query
        await sql.query(query);

        // Send a success response
        res.json({ message: true });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'An error occurred' });
    } finally {
        // Close the database connection
        sql.close();
    }
});

// Define a new POST endpoint to insert a new record into the SBZ_MENU table
app.post('/api/insert-menu', async (req, res) => {
    try {
        // Connect to the database
        await sql.connect(config);

        // Define the insert query
        const query = `
            INSERT INTO dbo.SBZ_MENU ([ItemShortDesc], [ItemLongDesc], [Status], [Price], [Quantity])
            VALUES (
                '${req.body.ItemShortDesc}',
                '${req.body.ItemLongDesc}',
                '${req.body.Status}',
                ${req.body.Price || null},  -- You can set to null if not provided
                ${req.body.Quantity || null} -- You can set to null if not provided
            )
        `;

        // Execute the insert query
        await sql.query(query);

        // Send a success response
        res.json({ message: 'Record inserted successfully' });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'An error occurred' });
    } finally {
        // Close the database connection
        sql.close();
    }
});


// Define a new POST endpoint to delete a record from the SBZ_MENU table
app.post('/api/delete-menu', async (req, res) => {
    try {
        // Connect to the database
        await sql.connect(config);

        // Define the delete query
        const query = `
            DELETE FROM dbo.SBZ_MENU
            WHERE [ItemID] = ${req.body.ItemID}
        `;

        // Execute the delete query
        await sql.query(query);

        // Send a success response
        res.json({ message: 'Record deleted successfully' });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'An error occurred' });
    } finally {
        // Close the database connection
        sql.close();
    }
});
