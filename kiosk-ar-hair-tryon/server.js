// server.js - Backend API server for image generation
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Hugging Face API configuration
const HF_API_URL = 'https://api-inference.huggingface.co/models';
const HF_MODEL = process.env.HF_MODEL || 'stabilityai/stable-diffusion-xl-base-1.0';
const HF_API_TOKEN = process.env.HUGGING_FACE_API_TOKEN || process.env.HF_API_TOKEN;

/**
 * Generate image using Hugging Face API
 */
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, test, ...options } = req.body;

    // Test endpoint
    if (test) {
      if (!HF_API_TOKEN) {
        return res.status(200).json({ 
          valid: false, 
          message: 'Hugging Face API token not configured. Set HUGGING_FACE_API_TOKEN environment variable.' 
        });
      }
      return res.status(200).json({ valid: true, message: 'API key configured' });
    }

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!HF_API_TOKEN) {
      return res.status(500).json({ 
        error: 'Hugging Face API token not configured. Please set HUGGING_FACE_API_TOKEN environment variable.' 
      });
    }

    console.log('🎨 Generating image with prompt:', prompt);

    // Call Hugging Face API
    const response = await fetch(`${HF_API_URL}/${HF_MODEL}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          num_inference_steps: options.num_inference_steps || 50,
          guidance_scale: options.guidance_scale || 7.5,
          negative_prompt: options.negative_prompt || 'blurry, low quality, distorted',
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Hugging Face API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `Hugging Face API error: ${response.status} ${errorText}` 
      });
    }

    // Get image blob
    const imageBuffer = await response.arrayBuffer();
    const imageBlob = Buffer.from(imageBuffer);

    // Set response headers
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', imageBlob.length);

    // Send image
    res.send(imageBlob);

  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend API server running on http://localhost:${PORT}`);
  console.log(`📝 Hugging Face API Token: ${HF_API_TOKEN ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`🤖 Using model: ${HF_MODEL}`);
});














