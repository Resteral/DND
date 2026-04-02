import { Music, Volume2, Play, Pause, List, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

const InitiativeTracker = ({ initiative = [], onUpdate }) => {
  const nextTurn = () => {
    if (initiative.length === 0) return;
    const newInit = [...initiative.slice(1), initiative[0]];
    onUpdate(newInit);
  };

  const removeCombatant = (index) => {
    const newInit = initiative.filter((_, i) => i !== index);
    onUpdate(newInit);
  };

  return (
    <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '1rem' }}>
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <List size={14} /> COMBAT INITIATIVE
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
             <button className="btn" style={{ padding: '4px 8px', fontSize: '9px', background: 'var(--accent-purple)' }} onClick={nextTurn}>NEXT TURN</button>
             <button className="btn" style={{ padding: '4px', background: '#4b1818' }} onClick={() => onUpdate([])}><Trash2 size={12} /></button>
          </div>
       </div>
       <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {initiative.map((item, i) => (
             <div key={i} style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                background: i === 0 ? 'rgba(123, 78, 178, 0.2)' : 'rgba(255,255,255,0.03)', 
                padding: '0.5rem 0.75rem', borderRadius: '6px',
                borderLeft: i === 0 ? '3px solid var(--accent-purple)' : 'none'
             }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                   <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>#{i + 1}</span>
                   <b style={{ color: i === 0 ? 'var(--accent-purple)' : 'white' }}>{item.name}</b>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                   <div style={{ fontWeight: 'bold', color: 'var(--accent-gold)' }}>{item.val}</div>
                   <button style={{ background: 'none', border: 'none', color: '#ff4b4b', cursor: 'pointer' }} onClick={() => removeCombatant(i)}><Trash2 size={10} /></button>
                </div>
             </div>
          ))}
          {initiative.length === 0 && <p style={{ fontSize: '0.75rem', opacity: 0.3, textAlign: 'center' }}>No active combat...</p>}
       </div>
    </div>
  );
};

const AmbientAudio = ({ activeTrack, onTrackChange }) => {
  const tracks = [
    { name: 'Dungeon Ambience', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' }, // Placeholder
    { name: 'Tavern Social', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { name: 'Boss Combat', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' }
  ];

  return (
    <div style={{ background: 'rgba(0,0,0,0.6)', padding: '1rem', borderRadius: '12px', border: '1.5px solid var(--accent-purple)' }}>
       <h3 style={{ fontSize: '0.8rem', color: 'var(--accent-purple)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Music size={14} /> REALM ATMOSPHERE
       </h3>
       <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {tracks.map(t => (
             <button 
                key={t.name}
                className="btn btn-outline" 
                onClick={() => onTrackChange(t)}
                style={{ fontSize: '10px', padding: '0.5rem', textAlign: 'left', border: activeTrack?.name === t.name ? '1px solid var(--accent-purple)' : '1px solid rgba(255,255,255,0.05)' }}
             >
                <Volume2 size={12} style={{ marginRight: '8px' }} /> {t.name}
             </button>
          ))}
       </div>
    </div>
  );
};

export { InitiativeTracker, AmbientAudio };
