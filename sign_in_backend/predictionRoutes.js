const express = require('express');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const { requireAuth } = require('./authMiddleware');
const { getRedisClient } = require('./redisClient');
const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const storage = multer.memoryStorage();
const upload = multer({ storage });
const DAILY_LIMIT = parseInt(process.env.PREDICT_DAILY_LIMIT || '2', 10);

function getUTCDateKey(d = new Date()) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const RECOMMENDATIONS = {
  'Biodegradable': "For environmentally responsible disposal, please compost this material. Place it exclusively in the organic/food waste receptacle provided by your local waste management service.",
  'Non-Biodegradable': "Please place this item in your designated general waste bin. This material is not accepted by standard municipal recycling or composting facilities.",
  'Hazardous': "Follow local disposal guidelines. Disposal of hazardous waste can lead to serious legal consequences. Contact your local authority for more details.",
  'Electronic': "Do not place this in regular bins. Take it to a certified e-waste collection center or a retailer take-back program for safe disposal.",
  'Unknown': "We couldn't confidently classify this item. Please consult your local municipal waste authority for proper disposal guidance."
};

router.post('/predict', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const redis = await getRedisClient().catch((e) => {
      console.warn('Redis error; skipping quota enforcement:', e?.message || e);
      return null;
    });

    if (redis) {
      const userId = req.user && req.user.id ? String(req.user.id) : 'unknown';
      const dateKey = getUTCDateKey();
      const quotaKey = `predict_quota:${userId}:${dateKey}`;
      const now = new Date();
      const nextMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
      const ttlSeconds = Math.max(1, Math.floor((nextMidnight.getTime() - now.getTime()) / 1000));
      const tx = redis.multi();
      tx.incr(quotaKey);
      tx.expire(quotaKey, ttlSeconds);
      const execResults = await tx.exec();
      const usedCount = execResults ? Number(execResults[0]) : 1;

      if (usedCount > DAILY_LIMIT) {
        await redis.decr(quotaKey).catch(() => {});
        return res.status(429).json({
          error: 'Daily quota exceeded',
          message: 'Daily limit reached. Try again tomorrow. Remaining: 0',
          category: 'Quota exceeded',
          recommendation: null,
          image_url: null,
        });
      }
    }

    const imageBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;
    const base64Image = imageBuffer.toString('base64');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `Analyze this image of waste and classify it into one of the following categories: Biodegradable, Non-Biodegradable, Hazardous, or Electronic waste. Provide only the category name as the response as well the appropriate method for it's disposal.`;
    const imagePart = {
      inlineData: { data: base64Image, mimeType },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const aiResponse = await result.response;
    let category = aiResponse.text().trim();

    if (/biodegradable/i.test(category) && !/non/i.test(category)) {
      category = 'Biodegradable';
    } else if (/non-biodegradable/i.test(category) || /nonbiodegradable/i.test(category)) {
      category = 'Non-Biodegradable';
    } else if (/hazardous/i.test(category)) {
      category = 'Hazardous';
    } else if (/electronic/i.test(category)) {
      category = 'Electronic';
    } else {
      category = 'Unknown';
    }

    const recommendation = RECOMMENDATIONS[category] || RECOMMENDATIONS['Unknown'];

    const imgbbKey = process.env.IMGBB_API_KEY;
    let imageUrl = '';
    try {
      const formData = new URLSearchParams();
      formData.append('image', base64Image);
      const imgbbResponse = await axios.post(
        `https://api.imgbb.com/1/upload?key=${imgbbKey}`,
        formData
      );
      imageUrl = imgbbResponse.data.data.url;
    } catch (imgErr) {
      console.error('ImgBB Upload Failed:', imgErr.message);
      imageUrl = 'Upload failed';
    }

    return res.json({ category, recommendation, image_url: imageUrl });
  } catch (error) {
    console.error('Prediction error:', error);
    return res.status(500).json({ error: 'AI processing failed', details: error.message });
  }
});

module.exports = router;