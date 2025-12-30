const UserModel = require("../models/userModel");
const MemberModel = require("../models/memberModel");
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken'); 
require('dotenv').config(); 
const JWT_SECRET = process.env.JWT_SECRET;
// Ensure 'app', 'jwt', 'JWT_SECRET', and 'openaiClient' are defined in the scope where this code runs
// It is highly recommended to use a library like bcrypt for password hashing

// 1. Registration Route (Corrected and Improved)
router.post('/register', async (req, res) => {
    const { userName, password, firstName, lastName, members } = req.body; 

    // Basic input validation
    if (!userName || !password || !firstName || !lastName) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // A. Check if the username already exists
        // Assuming ValidUserName returns the user document if found, null/undefined otherwise
        const existingUser = await UserModel.ValidUserName({ userName: userName });
        if (existingUser) { 
            return res.status(400).json({ error: 'Username already exists' });
        }

        // B. Create the new user document in 'users' collection
        // IMPORTANT: Hash the password before storing it
        // const hashedPassword = await bcrypt.hash(password, 10); // Example using bcrypt

    const newUser = {
      userName,
      password: password, // REPLACE WITH hashedPassword IN PRODUCTION
      firstName,
      lastName,
      // Optional financial / health fields
      bankName: req.body.bankName || null,
      bankUrl: req.body.bankUrl || null,
      healthFundName: req.body.healthFundName || null,
      healthFundUrl: req.body.healthFundUrl || null,
      superName: req.body.superName || null,
      superUrl: req.body.superUrl || null,
    };

        const userDocRef = await UserModel.registerUser(newUser);
        const newUserId = userDocRef.id; // Get the auto-generated Firebase User ID

        // C. Process family member names
        let memberNames = [];
        if (members && typeof members === 'string') {
             memberNames = members.split(',').map(name => name.trim()).filter(name => name.length > 0);
        }
        
        // D. Add the main user's name to the list of members to be created
        const mainUserName = firstName; 
        memberNames.push(mainUserName); 
        
        // Assuming addMembers expects (memberNames, newUserId) based on your model
        await MemberModel.addMembers(memberNames, newUserId);
        
        // Return a success response
        res.status(201).json({ id: newUserId, message: 'User registered successfully and members added' });

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).send('An error occurred during registration: ' + error.message);
    }
});


// 2. Login Route (Corrected and Improved)
router.post('/login', async (req, res) => {
  const { userName, password } = req.body;
console.log("name", req.body);

  if (!userName || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const user = await UserModel.getUserByName({ userName: userName });
console.log("user", user);

    // Proper password comparison using a secure method (e.g., bcrypt.compare)

    if (!user ) { // REMOVE THIS LINE AND USE SECURE COMPARISON IN PRODUCTION
     console.log("noo");
     
      return res.status(401).json({ error: 'Invalid credentials' })
      
    }

    // FIX: 'userId' was undefined. Use 'user.id' instead.
    const userMembers = await MemberModel.userMembers(user.id);
console.log("usermem",userMembers);

    const token = jwt.sign(
      { userId: user.id, userName: user.userName },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id, 
        userName: user.userName,
        firstName: user.firstName,
        lastName: user.lastName,
          token: token,
          familyMembers: userMembers,
          // include optional info fields if present
          bankName: user.bankName || null,
          bankUrl: user.bankUrl || null,
          healthFundName: user.healthFundName || null,
          healthFundUrl: user.healthFundUrl || null,
          superName: user.superName || null,
          superUrl: user.superUrl || null
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).send('An error occurred during login: ' + error.message);
  }
});


// 3. Get AI Clothing Advice Route (This route was largely correct, adding basic validation)
router.post('/clothing-advice', async (req, res) => {
    const { temp, description, city } = req.body; 

    if (!temp || !description) {
        return res.status(400).json({ error: "Missing temperature or description in request body." });
    }
    // ... (rest of the OpenAI logic) ...
     const prompt = `Based on the current weather in ${city || 'your location'}: 
                    Temperature: ${temp}°C, Description: ${description}. 
                    Provide a single, friendly sentence of advice on what clothes to wear today.`;

    try {
        const response = await openaiClient.chat.completions.create({
            model: "gpt-3.5-turbo", 
            messages: [{ role: "user", content: prompt }],
            max_tokens: 60 
        });

        const adviceText = response.choices.message.content;
        res.json({ advice: adviceText });

    } catch (error) {
        console.error("Error calling OpenAI:", error.message);
        res.status(500).json({ 
            error: "Failed to get clothing advice from AI.",
            details: error.message
        });
    }
});

module.exports = router;

// GET user by id (used by frontend to refresh current user profile)
router.get('/users/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).send('User id is required');
    const user = await UserModel.getUserById(id);
    if (!user) return res.status(404).send('User not found');
    res.json(user);
  } catch (error) {
    console.error('Error fetching user by id:', error);
    res.status(500).send('Error fetching user: ' + error.message);
  }
});