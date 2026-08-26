import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { LogIn } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', displayName: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email: formData.email, password: formData.password }) });
      } else {
        await apiFetch('/auth/signup', { method: 'POST', body: JSON.stringify(formData) });
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="glass-panel animate-fade-in p-12 w-full max-w-[440px] flex flex-col gap-6">
        <div className="text-center">
          <div className="inline-flex p-4 bg-white/5 rounded-2xl mb-6 border border-white/10">
            <LogIn size={32} className="text-text-primary" />
          </div>
          <h1 className="text-[28px] font-bold tracking-tight">
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h1>
          <p className="text-text-secondary mt-2">
            {isLogin ? 'Enter your details to access your documents.' : 'Get started with DocQ today.'}
          </p>
        </div>
        
        {error && <div className="bg-red-500/10 border border-danger text-danger p-3 rounded-lg text-sm text-center">{error}</div>}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {!isLogin && (
            <div>
              <label className="block mb-2 text-sm font-medium text-text-secondary">Display Name</label>
              <input 
                className="input-field" type="text" placeholder="John Doe" required
                value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})}
              />
            </div>
          )}
          <div>
            <label className="block mb-2 text-sm font-medium text-text-secondary">Email Address</label>
            <input 
              className="input-field" type="email" placeholder="you@example.com" required
              value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-text-secondary">Password</label>
            <input 
              className="input-field" type="password" placeholder="••••••••" required
              value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>
          <button type="submit" className="btn-primary mt-3 p-4">
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>
        
        <div className="text-center text-sm text-text-secondary">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span className="text-accent-primary cursor-pointer font-semibold" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Sign up' : 'Log in'}
          </span>
        </div>
      </div>
    </div>
  );
}
