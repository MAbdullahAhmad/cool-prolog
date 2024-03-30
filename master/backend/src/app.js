const express = require('express');
const cors = require('cors');
const session = require('express-session');

const app = express();

app.use(cors({
  origin: true,
  credentials: true // Allow cookies to be sent with cross-origin requests
}));

// Session middleware setup
app.use(session({
  secret: '5d2ff461535778972a4b61b43b392a5d', // This should be a random string for security purposes
  resave: false,
  saveUninitialized: true,
  cookie: { secure: !true } // Set secure to true if using HTTPS
}));

app.use(express.json()); // For parsing application/json

// Import routes
const apiRoutes = require('./routes/api');

// Use routes
app.use('/api', apiRoutes);

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});