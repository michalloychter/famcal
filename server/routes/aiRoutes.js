const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

// Lazy initialization of OpenAI client
let openai;
function getOpenAI() {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openai;
}

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
    const completion = await getOpenAI().chat.completions.create({
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
  console.log('[AI IMPROVEMENT] Incoming request:', { question });
  if (!question) {
    return res.status(400).json({ error: 'Question is required.' });
  }
  try {
    const prompt = `A user wants to improve: "${question}". 

Provide 3-5 practical, actionable steps for this goal.

CRITICAL: You MUST respond with ONLY a valid JSON array. Do not include any text before or after the JSON.

Format:
[
  {
    "title": "Short step name (3-6 words)",
    "details": "Detailed explanation of the step and why it helps"
  }
]

Example response:
[
  {"title": "Read daily in English", "details": "Dedicate 20 minutes each day to reading English books, articles, or news to expand your vocabulary and comprehension."},
  {"title": "Practice writing regularly", "details": "Keep a daily journal in English to improve your writing skills and grammar."},
  {"title": "Watch English content", "details": "Watch movies, TV shows, or YouTube videos in English with subtitles to improve listening skills."}
]`;

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful, practical coach. You MUST respond with ONLY valid JSON arrays, no additional text.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.7
    });
    
    const aiText = completion.choices[0].message.content.trim();
    console.log('[AI IMPROVEMENT] OpenAI response:', aiText);
    
    let suggestions = [];
    try {
      // Try to parse as-is
      suggestions = JSON.parse(aiText);
    } catch (e) {
      // Fallback: try to extract JSON from text
      const match = aiText.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          suggestions = JSON.parse(match[0]);
        } catch (e2) {
          console.error('[AI IMPROVEMENT] Failed to parse extracted JSON:', match[0]);
          return res.status(500).json({ error: 'AI did not return valid JSON.' });
        }
      } else {
        console.error('[AI IMPROVEMENT] No JSON array found in response:', aiText);
        return res.status(500).json({ error: 'AI did not return valid suggestions.' });
      }
    }
    
    // Validate the structure
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      console.error('[AI IMPROVEMENT] Invalid suggestions format:', suggestions);
      return res.status(500).json({ error: 'AI returned invalid suggestions format.' });
    }
    
    // Ensure each suggestion has title and details
    const validSuggestions = suggestions.filter(s => s.title && s.details);
    if (validSuggestions.length === 0) {
      console.error('[AI IMPROVEMENT] No valid suggestions with title and details:', suggestions);
      return res.status(500).json({ error: 'AI suggestions missing required fields.' });
    }
    
    console.log('[AI IMPROVEMENT] Returning valid suggestions:', validSuggestions);
    res.json({ suggestions: validSuggestions });
  } catch (err) {
    console.error('[AI IMPROVEMENT] Error:', err);
    res.status(500).json({ error: 'Failed to get suggestion from AI.' });
  }
});

// POST /api/ai-clothing-suggestion
router.post('/ai-clothing-suggestion', async (req, res) => {
  const { temp, description, city } = req.body;
  console.log('[AI CLOTHING] Incoming request:', { temp, description, city });
  if (temp === undefined || !description) {
    return res.status(400).json({ error: 'Temperature and weather description are required.' });
  }
  try {
    const prompt = `The weather today in ${city || 'your area'} is ${description} with a temperature of ${temp}°C.

Give ONE sentence clothing recommendation for what to wear today. Be brief, casual and helpful.

Example: "Bundle up with a warm jacket and scarf - it's cold and rainy today!"`;

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a friendly weather assistant. Give ONE sentence clothing advice only.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 50,
      temperature: 0.8
    });
    
    const advice = completion.choices[0].message.content.trim();
    console.log('[AI CLOTHING] OpenAI response:', advice);
    
    res.json({ advice });
  } catch (err) {
    console.error('[AI CLOTHING] Error:', err);
    res.status(500).json({ error: 'Failed to get clothing suggestion from AI.' });
  }
});

module.exports = router;
