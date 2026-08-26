import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { ArrowLeft, User as UserIcon } from 'lucide-react';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await apiFetch('/auth/me');
        setUser(data.user);
        setDisplayName(data.user.displayName || '');
        setAvatarUrl(data.user.avatarUrl || '');
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiFetch('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({ displayName, avatarUrl: avatarUrl || null })
      });
      setUser(data.user);
      alert('Profile updated successfully!');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="app-container py-10">Loading...</div>;

  return (
    <div className="animate-fade-in min-h-screen flex flex-col bg-bg-secondary">
      <nav className="py-5 px-10 flex justify-between items-center border-b border-border-color bg-bg-glass backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-b from-accent-primary to-accent-hover p-1.5 rounded-lg shadow-[0_4px_12px_var(--accent-glow)] flex items-center justify-center w-8 h-8">
              <UserIcon color="white" size={18} />
            </div>
            <span className="text-[22px] font-extrabold tracking-tight text-text-primary">DocQ</span>
          </div>
          
          <div className="h-5 w-px bg-border-highlight"></div>
          
          <span className="text-base font-medium text-text-primary">Your Profile</span>
        </div>
        
        <button className="btn-secondary py-2 px-4 text-sm" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={16} className="mr-2 inline" /> Back to Dashboard
        </button>
      </nav>

      <div className="flex-1 flex justify-center py-12 px-6">
        <div className="glass-panel w-full max-w-xl p-10 rounded-3xl h-fit">
          <div className="flex items-center gap-6 mb-8 pb-8 border-b border-white/10">
            <div className="w-24 h-24 rounded-full bg-accent-primary/20 flex items-center justify-center overflow-hidden border-2 border-accent-primary/30">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-accent-primary">{user.displayName?.charAt(0).toUpperCase() || 'U'}</span>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-1">{user.displayName}</h2>
              <p className="text-text-secondary">{user.email}</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="flex flex-col gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-text-secondary">Display Name</label>
              <input 
                className="input-field" 
                value={displayName} 
                onChange={e => setDisplayName(e.target.value)} 
                required 
                minLength={2} 
                maxLength={50}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-text-secondary">Avatar URL (Optional)</label>
              <input 
                type="url"
                className="input-field" 
                placeholder="https://example.com/avatar.png"
                value={avatarUrl} 
                onChange={e => setAvatarUrl(e.target.value)} 
              />
              <p className="text-xs text-text-secondary mt-2">Link to a square image (e.g., from Imgur or GitHub).</p>
            </div>
            
            <div className="mt-4">
              <button type="submit" className="btn-primary w-full py-4 text-base" disabled={loading}>
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
