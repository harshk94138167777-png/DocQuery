import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { Loader2 } from 'lucide-react';

export default function JoinCollection() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const join = async () => {
      try {
        const data = await apiFetch(`/collections/join/${token}`, { method: 'POST' });
        navigate(`/collection/${data.collectionId}`);
      } catch (err) {
        setError(err.message);
      }
    };
    join();
  }, [token, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg-primary p-6">
        <div className="glass-panel p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-danger mb-4">Invalid Invitation</h2>
          <p className="text-text-secondary mb-6">{error}</p>
          <button className="btn-primary py-2 px-6" onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-primary p-6">
      <Loader2 className="animate-spin text-accent-primary mb-4" size={48} />
      <h2 className="text-xl font-semibold">Joining Workspace...</h2>
    </div>
  );
}
