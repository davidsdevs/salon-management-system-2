// src/utils/imageGeneration.js
/**
 * Image Generation Service using Hugging Face API
 * This service handles AI-powered image generation for hair try-on
 */

const HUGGING_FACE_API_URL = "https://api-inference.huggingface.co/models";
const HF_MODEL = "stabilityai/stable-diffusion-xl-base-1.0"; // Default model, can be changed

/**
 * Test Hugging Face API key through proxy
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
export const testHuggingFaceKey = async () => {
  try {
    console.log('🧪 [HF TEST] Testing Hugging Face API key through proxy...');
    
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'test',
        test: true
      })
    });

    if (response.ok) {
      console.log('✅ [HF TEST] API key is VALID and working!');
      return { valid: true };
    } else {
      const errorText = await response.text();
      console.warn('⚠️ [HF TEST] Unexpected response:', response.status, errorText);
      return { valid: false, error: `Status ${response.status}: ${errorText}` };
    }
  } catch (error) {
    console.error('❌ [HF TEST] Error testing API key:', error);
    return { valid: false, error: error.message };
  }
};

/**
 * Generate image using Hugging Face API
 * @param {string} prompt - The prompt for image generation
 * @param {object} options - Additional options (negative_prompt, num_inference_steps, etc.)
 * @returns {Promise<{success: boolean, imageUrl?: string, error?: string}>}
 */
export const generateImage = async (prompt, options = {}) => {
  try {
    console.log('🎨 [IMAGE GEN] Generating image with prompt:', prompt);
    
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        ...options
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [IMAGE GEN] API error:', response.status, errorText);
      throw new Error(`Image generation failed: ${response.status} ${errorText}`);
    }

    const blob = await response.blob();
    const imageUrl = URL.createObjectURL(blob);
    
    console.log('✅ [IMAGE GEN] Image generated successfully');
    return { success: true, imageUrl };
  } catch (error) {
    console.error('❌ [IMAGE GEN] Error generating image:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generate hair try-on image
 * @param {string} baseImageUrl - URL of the base face image
 * @param {string} hairstyleDescription - Description of the desired hairstyle
 * @returns {Promise<{success: boolean, imageUrl?: string, error?: string}>}
 */
export const generateHairTryOn = async (baseImageUrl, hairstyleDescription) => {
  const prompt = `Professional hairstyle: ${hairstyleDescription}, high quality, realistic, salon quality, natural lighting`;
  
  return generateImage(prompt, {
    negative_prompt: 'blurry, low quality, distorted, unnatural',
    num_inference_steps: 50,
    guidance_scale: 7.5
  });
};














