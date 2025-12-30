const express = require('express');
const cors = require('cors'); 
const app = express();
require('dotenv').config(); 

// 1. Define the PORT variable (read from environment or use a default)
const PORT = process.env.PORT || 3000;

// 2. --- Middleware Setup (Applied FIRST) ---
app.use(cors());       // Allow cross-origin requests
app.use(express.json()); // Parse JSON bodies

// 3. --- Route Mounting (Applied SECOND) ---

// Mount the authentication and user-related routes under the /api base path
const authRouter = require('./routes/authRoutes');
app.use('/api', authRouter);

// Mount the task-related routes under the /api base path
const taskRouter = require('./routes/taskRoutes');
// FIX 3: Added the missing '/' in the path
app.use('/api', taskRouter); 

// --- Start the Server ---
// FIX 1 & 2: Use the defined PORT variable
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));