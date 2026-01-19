const jwt = require('jsonwebtoken');
require('dotenv').config();

const protect = (req, res, next) => {
  console.log('protect middleware called');
  let token;
  console.log('Request headers:', req.headers);
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header (removes 'Bearer ' prefix)
      token = req.headers.authorization.split(' ')[1];
      console.log('Token found:', token);

      // Verify token
      console.log('JWT_SECRET:', process.env.JWT_SECRET);
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decoded:', decoded);
        // Attach the userId to the request object so later routes can use it
        req.userId = decoded.userId;
        next(); // Move on to the next middleware/route handler
      } catch (verifyError) {
        console.log('JWT verification failed:', verifyError);
        res.status(401).json({ error: 'Not authorized, token failed' });
      }
    } catch (error) {
      console.log('Token extraction failed:', error);
      res.status(401).json({ error: 'Not authorized, token extraction failed' });
    }
  } else {
    console.log('No valid Authorization header');
  }

  if (!token) {
    res.status(401).json({ error: 'Not authorized, no token' });
  }
};

module.exports = { protect };
