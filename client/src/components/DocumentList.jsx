import { useState, useEffect, useRef } from 'react';
import { apiFetch, apiUpload } from '../services/api';
import { UploadCloud, FileText, Trash2 } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

export default function DocumentList({ collectionId, currentUserRole }) {
  const [documents, setDocuments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState({ isOpen: false, id: null });
  const fileInputRef = useRef(null);

  const fetchDocuments = async () => {
    try {
      const data = await apiFetch(`/documents/${collectionId}?limit=50`);
      const docs = Array.isArray(data) ? data : [];
      setDocuments(docs);
      window.dispatchEvent(new CustomEvent('doc-count-update', { detail: docs.length }));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDocuments();
    const interval = setInterval(fetchDocuments, 5000);
    return () => clearInterval(interval);
  }, [collectionId]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExtensions = ['.pdf', '.txt', '.md', '.csv', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      alert(`Unsupported file type. Allowed: PDF, TXT, MD, CSV, DOCX`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append('document', file);

    try {
      await apiUpload(`/documents/upload/${collectionId}`, formData, (progress) => {
        setUploadProgress(progress);
      });
      fetchDocuments();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (docId) => {
    try {
      await apiFetch(`/documents/${collectionId}/${docId}`, { method: 'DELETE' });
      fetchDocuments();
    } catch (err) {
      alert(err.message);
    }
  };

  const canEdit = currentUserRole !== 'viewer';

  return (
    <div>
      {canEdit && (
        <div className="mb-6">
          <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept=".pdf,.txt,.md,.csv,.docx" />
          <button 
            className="btn-primary w-full py-3 text-sm relative overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading && (
              <div className="absolute top-0 left-0 h-full bg-white/20 transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
            )}
            <div className="relative z-10 flex items-center justify-center gap-2 w-full">
              <UploadCloud size={18} />
              <span className="font-semibold">{isUploading ? `Uploading... ${uploadProgress}%` : 'Upload Document'}</span>
            </div>
          </button>
          <div className="text-center text-text-secondary text-xs mt-2.5 opacity-70 font-medium">
            PDF, DOCX or TXT &middot; Max 20 MB
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary m-0">Your Documents</h3>
          {documents.length > 0 && (
            <span className="text-xs text-text-secondary font-medium">
              {documents.length} document{documents.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {documents.map(doc => (
          <div key={doc._id} className="glass-panel py-4 px-5 flex items-center justify-between rounded-2xl bg-bg-glass-hover">
            <div className="flex items-center gap-4 overflow-hidden">
              <div className="p-2.5 bg-bg-secondary rounded-xl">
                <FileText size={20} className={doc.status === 'ready' ? 'text-success' : 'text-text-secondary'} />
              </div>
              <div className="min-w-0">
                <div className="text-[15px] font-semibold truncate max-w-[180px]">
                  {doc.fileName}
                </div>
                <div className={`text-xs mt-1 flex items-center gap-1 ${doc.status === 'ready' ? 'text-success' : doc.status === 'failed' ? 'text-danger' : 'text-text-secondary'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${doc.status === 'ready' ? 'bg-success' : doc.status === 'failed' ? 'bg-danger' : 'bg-text-secondary'}`}></div>
                  {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                </div>
                {doc.status === 'failed' && doc.processingError && (
                  <div className="text-[11px] text-danger mt-1 max-w-[180px] truncate" title={doc.processingError}>
                    Error: {doc.processingError}
                  </div>
                )}
              </div>
            </div>
            {canEdit && (
              <button className="bg-red-500/10 border-none text-danger cursor-pointer p-2 rounded-lg transition-all hover:bg-red-500/20 flex" onClick={() => setShowConfirmModal({ isOpen: true, id: doc._id })} title="Delete Document">
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
        {documents.length === 0 && !isUploading && (
          <div className="glass-panel text-center py-6 px-5 rounded-2xl flex flex-col items-center gap-2 bg-white/5 border border-white/5 mt-2">
            <div className="bg-white/5 p-3 rounded-full mb-1">
              <FileText size={20} className="text-text-secondary" />
            </div>
            <h4 className="text-sm font-semibold text-text-primary m-0">No documents yet</h4>
            <p className="text-text-secondary text-xs m-0 leading-relaxed">
              {canEdit ? 'Upload your first document to get started.' : 'No documents have been uploaded to this collection.'}
            </p>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showConfirmModal.isOpen}
        title="Delete Document"
        message="Are you sure you want to delete this document? The AI will no longer be able to answer questions based on its contents."
        confirmText="Delete Document"
        onConfirm={() => handleDelete(showConfirmModal.id)}
        onCancel={() => setShowConfirmModal({ isOpen: false, id: null })}
      />
    </div>
  );
}
