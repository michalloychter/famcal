const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

// You should set your OpenAI API key in an environment variable for security
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// POST /api/ai-improvement-suggestion
router.post('/ai-improvement-suggestion', async (req, res) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ error: 'Question is required.' });
  }
  try {
    const prompt = `A user wants to improve: "${question}". Suggest practical, actionable steps and encouragement for this goal.`;
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful, practical coach.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 200
    });
    const suggestion = completion.choices[0].message.content;
    res.json({ suggestion });
  } catch (err) {
    console.error('AI suggestion error:', err);
    res.status(500).json({ error: 'Failed to get suggestion from AI.' });
  }
});

module.exports = router;
