const jwt = require('jsonwebtoken');
require('dotenv').config();

const protect = (req, res, next) => {
  console.log('[PROTECT] Middleware called');
  let token;
  console.log('[PROTECT] Request headers:', req.headers);
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header (removes 'Bearer ' prefix)
      token = req.headers.authorization.split(' ')[1];
      console.log('[PROTECT] Token found:', token);

      // Verify token
      console.log('[PROTECT] JWT_SECRET present:', !!process.env.JWT_SECRET);
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('[PROTECT] Token decoded:', decoded);
        // Attach the userId to the request object so later routes can use it
        req.userId = decoded.userId;
        console.log('[PROTECT] Calling next()');
        next(); // Move on to the next middleware/route handler
        return;
      } catch (verifyError) {
        console.log('[PROTECT] JWT verification failed:', verifyError);
        console.log('[PROTECT] Responding 401: token failed');
        res.status(401).json({ error: 'Not authorized, token failed' });
        return;
      }
    } catch (error) {
      console.log('[PROTECT] Token extraction failed:', error);
      console.log('[PROTECT] Responding 401: token extraction failed');
      res.status(401).json({ error: 'Not authorized, token extraction failed' });
      return;
    }
  } else {
    console.log('[PROTECT] No valid Authorization header');
  }

  if (!token) {
    console.log('[PROTECT] Responding 401: no token');
    res.status(401).json({ error: 'Not authorized, no token' });
    return;
  }
};

module.exports = { protect };
