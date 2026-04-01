import React, { useState, useRef } from 'react';
import { Mic, Square, Play, Trash2, Volume2, Save } from 'lucide-react';

const SoundRecorder = ({ onSave, entityName }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      alert('Microphone Access Denied: ' + err.message);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const handleSave = () => {
    if (!audioUrl) return;
    onSave(audioUrl);
    setAudioUrl(null);
    console.log('Saved sound byte for:', entityName);
  };

  return (
    <div style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
      <h4 style={{ fontSize: '0.8rem', color: 'var(--accent-purple)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Volume2 size={14} /> VOICE MEMO FOR {entityName.toUpperCase()}
      </h4>
      
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        {!isRecording ? (
          <button 
            className="btn" 
            onClick={startRecording}
            style={{ padding: '0.5rem', borderRadius: '50%', background: 'rgba(255,75,75,0.1)', color: '#ff4b4b', border: '1px solid #ff4b4b' }}
          >
            <Mic size={16} />
          </button>
        ) : (
          <button 
            className="btn" 
            onClick={stopRecording}
            style={{ padding: '0.5rem', borderRadius: '50%', background: '#ff4b4b', color: 'white', border: '1px solid #ff4b4b' }}
          >
            <Square size={16} />
          </button>
        )}

        {audioUrl && (
          <>
            <button 
              className="btn" 
              onClick={() => new Audio(audioUrl).play()}
              style={{ padding: '0.5rem', borderRadius: '50%', background: 'var(--accent-purple)', color: 'white' }}
            >
              <Play size={16} />
            </button>
            <button 
              className="btn btn-outline" 
              onClick={handleSave}
              style={{ fontSize: '10px', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Save size={12} /> ATTACH TO CHARACTER
            </button>
            <button 
              className="btn btn-outline" 
              onClick={() => setAudioUrl(null)}
              style={{ padding: '0.5rem', borderRadius: '50%', color: '#ff4b4b', border: '1px solid #ff4b4b' }}
            >
              <Trash2 size={16} />
            </button>
          </>
        )}

        {isRecording && <span style={{ fontSize: '11px', color: '#ff4b4b', animation: 'pulse 1s infinite' }}>RECORDING...</span>}
      </div>
    </div>
  );
};

export default SoundRecorder;
