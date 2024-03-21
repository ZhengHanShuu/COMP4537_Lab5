/**
 * Chat gpt was used for all of the comments.
 * Also for the database connection see in the comment below.  
 */


// Requests had to be trimmed due to spaces before the select
// or insert from the client. 
// I used Chat GPT to help debug this issue 

const http = require("http");
const mysql = require('mysql');
const url = require('url');

// Configure database connection
const connection = mysql.createConnection({
  host: 'db-mysql-nyc3-77132-do-user-15767645-0.c.db.ondigitalocean.com',
  user: 'doadmin',
  password: 'AVNS_mLc9P9ieFOUgsmuTkz0',
  database: 'defaultdb',
  port: 25060
});

// Connect to the database
connection.connect(error => {
  if (error) {
    console.error("Error connecting to the database:", error);
    return;
  }
  console.log("Successfully connected to the database.");
  
  // Ensure the table exists
  const createTableQuery = `
  CREATE TABLE IF NOT EXISTS patient (
    patientID INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    dateOfBirth DATETIME NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8;`;

  connection.query(createTableQuery, (err, result) => {
    if (err) {
      console.error("Error creating table:", err);
      return;
    }
    console.log("Table 'patient' created or already exists.");
  });
});

// Create server
const server = http.createServer((req, res) => {
const reqUrl = url.parse(req.url, true);
  
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle pre-flight requests
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Handle POST requests
  if (req.method === "POST") {
    let body = "";
    req.on("data", chunk => {
      body += chunk.toString(); // Convert buffer to string
    });
    req.on("end", () => {
      try {
        const { query } = JSON.parse(body);
        const trimmedQuery = query.trim(); // Trim whitespace from the query
        
        if (trimmedQuery.toUpperCase().startsWith('SELECT') || trimmedQuery.toUpperCase().startsWith('INSERT')) {
          connection.query(trimmedQuery, (err, results) => {
            if (err) {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: err.message }));
              return;
            }
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(results));
          });
        } else {
          res.writeHead(403, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Forbidden: Only SELECT and INSERT statements are allowed." }));
        }
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Bad request. Failed to parse JSON body." }));
      }
    });
  } else if (req.method === "GET" && reqUrl.pathname === '/api/v1/sql') {
    // Handle GET requests for SQL queries
    const query = reqUrl.query['query'].trim(); 
    
    if (query.toUpperCase().startsWith('SELECT')) {
      connection.query(query, (err, results) => {
        if (err) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: err.message }));
          return;
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(results));
      });
    } else {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Forbidden: Only SELECT statements are allowed via GET." }));
    }
  } else {
    // Handle all other requests as not found
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  }
});

const PORT = process.env.PORT || 8083;
  server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
  });
