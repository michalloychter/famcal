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

// Mount the member-related routes under /api/members
const memberRouter = require('./routes/memberRoutes');
app.use('/api/members', memberRouter);

// Mount the task-related routes under the /api base path
const taskRouter = require('./routes/taskRoutes');
app.use('/api', taskRouter);


// Mount the AI improvement suggestion route
const aiRouter = require('./routes/aiRoutes');
app.use('/api', aiRouter);

// Mount the shopping list routes under /api/shopping-list
const shoppingListRouter = require('./routes/shoppingListRoutes');
app.use('/api/shopping-list', shoppingListRouter);

// Mount the family routes under /api/families
const familyRouter = require('./routes/familyRoutes');
app.use('/api/families', familyRouter);


// --- Start the Server ---
// FIX 1 & 2: Use the defined PORT variable
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));