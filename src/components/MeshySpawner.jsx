import React, { useState } from 'react';
import { meshy } from '../lib/meshy';
import { Box, Sparkles, Loader2 } from 'lucide-react';

const MeshySpawner = ({ onSpawn }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSpawn = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      // In a real flow, this would poll the Meshy API for completion
      // For now, we simulate the 'Generation' process which takes a task ID
      const taskId = await meshy.generateModel(prompt);
      console.log('Started Meshy generation with taskId:', taskId);
      
      // Mocking the completion for the demo
      setTimeout(() => {
        onSpawn({
          name: prompt,
          type: 'prop',
          position: [Math.random() * 4 - 2, 0.5, Math.random() * 4 - 2],
          color: '#c5a059'
        });
        setLoading(false);
        setPrompt('');
      }, 3000);
    } catch (err) {
      alert('Meshy Error: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
      <h3 style={{ fontSize: '0.8rem', color: 'var(--accent-purple)', marginBottom: '0.5rem' }}>AI Prop Genesis</h3>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input 
          className="input-field" 
          placeholder="e.g. Ancient Oak Table..." 
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={loading}
          style={{ fontSize: '11px', padding: '0.5rem' }}
        />
        <button 
          className="btn" 
          onClick={handleSpawn} 
          disabled={loading || !prompt}
          style={{ padding: '0.5rem', background: 'var(--accent-purple)' }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
        </button>
      </div>
    </div>
  );
};

export default MeshySpawner;
