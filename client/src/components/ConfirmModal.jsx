export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Delete', isDanger = true, isAlert = false }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200]">
      <div className="glass-panel animate-fade-in p-8 w-full max-w-[400px] flex flex-col items-center text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDanger ? 'bg-red-500/10 text-danger' : 'bg-accent-primary/10 text-accent-primary'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isDanger ? (
              <>
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </>
            ) : (
              <>
                <polyline points="20 6 9 17 4 12"></polyline>
              </>
            )}
          </svg>
        </div>
        
        <h2 className="text-xl font-bold mb-2 text-text-primary">{title}</h2>
        <p className="text-sm text-text-secondary mb-8 leading-relaxed">{message}</p>
        
        <div className="flex w-full gap-3">
          {!isAlert && (
            <button 
              className="flex-1 py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-text-primary hover:bg-white/10 font-medium transition-all cursor-pointer"
              onClick={onCancel}
            >
              Cancel
            </button>
          )}
          <button 
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all shadow-md cursor-pointer ${
              isDanger 
                ? 'bg-danger/90 hover:bg-danger text-white border-none' 
                : 'bg-accent-primary hover:bg-accent-hover text-white border-none'
            }`}
            onClick={() => {
              onConfirm();
              if (onCancel) onCancel();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
