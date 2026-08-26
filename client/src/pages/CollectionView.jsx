import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import DocumentList from '../components/DocumentList';
import ChatBox from '../components/ChatBox';
import ConfirmModal from '../components/ConfirmModal';
import { ArrowLeft, Menu, X } from 'lucide-react';

export default function CollectionView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [collection, setCollection] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [members, setMembers] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState({ isOpen: false, id: null });
  const [successAlert, setSuccessAlert] = useState({ isOpen: false, title: '', message: '' });
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [inviteLink, setInviteLink] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState('viewer');

  const fetchCollectionAndMembers = async () => {
    try {
      const colData = await apiFetch(`/collections/${id}`);
      setCollection(colData);
      const memData = await apiFetch(`/collections/${id}/members`);
      setMembers(memData);
      
      const meData = await apiFetch(`/auth/me`);
      const user = meData.user;
      
      const myMember = memData.find(m => 
        (m.userId?._id && m.userId._id === user._id) || 
        (m.userId && m.userId === user._id) ||
        (m.userId?.email && m.userId.email === user.email)
      );
      if (myMember) setCurrentUserRole(myMember.role);
      
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCollectionAndMembers();
  }, [id]);

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/collections/${id}/members`, {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });
      setShowInviteModal(false);
      setInviteEmail('');
      fetchCollectionAndMembers();
      setSuccessAlert({ isOpen: true, title: 'Invite Sent', message: `An invitation email has been sent to ${inviteEmail}.` });
    } catch (err) {
      alert(err.message);
    }
  };

  const generateLink = async () => {
    try {
      const data = await apiFetch(`/collections/${id}/invite-links`, {
        method: 'POST',
        body: JSON.stringify({ role: inviteRole })
      });
      setInviteLink(data.url);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRemoveMember = async (memberUserId) => {
    try {
      await apiFetch(`/collections/${id}/members/${memberUserId}`, { method: 'DELETE' });
      fetchCollectionAndMembers();
    } catch (err) {
      alert(err.message);
    }
  };

  const getRoleStyle = (role) => {
    switch(role) {
      case 'owner': return { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' };
      case 'admin': return { bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/30' };
      case 'member': return { bg: 'bg-green-500/15', text: 'text-green-400', border: 'border-green-500/30' };
      default: return { bg: 'bg-white/5', text: 'text-text-primary', border: 'border-border-color' };
    }
  };

  const roleStyle = getRoleStyle(currentUserRole);

  if (!collection) return <div className="app-container">Loading...</div>;

  return (
    <div className="flex h-screen overflow-hidden">
      {!isSidebarOpen && (
        <button 
          className="btn-secondary absolute top-6 left-6 z-10 p-3 rounded-full"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu size={20} />
        </button>
      )}

      <div 
        className={`glass-panel flex flex-col rounded-none z-10 transition-all duration-300 overflow-hidden shrink-0 ${isSidebarOpen ? 'w-[350px] opacity-100 border-r border-border-color' : 'w-0 opacity-0 border-none'}`}
      >
        <div className="p-6 min-w-[350px] border-b border-white/5 flex flex-col">
          <div className="flex justify-between items-center mb-5">
            <button className="btn-secondary py-1.5 px-2.5 text-[13px]" onClick={() => navigate('/dashboard')}>
              <ArrowLeft size={14} className="mr-1.5" /> Back
            </button>
            <button className="btn-secondary p-1.5 text-text-secondary" onClick={() => setIsSidebarOpen(false)}>
              <X size={16} />
            </button>
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-semibold text-text-primary m-0 p-0">
                  {collection.name.trim()}
                </h2>
                <span className={`text-[10px] ${roleStyle.bg} ${roleStyle.text} py-[3px] px-2 rounded-md uppercase tracking-wider font-bold`}>
                  {currentUserRole}
                </span>
              </div>

              {['admin', 'owner'].includes(currentUserRole) && (
                <button className="btn-secondary py-1.5 px-3 text-xs rounded-md" onClick={() => setShowInviteModal(true)}>
                  + Invite
                </button>
              )}
            </div>
            {collection.description && (
              <p className="text-text-secondary text-[13px] leading-relaxed mt-1 m-0">{collection.description}</p>
            )}
          </div>
          
          <div className="mt-6 border-t border-white/5 pt-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Members</h3>
              {['admin', 'owner'].includes(currentUserRole) && (
                <button className="text-[10px] text-accent-primary hover:underline font-medium" onClick={() => setShowMembersModal(true)}>
                  Manage
                </button>
              )}
            </div>
            <div className="flex -space-x-2 overflow-hidden">
              {members.filter(m => m.status === 'accepted' || m.status === undefined).slice(0, 5).map(m => (
                <div key={m._id} className="inline-block w-8 h-8 rounded-full ring-2 ring-bg-secondary bg-accent-primary/20 flex items-center justify-center overflow-hidden" title={`${m.userId?.displayName} (${m.role})`}>
                  {m.userId?.avatarUrl ? (
                    <img src={m.userId.avatarUrl} alt={m.userId?.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold text-accent-primary">{m.userId?.displayName?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
              ))}
              {members.filter(m => m.status === 'accepted' || m.status === undefined).length > 5 && (
                <div className="inline-block w-8 h-8 rounded-full ring-2 ring-bg-secondary bg-white/10 flex items-center justify-center text-[10px] font-bold text-text-secondary">
                  +{members.filter(m => m.status === 'accepted' || m.status === undefined).length - 5}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 min-w-[350px] min-h-0">
          <DocumentList collectionId={id} currentUserRole={currentUserRole} />
        </div>
      </div>

      <div className="flex-1 flex flex-col relative min-w-0 min-h-0">
        <ChatBox collectionId={id} />
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="glass-panel animate-fade-in p-10 w-full max-w-[440px]">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-2">Invite Member</h2>
              <p className="text-text-secondary text-sm">They will receive an email invitation to join this collection.</p>
            </div>
            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-medium mb-2 text-text-secondary">Role for new member</label>
                <select className="input-field appearance-auto" value={inviteRole} onChange={e=>setInviteRole(e.target.value)}>
                  <option value="viewer">Viewer (Can only read and chat)</option>
                  <option value="member">Member (Can upload/delete files)</option>
                  <option value="admin">Admin (Can invite others)</option>
                </select>
              </div>
              <div className="border-t border-white/10 pt-4 mt-2">
                <label className="block text-sm font-medium mb-2 text-text-secondary">Invite via Email</label>
                <div className="flex gap-2">
                  <input type="email" className="input-field flex-1" placeholder="colleague@company.com" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} />
                  <button type="button" className="btn-primary px-4 whitespace-nowrap" onClick={handleInvite} disabled={!inviteEmail}>Send</button>
                </div>
              </div>
              <div className="border-t border-white/10 pt-4 mt-2">
                <label className="block text-sm font-medium mb-2 text-text-secondary">Or Share Link</label>
                {inviteLink ? (
                  <div className="flex gap-2">
                    <input type="text" className="input-field flex-1 text-xs" readOnly value={inviteLink} onClick={e => e.target.select()} />
                    <button type="button" className="btn-secondary px-4 whitespace-nowrap" onClick={() => { navigator.clipboard.writeText(inviteLink); setSuccessAlert({ isOpen: true, title: 'Copied', message: 'Invite link copied to clipboard.' }); }}>Copy</button>
                  </div>
                ) : (
                  <button type="button" className="btn-secondary w-full py-2.5" onClick={generateLink}>Generate Invite Link</button>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <button type="button" className="btn-secondary w-full py-3.5" onClick={() => setShowInviteModal(false)}>Done</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showMembersModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="glass-panel animate-fade-in p-8 w-full max-w-[500px] max-h-[80vh] flex flex-col">
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold mb-1">Manage Members</h2>
                <p className="text-text-secondary text-sm">View and remove collection members.</p>
              </div>
              <button className="text-text-secondary hover:text-white" onClick={() => setShowMembersModal(false)}><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3">
              {members.map(m => (
                <div key={m._id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent-primary/20 flex items-center justify-center overflow-hidden">
                      {m.userId?.avatarUrl ? (
                        <img src={m.userId.avatarUrl} alt={m.userId?.displayName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-accent-primary">{m.userId?.displayName?.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm flex items-center gap-2">
                        {m.userId?.displayName}
                        {m.status === 'pending' && <span className="text-[9px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded uppercase tracking-wider">Pending</span>}
                      </div>
                      <div className="text-xs text-text-secondary">{m.userId?.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-[10px] ${getRoleStyle(m.role).bg} ${getRoleStyle(m.role).text} py-1 px-2 rounded-md uppercase font-bold`}>{m.role}</span>
                    {m.role !== 'owner' && (
                      <button className="text-xs text-danger hover:underline font-medium cursor-pointer" onClick={() => setShowConfirmModal({ isOpen: true, id: m.userId?._id })}>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showConfirmModal.isOpen}
        title="Remove Member"
        message="Are you sure you want to remove this member? They will instantly lose access to all documents and chat history in this collection."
        confirmText="Remove Member"
        onConfirm={() => handleRemoveMember(showConfirmModal.id)}
        onCancel={() => setShowConfirmModal({ isOpen: false, id: null })}
      />

      <ConfirmModal
        isOpen={successAlert.isOpen}
        title={successAlert.title}
        message={successAlert.message}
        confirmText="Okay"
        isDanger={false}
        isAlert={true}
        onConfirm={() => setSuccessAlert({ isOpen: false, title: '', message: '' })}
      />
    </div>
  );
}
