const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// POST /api/ai-family-evening-tasks
router.post('/ai-family-evening-tasks', async (req, res) => {
  const { idea, date } = req.body;
  console.log('[AI TASKS] Incoming request:', { idea, date });
  if (!idea || !date) {
    console.log('[AI TASKS] Missing idea or date');
    return res.status(400).json({ error: 'Idea and date are required.' });
  }
  try {
    const prompt = `A family wants to organize a family evening with the idea: "${idea}" on ${date}.\nGenerate 2 creative food-related tasks and 2 equipment-related tasks needed for this event.\nReturn the result as a JSON array of objects, each with: title, type (food or equipment), and a short details field. Example: [{"title": "Make popcorn", "type": "food", "details": "Prepare fresh popcorn for everyone."}, ...]`;
    console.log('[AI TASKS] Sending prompt to OpenAI:', prompt);
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant for planning family events.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 350
    });
    const aiText = completion.choices[0].message.content;
    console.log('[AI TASKS] OpenAI response:', aiText);
    let tasks = [];
    try {
      // Try to parse JSON from AI response
      tasks = JSON.parse(aiText);
    } catch (e) {
      // Fallback: try to extract JSON from text
      const match = aiText.match(/\[.*\]/s);
      if (match) {
        tasks = JSON.parse(match[0]);
      } else {
        console.error('[AI TASKS] Failed to parse AI response as JSON:', aiText);
        return res.status(500).json({ error: 'AI did not return valid tasks.' });
      }
    }
    console.log('[AI TASKS] Returning tasks:', tasks);
    res.json({ tasks });
  } catch (err) {
    console.error('[AI TASKS] Error:', err);
    res.status(500).json({ error: 'Failed to get tasks from AI.' });
  }
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
