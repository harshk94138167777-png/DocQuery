import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { Plus, Folder, Edit2, Trash2 } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [collections, setCollections] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState({ isOpen: false, id: null });
  const [editData, setEditData] = useState({ id: '', name: '', description: '' });
  const [newColName, setNewColName] = useState('');
  const [newColDesc, setNewColDesc] = useState('');
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [colData, invData, meData] = await Promise.all([
        apiFetch('/collections'),
        apiFetch('/collections/invitations/pending'),
        apiFetch('/auth/me')
      ]);
      setCollections(colData);
      setInvitations(invData);
      setUser(meData.user);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAcceptInvite = async (collectionId) => {
    try {
      await apiFetch(`/collections/${collectionId}/invitations/accept`, { method: 'POST' });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRejectInvite = async (collectionId) => {
    try {
      await apiFetch(`/collections/${collectionId}/invitations/reject`, { method: 'POST' });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const col = await apiFetch('/collections', {
        method: 'POST',
        body: JSON.stringify({ name: newColName, description: newColDesc })
      });
      setShowModal(false);
      setNewColName('');
      setNewColDesc('');
      navigate(`/collection/${col._id}`);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/collections/${editData.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: editData.name, description: editData.description })
      });
      setShowEditModal(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiFetch(`/collections/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const getRoleStyle = (role) => {
    switch(role) {
      case 'owner': return { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' };
      case 'admin': return { bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/30' };
      case 'member': return { bg: 'bg-green-500/15', text: 'text-green-400', border: 'border-green-500/30' };
      default: return { bg: 'bg-white/5', text: 'text-text-secondary', border: 'border-border-color' };
    }
  };

  return (
    <div className="animate-fade-in min-h-screen flex flex-col">
      <nav className="py-5 px-10 flex justify-between items-center border-b border-border-color bg-bg-glass backdrop-blur-md z-10 sticky top-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-b from-accent-primary to-accent-hover p-1.5 rounded-lg shadow-[0_4px_12px_var(--accent-glow)]">
              <Folder color="white" size={20} />
            </div>
            <span className="text-[22px] font-extrabold tracking-tight text-text-primary">DocQ</span>
          </div>
          
          <div className="h-5 w-px bg-border-highlight"></div>
          
          <span className="text-base font-medium text-text-secondary">Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <button 
              className="w-9 h-9 rounded-full ring-2 ring-transparent hover:ring-accent-primary/50 transition-all bg-accent-primary/20 flex items-center justify-center overflow-hidden cursor-pointer border border-accent-primary/30"
              onClick={() => navigate('/profile')}
              title="Your Profile"
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-accent-primary">{user.displayName?.charAt(0).toUpperCase() || 'U'}</span>
              )}
            </button>
          )}
          <button className="btn-secondary py-2 px-4 text-sm text-text-secondary" onClick={() => navigate('/login')}>Log Out</button>
        </div>
      </nav>
      
      <div className="app-container flex-1 py-10 w-full">
        {invitations.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent-primary animate-pulse"></span>
              Pending Invitations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {invitations.map(inv => (
                <div key={inv._id} className="glass-panel p-5 flex items-center justify-between rounded-2xl border border-accent-primary/20 bg-accent-primary/5">
                  <div>
                    <div className="font-semibold text-text-primary">{inv.collection.name}</div>
                    <div className="text-xs text-text-secondary mt-1">
                      Invited by <span className="font-medium text-text-primary">{inv.inviter.displayName}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-secondary py-1.5 px-3 text-xs bg-red-500/10 text-danger border-none hover:bg-red-500/20" onClick={() => handleRejectInvite(inv.collectionId)}>Decline</button>
                    <button className="btn-primary py-1.5 px-4 text-xs" onClick={() => handleAcceptInvite(inv.collectionId)}>Accept</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold mb-1.5 tracking-tight">Your Collections</h1>
            <p className="text-text-secondary text-[15px]">Manage and organize your documents securely.</p>
          </div>
          {collections.length > 0 && (
            <button className="btn-primary py-2.5 px-5 rounded-xl flex items-center gap-2" onClick={() => setShowModal(true)}>
              <Plus size={18} /> Create Collection
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {collections.map(col => {
            const roleStyle = getRoleStyle(col.userRole);
            return (
              <div 
                key={col._id} 
                className="glass-panel group p-8 cursor-pointer flex flex-col min-h-[220px] relative overflow-hidden"
                onClick={() => navigate(`/collection/${col._id}`)}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                      <Folder className="text-text-primary" size={20} />
                    </div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-lg font-semibold text-text-primary m-0 p-0 truncate max-w-[150px]">
                        {(col.name || '').trim()}
                      </h2>
                      <span className={`text-[10px] ${roleStyle.bg} ${roleStyle.text} py-[3px] px-2 rounded-md uppercase tracking-wider font-bold inline-block shrink-0`}>
                        {col.userRole}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {['admin', 'owner'].includes(col.userRole) && (
                      <button 
                        className="btn-secondary p-1.5 rounded-lg border-none bg-white/5" 
                        onClick={(e) => { e.stopPropagation(); setEditData({ id: col._id, name: col.name, description: col.description || '' }); setShowEditModal(true); }}
                        title="Edit Collection"
                      >
                        <Edit2 size={14} className="text-text-secondary" />
                      </button>
                    )}
                    {col.userRole === 'owner' && (
                      <button 
                        className="btn-secondary p-1.5 rounded-lg border-none bg-red-400/10 hover:bg-red-400/20 cursor-pointer transition-colors" 
                        onClick={(e) => { e.stopPropagation(); setShowConfirmModal({ isOpen: true, id: col._id }); }}
                        title="Delete Collection"
                      >
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-text-secondary flex-1 leading-relaxed text-[15px] line-clamp-3">
                  {col.description || 'No description provided for this collection.'}
                </p>
                <div className="mt-6 pt-4 border-t border-border-color flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-text-secondary text-[13px] font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-text-secondary"></div>
                    {col.documentCount} Document{col.documentCount !== 1 ? 's' : ''}
                  </div>
                  <span className="text-accent-primary text-sm font-semibold flex items-center gap-1 transition-all duration-200">
                    Open <span className="group-hover:translate-x-1 transition-transform duration-200">&rarr;</span>
                  </span>
                </div>
              </div>
            );
          })}
          
          {collections.length === 0 && !loading && (
            <div className="col-span-full text-center py-24 px-5 bg-white/5 rounded-[24px] border border-dashed border-white/10 flex flex-col items-center">
              <div className="bg-white/5 p-6 rounded-full mb-6 border border-white/10">
                <Folder size={48} className="text-text-primary opacity-90" />
              </div>
              <h3 className="text-[26px] mb-3 font-bold tracking-tight">No collections yet</h3>
              <p className="text-text-secondary text-base max-w-[440px] mb-9 leading-relaxed">
                Collections help you group related documents together to create isolated AI workspaces. Create your first collection to get started.
              </p>
              <button className="btn-primary py-3 px-6 rounded-xl" onClick={() => setShowModal(true)}>
                <Plus size={20} className="mr-2" /> Create Workspace
              </button>
            </div>
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
            <div className="glass-panel animate-fade-in p-10 w-full max-w-[440px]">
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-2">Create New Collection</h2>
                <p className="text-text-secondary text-sm">Collections are used to organize your documents.</p>
              </div>
              <form onSubmit={handleCreate} className="flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-medium mb-2 text-text-secondary">Name</label>
                  <input className="input-field" placeholder="e.g. Q3 Financial Reports" required value={newColName} onChange={e=>setNewColName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-text-secondary">Description <span className="opacity-50">(Optional)</span></label>
                  <textarea className="input-field" placeholder="What is this collection about?" value={newColDesc} onChange={e=>setNewColDesc(e.target.value)} rows={3} />
                </div>
                <div className="flex gap-4 mt-4">
                  <button type="button" className="btn-secondary flex-1 py-3.5" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary flex-1 py-3.5">Create Collection</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showEditModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
            <div className="glass-panel animate-fade-in p-10 w-full max-w-[440px]">
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-2">Edit Collection</h2>
                <p className="text-text-secondary text-sm">Update the name or description of your collection.</p>
              </div>
              <form onSubmit={handleEdit} className="flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-medium mb-2 text-text-secondary">Name</label>
                  <input className="input-field" placeholder="e.g. Q3 Financial Reports" required value={editData.name} onChange={e=>setEditData({...editData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-text-secondary">Description <span className="opacity-50">(Optional)</span></label>
                  <textarea className="input-field" placeholder="What is this collection about?" value={editData.description} onChange={e=>setEditData({...editData, description: e.target.value})} rows={3} />
                </div>
                <div className="flex gap-4 mt-4">
                  <button type="button" className="btn-secondary flex-1 py-3.5" onClick={() => setShowEditModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary flex-1 py-3.5">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showConfirmModal.isOpen}
        title="Delete Collection"
        message="Are you sure you want to completely delete this collection? All documents, chat history, and member access will be permanently removed. This action cannot be undone."
        confirmText="Delete Collection"
        onConfirm={() => handleDelete(showConfirmModal.id)}
        onCancel={() => setShowConfirmModal({ isOpen: false, id: null })}
      />
    </div>
  );
}
