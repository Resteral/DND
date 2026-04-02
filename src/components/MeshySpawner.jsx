import React, { useState, useEffect } from 'react';
import { meshy } from '../lib/meshy';
import { Box, Sparkles, Loader2, RefreshCw } from 'lucide-react';

const MeshySpawner = ({ onSpawn }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [taskId, setTaskId] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval;
    if (taskId) {
      interval = setInterval(async () => {
        try {
          const status = await meshy.checkStatus(taskId);
          setProgress(status.progress || 0);
          if (status.status === 'SUCCEEDED' && status.model_urls?.glb) {
            onSpawn({
              name: prompt,
              type: 'prop',
              position: [Math.random() * 6 - 3, 0.5, Math.random() * 6 - 3],
              modelUrl: status.model_urls.glb,
              color: '#c5a059'
            });
            setTaskId(null);
            setLoading(false);
            setPrompt('');
          } else if (status.status === 'FAILED') {
            alert('Genesis Failed: ' + (status.task_error?.message || 'The Weave is unstable.'));
            setTaskId(null);
            setLoading(false);
          }
        } catch (err) {
          console.error('Polling Error:', err);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [taskId]);

  const handleSpawn = async () => {
    if (!prompt) return;
    setLoading(true);
    setProgress(0);
    try {
      const id = await meshy.generateModel(`A detailed 3D prop of ${prompt}, high quality tabletop style`);
      setTaskId(id);
    } catch (err) {
      alert('Meshy Synthesis Failed. Check API key!');
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '1.5rem', borderTop: '1.5px solid rgba(123, 78, 178, 0.2)', paddingTop: '1.5rem' }}>
      <h3 style={{ fontSize: '0.8rem', color: 'var(--accent-purple)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
         <Box size={14} /> PROP GENESIS (AI)
      </h3>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input 
          className="input-field" 
          placeholder="e.g. Iron Golem Statue..." 
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={loading}
          style={{ fontSize: '11px', padding: '0.8rem' }}
        />
        <button 
          className="btn" 
          onClick={handleSpawn} 
          disabled={loading || !prompt}
          style={{ padding: '0.8rem', background: 'var(--accent-purple)', minWidth: '50px' }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
        </button>
      </div>
      {loading && (
        <div style={{ fontSize: '9px', color: 'var(--accent-purple)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
           <RefreshCw size={10} className="animate-spin" /> SYNTHESIZING ARCHIVE: {progress}%
        </div>
      )}
    </div>
  );
};

export default MeshySpawner;

