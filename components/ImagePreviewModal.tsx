import React, { useState } from 'react';
import Loader from './Loader';

interface ImagePreviewModalProps {
  images: string[];
  isLoading: boolean;
  onClose: () => void;
  onDownloadAll: () => void;
  onDownloadSingle: () => void;
  topic: string;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ images, isLoading, onClose, onDownloadAll, onDownloadSingle, topic }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex(prevIndex => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
  };

  const goToNext = () => {
    setCurrentIndex(prevIndex => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
  };

  const handleDownloadAllClick = () => {
    onDownloadAll();
    onClose();
  };
  
  const handleDownloadSingleClick = () => {
    onDownloadSingle();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b dark:border-slate-700">
          <h2 className="text-xl font-bold text-[#2d3336] dark:text-slate-100">图片预览与下载</h2>
          <button onClick={onClose} className="text-[#2d3336] dark:text-slate-300 hover:text-[#e14b30] dark:hover:text-[#e14b30] transition-colors" aria-label="关闭">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <main className="flex-grow p-4 overflow-y-auto min-h-[20rem]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
                <Loader />
            </div>
          ) : images.length > 0 ? (
            <div className="relative">
              <img src={images[currentIndex]} alt={`预览 ${topic} 第 ${currentIndex + 1} 部分`} className="w-full h-auto rounded-lg border dark:border-slate-700" />
              {images.length > 1 && (
                <>
                  <button onClick={goToPrevious} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white dark:bg-slate-900/70 dark:hover:bg-slate-900 rounded-full p-2 shadow-md transition-all" aria-label="上一张">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button onClick={goToNext} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white dark:bg-slate-900/70 dark:hover:bg-slate-900 rounded-full p-2 shadow-md transition-all" aria-label="下一张">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 dark:bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                    {currentIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
                <p className="text-center text-[#2d3336] dark:text-slate-300 py-16">无法生成图片预览。</p>
            </div>
          )}
        </main>

        <footer className="p-4 bg-[#fffdfa] dark:bg-slate-900/50 border-t dark:border-slate-700 rounded-b-xl flex flex-col sm:flex-row justify-end items-center gap-3">
            <button
                onClick={handleDownloadSingleClick}
                disabled={isLoading}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#e14b30] text-white font-semibold rounded-lg hover:bg-[#b63c27] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e14b30] dark:focus:ring-offset-slate-800 disabled:bg-slate-400 dark:disabled:bg-slate-600 transition-colors"
              >
                下载为单张长图
            </button>
            <button
              onClick={handleDownloadAllClick}
              disabled={isLoading || images.length === 0}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#2d3336] text-white font-semibold rounded-lg hover:bg-[#4a555c] dark:bg-slate-700 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2d3336] dark:focus:ring-slate-600 dark:focus:ring-offset-slate-800 disabled:bg-slate-400 dark:disabled:bg-slate-600 transition-colors"
            >
              下载为 ZIP 压缩包 ({images.length})
            </button>
        </footer>
      </div>
    </div>
  );
};

export default ImagePreviewModal;