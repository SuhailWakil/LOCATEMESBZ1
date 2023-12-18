
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sql = require('mssql');
const bodyParser = require('body-parser');
const multer = require('multer'); // Import multer for file uploads

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Set up multer for handling file uploads
const storage = multer.memoryStorage(); // Storing files in memory
const upload = multer({ storage: storage });

// Add body-parser middleware before defining routes
app.use(bodyParser.json());

app.use(express.static(__dirname + '/'));

io.on('connection', (socket) => {
    console.log('A socket connected');

    socket.on('coordinates', (data) => {
        console.log('Received coordinates:', data);
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

app.get('/index', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

const config = {
    user: 'swakil',
    password: 'Sandiego!23',
    server: 'sbzsqlserver.database.windows.net',
    database: 'SBZDB5',
    options: {
        encrypt: true,
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
        const result = await sql.query("SELECT ItemID, ItemShortDesc, ItemLongDesc, Status, Price, Quantity FROM dbo.SBZ_MENU");

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

// Define a new POST endpoint to save or update the default address
app.post('/api/saveDefaultAddress', async (req, res) => {
    try {
        await sql.connect(config);

        const { address } = req.body;

        // Check if there is an existing address record
        const checkQuery = `SELECT COUNT(*) as count FROM dbo.SBZ_ADDRESS`;
        const checkResult = await sql.query(checkQuery);

        let query;
        if (checkResult.recordset[0].count > 0) {
            // If a record exists, update it
            query = `
                UPDATE dbo.SBZ_ADDRESS
                SET ADDRESS = '${address}'
            `;
        } else {
            // If no record exists, insert a new one
            query = `
                INSERT INTO dbo.SBZ_ADDRESS (ADDRESS) 
                VALUES ('${address}')
            `;
        }

        await sql.query(query);
        res.json({ message: 'Address saved successfully' });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'An error occurred while saving the address' });
    } finally {
        sql.close();
    }
});

app.post('/api/upload-image', upload.single('image'), async (req, res) => {
    try {
        await sql.connect(config);

        const imageBuffer = req.file.buffer;
        const itemId = req.body.itemId;

        const query = `
            UPDATE dbo.SBZ_MENU
            SET Image = @image
            WHERE ItemID = @itemId
        `;

        const request = new sql.Request();
        request.input('image', sql.VarBinary(sql.MAX), imageBuffer);
        request.input('itemId', sql.Int, itemId);
        await request.query(query);

        res.json({ message: 'Image uploaded successfully' });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'An error occurred while uploading the image' });
    } finally {
        sql.close();
    }
});
app.get('/api/get-image/:itemId', async (req, res) => {
    try {
        await sql.connect(config);

        const itemId = req.params.itemId;
        const query = `
            SELECT Image
            FROM dbo.SBZ_MENU
            WHERE ItemID = @itemId
        `;

        const request = new sql.Request();
        request.input('itemId', sql.Int, itemId);
        const result = await request.query(query);

        if (result.recordset.length > 0 && result.recordset[0].Image) {
            const imageBuffer = result.recordset[0].Image;
            res.writeHead(200, {
                'Content-Type': 'image/jpeg', // or the appropriate content type
                'Content-Length': imageBuffer.length
            });
            res.end(imageBuffer); // Send the binary data of the image
        } else {
            res.status(404).send('Image not found');
        }
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'An error occurred while fetching the image' });
    } finally {
        sql.close();
    }
});
app.get('/api/get-address/:addressId?', async (req, res) => {
    try {
        await sql.connect(config);

        let query;
        if (req.params.addressId) {
            // Fetch address by specific ID
            const addressId = req.params.addressId;
            query = `SELECT * FROM dbo.SBZ_ADDRESS WHERE AddressID = @addressId`;
            const request = new sql.Request();
            request.input('addressId', sql.Int, addressId);
            const result = await request.query(query);
            res.json(result.recordset);
        } else {
            // Fetch all addresses
            query = `SELECT * FROM dbo.SBZ_ADDRESS`;
            const result = await sql.query(query);
            res.json(result.recordset);
        }
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'An error occurred while fetching the address' });
    } finally {
        sql.close();
    }
});
