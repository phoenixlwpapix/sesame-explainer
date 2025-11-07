import React from 'react';

const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
        <>
            {parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i}>{part.slice(2, -2)}</strong>;
                }
                return part;
            })}
        </>
    );
};

const ChipLoader: React.FC = () => (
    <div className="flex items-center space-x-2">
      <div className="w-2 h-2 bg-[#e14b30] rounded-full animate-pulse [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-[#e14b30] rounded-full animate-pulse [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-[#e14b30] rounded-full animate-pulse"></div>
    </div>
);


interface ChipExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  chipName: string | null;
  explanation: string | null;
  isLoading: boolean;
}

const ChipExplanationModal: React.FC<ChipExplanationModalProps> = ({ isOpen, onClose, chipName, explanation, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="chip-modal-title">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b dark:border-slate-700">
          <h2 id="chip-modal-title" className="text-lg font-bold text-[#2d3336] dark:text-slate-100">
            <SimpleMarkdown text={`什么是 **${chipName}**？`} />
          </h2>
          <button onClick={onClose} className="text-[#2d3336] dark:text-slate-300 hover:text-[#e14b30] dark:hover:text-[#e14b30] transition-colors" aria-label="关闭">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <main className="p-6 min-h-[8rem] flex items-center justify-center text-center">
          {isLoading && <ChipLoader />}
          {!isLoading && explanation && (
            <p className="text-[#2d3336] dark:text-slate-300">
                <SimpleMarkdown text={explanation} />
            </p>
          )}
           {!isLoading && !explanation && (
            <p className="text-slate-500 dark:text-slate-400">无法加载解释。</p>
          )}
        </main>
      </div>
    </div>
  );
};

export default ChipExplanationModal;
