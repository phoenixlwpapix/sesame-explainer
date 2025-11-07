import React, { useState, useRef, useCallback, useEffect } from 'react';
import { generateExplanation, generateChipExplanation } from './services/geminiService';
import {
  downloadAsHtml,
  downloadAsSingleImage,
  createImageSlices,
  downloadSlicesAsZip,
  downloadAsPdf
} from './services/exportService';
import type { ExplanationResponse } from './types';
import ExplanationDisplay from './components/ExplanationDisplay';
import Loader from './components/Loader';
import ImagePreviewModal from './components/ImagePreviewModal';
import ThemeToggle from './components/ThemeToggle';
import ChipExplanationModal from './components/ChipExplanationModal';

const popularTopics = ["大语言模型", "提示词工程", "具身智能", "钝感力", "世界模拟器"];

const App: React.FC = () => {
  const [topic, setTopic] = useState<string>('');
  const [currentTopic, setCurrentTopic] = useState<string>('');
  const [explanation, setExplanation] = useState<ExplanationResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const explanationRef = useRef<HTMLDivElement>(null);

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [isSlicing, setIsSlicing] = useState<boolean>(false);
  const [slicedImages, setSlicedImages] = useState<string[]>([]);

  const [isChipModalOpen, setIsChipModalOpen] = useState<boolean>(false);
  const [selectedChip, setSelectedChip] = useState<string | null>(null);
  const [chipExplanation, setChipExplanation] = useState<string | null>(null);
  const [isChipLoading, setIsChipLoading] = useState<boolean>(false);

  const handleGenerate = useCallback(async (topicToGenerate: string) => {
    if (!topicToGenerate.trim()) {
      setError('请输入一个你想知道的东西。');
      return;
    }
    setIsLoading(true);
    setError(null);
    setExplanation(null);

    try {
      const result = await generateExplanation(topicToGenerate);
      setExplanation(result);
      setCurrentTopic(topicToGenerate);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '抱歉，发生未知错误，请重试。');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchChipExplanation = useCallback(async (chipName: string) => {
    if (!currentTopic) {
      setChipExplanation("无法获取当前主题的上下文信息。");
      return;
    };

    setIsChipLoading(true);
    setChipExplanation(null);
    try {
      const result = await generateChipExplanation(chipName, currentTopic);
      setChipExplanation(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '未知错误';
      setChipExplanation(`加载失败: ${message}`);
    } finally {
      setIsChipLoading(false);
    }
  }, [currentTopic]);

  const handleChipClick = (chipName: string) => {
    setSelectedChip(chipName);
    setIsChipModalOpen(true);
    fetchChipExplanation(chipName);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    handleGenerate(topic);
  };

  const handleTopicClick = (selectedTopic: string) => {
    setTopic(selectedTopic);
    handleGenerate(selectedTopic);
  };
  
  const handleInputFocus = () => {
    if (explanation) {
      setTopic('');
    }
  };

  const handleDownloadHtml = () => {
    downloadAsHtml(explanationRef, explanation, topic);
  };
  
  const handleDownloadSingleImage = () => {
    if (!explanationRef.current || !explanation) return;

    downloadAsSingleImage(explanationRef, topic)
      .catch(err => {
        console.error('Error generating image:', err);
        setError(err instanceof Error ? err.message : '创建图片失败，请稍后重试。');
      });
  };

  const handleDownloadPdf = () => {
    if (!explanationRef.current || !explanation) return;
    downloadAsPdf(explanationRef, topic)
      .catch(err => {
        console.error('Error generating PDF:', err);
        setError(err instanceof Error ? err.message : '创建 PDF 失败，请稍后重试。');
      });
  };

  const runImageSlicing = useCallback(async () => {
    if (!explanation) return;
    
    setIsSlicing(true);
    setSlicedImages([]);
    setError(null);

    try {
      const imageUrls = await createImageSlices(explanationRef);
      setSlicedImages(imageUrls);
    } catch (err: unknown) {
      console.error(`Error generating image slices:`, err);
      const errorMessage = err instanceof Error ? err.message : '创建分割图片时出错。';
      setError(errorMessage);
    } finally {
      setIsSlicing(false);
    }
  }, [explanation]);

  useEffect(() => {
    if (isPreviewModalOpen) {
        runImageSlicing();
    }
  }, [isPreviewModalOpen, runImageSlicing]);

  const handleDownloadImageClick = () => {
    if (!explanationRef.current || !explanation) return;
    setIsPreviewModalOpen(true);
  };

  const handleDownloadAllSliced = async () => {
    try {
      await downloadSlicesAsZip(slicedImages, topic);
    } catch (err: unknown) {
      console.error("Error creating zip file:", err);
      setError(err instanceof Error ? err.message : '创建ZIP压缩包失败，请稍后重试。');
    }
  };

  return (
    <div className="min-h-screen font-sans text-slate-800 dark:text-slate-200 p-4 sm:p-6 md:p-8 flex items-center justify-center">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>
      <div className="max-w-4xl w-full">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center">
            {/* FIX: Changed xmlns:xlink to xmlnsXlink for JSX compatibility. */}
            <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
            	 viewBox="0 0 512.001 512.001" xmlSpace="preserve" className="h-10 w-10 mr-3">
              <g>
                <path style={{fill:'#b63c27'}} d="M273.357,385.122c0-202.505,225.648,0,225.648,0S273.357,587.626,273.357,385.122z"/>
                <path style={{fill:'#b63c27'}} d="M12.994,385.122c0,0,225.648-202.505,225.648,0S12.994,385.122,12.994,385.122z"/>
              </g>
              <path style={{fill:'#e14b30'}} d="M255.999,41.188c0,0,202.505,225.648,0,225.648S255.999,41.188,255.999,41.188z"/>
              <path className="fill-[#6a1e16] dark:fill-[#f8a596]" d="M255.999,275.514c-49.985,0-81.409-13.622-93.397-40.488c-13.002-29.14-2.003-71.908,32.689-127.115 c25.016-39.808,53.067-71.203,54.249-72.52l6.459-7.198l6.459,7.198c1.181,1.317,29.234,32.712,54.249,72.52 c34.692,55.207,45.691,97.975,32.689,127.115C337.409,261.892,305.986,275.514,255.999,275.514z M256.002,54.391 c-33.418,39.315-97.514,128.835-77.547,173.566c8.945,20.039,35.034,30.199,77.544,30.199c42.512,0,68.603-10.162,77.547-30.204 C353.522,183.185,289.424,93.693,256.002,54.391z"/>
              <path className="fill-[#6a1e16] dark:fill-[#f8a596]" d="M331.875,483.807c-9.892,0-18.801-1.76-26.707-5.289c-26.866-11.988-40.488-43.411-40.488-93.396 s13.622-81.409,40.488-93.396c29.141-13.001,71.908-2.003,127.115,32.689c39.809,25.016,71.203,53.068,72.521,54.249l7.198,6.459 l-7.198,6.459c-1.318,1.181-32.712,29.234-72.521,54.249C392.056,471.109,358.432,483.807,331.875,483.807z M331.802,303.8 c-7.146,0-13.734,1.175-19.567,3.778c-20.039,8.945-30.2,35.034-30.2,77.543c0,42.512,10.162,68.603,30.204,77.545 c5.838,2.605,12.438,3.78,19.586,3.78c47.668,0.002,119.797-52.26,153.975-81.325C451.612,356.064,379.454,303.8,331.802,303.8z"/>
              <path className="fill-[#6a1e16] dark:fill-[#f8a596]" d="M180.125,483.807c-26.558,0-60.177-12.698-100.408-37.977c-39.809-25.016-71.203-53.068-72.521-54.249L0,385.122 l7.198-6.459c1.318-1.181,32.712-29.234,72.521-54.249c55.207-34.694,97.978-45.692,127.115-32.689 c26.866,11.988,40.488,43.411,40.488,93.396s-13.622,81.409-40.488-93.396C198.927,482.046,190.013,483.807,180.125,483.807z M26.199,385.12c34.189,29.06,106.346,81.32,153.998,81.322c7.146,0,13.734-1.175,19.567-3.778 c20.039-8.945,30.2-35.034,30.2-77.543c0-42.512-10.162-68.603-30.204-77.545C154.989,287.601,65.5,351.697,26.199,385.12z"/>
            </svg>
            <h1 className="text-4xl font-bold tracking-tight text-[#2d3336] dark:text-slate-100">芝麻问答</h1>
          </div>
          <p className="mt-2 text-lg text-[#2d3336] dark:text-slate-300">打开知识的“芝麻之门”，让复杂的概念”粒粒在目“。</p>
        </header>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md dark:shadow-lg dark:shadow-slate-950/50 border dark:border-slate-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={topic}
              onFocus={handleInputFocus}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="输入一个您想了解的概念，例如“区块链”或“量子计算”"
              className="flex-grow w-full px-4 py-3 bg-white dark:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#e14b30] focus:border-[#e14b30] dark:focus:ring-offset-slate-800 dark:placeholder-slate-400 outline-none transition"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 bg-[#e14b30] text-white font-semibold rounded-lg hover:bg-[#b63c27] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e14b30] dark:focus:ring-offset-slate-800 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              disabled={isLoading}
            >
              {isLoading ? '生成中...' : '生成解析'}
            </button>
          </div>
        </form>

        <main className="mt-8">
          {isLoading && <Loader />}
          {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md dark:bg-red-900/30 dark:border-red-700 dark:text-red-300" role="alert"><p>{error}</p></div>}
          
          {explanation && (
            <>
              <ExplanationDisplay data={explanation} containerRef={explanationRef} onChipClick={handleChipClick} currentTopic={currentTopic} />
              <div className="text-center mt-8 flex flex-wrap justify-center gap-4">
                <button
                  onClick={handleDownloadHtml}
                  className="px-5 py-2.5 bg-[#e14b30] text-white font-semibold rounded-lg hover:bg-[#b63c27] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e14b30] dark:focus:ring-offset-slate-900 transition-colors"
                >
                  下载为 HTML
                </button>
                 <button
                  onClick={handleDownloadPdf}
                  className="px-5 py-2.5 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-600 dark:focus:ring-slate-600 dark:focus:ring-offset-slate-900 transition-colors"
                >
                  下载为 PDF
                </button>
                <button
                  onClick={handleDownloadImageClick}
                  className="px-5 py-2.5 bg-[#2d3336] text-white font-semibold rounded-lg hover:bg-[#4a555c] dark:bg-slate-700 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2d3336] dark:focus:ring-slate-600 dark:focus:ring-offset-slate-900 transition-colors"
                >
                  下载为图片
                </button>
              </div>
            </>
          )}

          {!isLoading && !explanation && !error && (
             <div className="text-center py-16 px-6 bg-white dark:bg-slate-800 rounded-xl border dark:border-slate-700 shadow-sm">
                <h2 className="text-2xl font-semibold text-[#2d3336] dark:text-slate-100">准备好打开新知识之门了吗？</h2>
                <p className="mt-2 text-[#2d3336] dark:text-slate-300">在上方输入您感兴趣的主题，AI 将为您生成一份结构清晰的入门指南。</p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <span className="text-sm text-slate-500 dark:text-slate-400 mr-2">或者试试这些热门词汇:</span>
                  {popularTopics.map(item => (
                    <button 
                      key={item} 
                      onClick={() => handleTopicClick(item)} 
                      className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-sm hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 transition-colors"
                      disabled={isLoading}>
                      {item}
                    </button>
                  ))}
                </div>
            </div>
          )}
        </main>
      </div>

       {isPreviewModalOpen && explanation && (
        <ImagePreviewModal
            images={slicedImages}
            isLoading={isSlicing}
            onClose={() => setIsPreviewModalOpen(false)}
            onDownloadAll={handleDownloadAllSliced}
            onDownloadSingle={handleDownloadSingleImage}
            topic={topic}
        />
      )}

      <ChipExplanationModal
        isOpen={isChipModalOpen}
        onClose={() => setIsChipModalOpen(false)}
        chipName={selectedChip}
        explanation={chipExplanation}
        isLoading={isChipLoading}
      />
    </div>
  );
};

export default App;