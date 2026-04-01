import axios from 'axios';

const MESHY_API_KEY = import.meta.env.VITE_MESHY_API_KEY;
const API_BASE_URL = 'https://api.meshy.ai/openapi/v2';

export const meshy = {
  async generateModel(prompt) {
    try {
      console.log('Sending request to Meshy v2:', `${API_BASE_URL}/text-to-3d`);
      const response = await axios.post(
        `${API_BASE_URL}/text-to-3d`,
        {
          prompt: `A high-quality 3D asset of a ${prompt}, stylized for a D&D tabletop miniatures game, detailed textures`,
          mode: 'preview',
          art_style: 'realistic',
          ai_model: 'meshy-6' // Use the latest model
        },
        {
          headers: {
            'Authorization': `Bearer ${MESHY_API_KEY}`,
            'Content-Type': 'application/json',
          }
        }
      );
      return response.data.result; // Task ID
    } catch (error) {
      console.error('Meshy Generation Error (v2):', error.response?.data || error.message);
      throw error;
    }
  },

  async checkStatus(taskId) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/text-to-3d/${taskId}`,
        {
          headers: {
            'Authorization': `Bearer ${MESHY_API_KEY}`,
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Meshy Status Check Error:', error.message);
      throw error;
    }
  }
};
