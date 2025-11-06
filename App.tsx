import React, { useState, useRef, useCallback, useEffect } from 'react';
import { generateExplanation } from './services/geminiService';
import type { ExplanationResponse } from './types';
import ExplanationDisplay from './components/ExplanationDisplay';
import Loader from './components/Loader';
import ImagePreviewModal from './components/ImagePreviewModal';

declare global {
    interface Window {
        html2canvas: any;
    }
}

const App: React.FC = () => {
  const [topic, setTopic] = useState<string>('人工智能');
  const [explanation, setExplanation] = useState<ExplanationResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const explanationRef = useRef<HTMLDivElement>(null);

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [isSlicing, setIsSlicing] = useState<boolean>(false);
  const [slicedImages, setSlicedImages] = useState<string[]>([]);


  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (!topic.trim()) {
      setError('请输入一个你想知道的东西。');
      return;
    }
    setIsLoading(true);
    setError(null);
    setExplanation(null);

    try {
      const result = await generateExplanation(topic);
      setExplanation(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '抱歉，发生未知错误，请重试。');
    } finally {
      setIsLoading(false);
    }
  }, [topic]);
  
  const handleDownloadHtml = () => {
    if (!explanationRef.current || !explanation) return;

    const content = explanationRef.current.innerHTML;
    const fullHtml = `
      <!DOCTYPE html>
      <html lang="zh-CN">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${explanation.mainTitle}</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-slate-100">
          ${content}
        </body>
      </html>
    `;
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${topic.replace(/\s+/g, '_').toLowerCase()}_explanation.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleDownloadSingleImage = () => {
    if (!explanationRef.current || !explanation) return;

    const html2canvas = window.html2canvas;
    if (typeof html2canvas !== 'function') {
      console.error('html2canvas library is not loaded.');
      setError('图片下载功能加载失败，请刷新页面重试。');
      return;
    }

    const element = explanationRef.current;
    const originalShadow = element.style.boxShadow;
    element.style.boxShadow = 'none';

    html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#f8fafc', // slate-50
    }).then(canvas => {
      const link = document.createElement('a');
      link.download = `${topic.replace(/\s+/g, '_').toLowerCase()}_explanation_full.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }).catch(err => {
      console.error('Error generating image:', err);
      setError('创建图片失败，请稍后重试。');
    }).finally(() => {
      element.style.boxShadow = originalShadow;
    });
  };

  const generateImageSlices = async () => {
    if (!explanationRef.current || !explanation) return;
    setIsSlicing(true);
    setSlicedImages([]);
    setError(null);

    const html2canvas = window.html2canvas;
    if (typeof html2canvas !== 'function') {
      setError('图片下载功能加载失败，请刷新页面重试。');
      setIsSlicing(false);
      return;
    }

    const sourceElement = explanationRef.current;
    
    // Constants for 3:4 aspect ratio (e.g., for Xiaohongshu)
    const IMAGE_BASE_WIDTH = 450;
    const IMAGE_BASE_HEIGHT = IMAGE_BASE_WIDTH * 4 / 3; // 600px
    const CANVAS_SCALE = 2; // For higher resolution output

    // We need to wait for a tick to make sure the explanationRef is fully rendered for querying
    await new Promise(resolve => setTimeout(resolve, 50));

    const headerElement = sourceElement.querySelector('.text-center');
    const sectionElements = sourceElement.querySelectorAll('.bg-white.rounded-xl.shadow-sm');

    if (!headerElement || sectionElements.length === 0) {
      setError('无法找到内容元素来生成图片。');
      setIsSlicing(false);
      return;
    }

    const imageUrls: string[] = [];
    
    // Generate one image per section
    for (let i = 0; i < sectionElements.length; i++) {
      const sliceContainer = document.createElement('div');
      
      // Container with fixed 3:4 aspect ratio
      sliceContainer.className = "bg-slate-50";
      sliceContainer.style.width = `${IMAGE_BASE_WIDTH}px`;
      sliceContainer.style.height = `${IMAGE_BASE_HEIGHT}px`;
      sliceContainer.style.position = 'absolute';
      sliceContainer.style.left = '-9999px';
      sliceContainer.style.top = '0';
      sliceContainer.style.margin = '0';
      sliceContainer.style.padding = '32px 24px';
      sliceContainer.style.boxSizing = 'border-box';
      sliceContainer.style.fontFamily = 'sans-serif';
      // Use flexbox to vertically center the content
      sliceContainer.style.display = 'flex';
      sliceContainer.style.flexDirection = 'column';
      sliceContainer.style.justifyContent = 'center';

      // Add header
      sliceContainer.appendChild(headerElement.cloneNode(true));

      // Add the single section
      const section = sectionElements[i];
      if (section) {
        sliceContainer.appendChild(section.cloneNode(true));
      }

      document.body.appendChild(sliceContainer);

      try {
        const canvas = await html2canvas(sliceContainer, {
          scale: CANVAS_SCALE,
          useCORS: true,
          backgroundColor: '#f8fafc', // slate-50
          width: IMAGE_BASE_WIDTH,
          height: IMAGE_BASE_HEIGHT,
          windowWidth: IMAGE_BASE_WIDTH,
        });
        imageUrls.push(canvas.toDataURL('image/png'));
      } catch (err) {
        console.error(`Error generating image slice for section ${i + 1}:`, err);
        setError('创建分割图片时出错。');
        document.body.removeChild(sliceContainer); // Clean up on error
        setIsSlicing(false);
        return; // Stop the process
      } finally {
        if (document.body.contains(sliceContainer)) {
          document.body.removeChild(sliceContainer);
        }
      }
    }
    
    setSlicedImages(imageUrls);
    setIsSlicing(false);
  };

  useEffect(() => {
    if (isPreviewModalOpen) {
        generateImageSlices();
    }
  }, [isPreviewModalOpen]);

  const handleDownloadImageClick = () => {
    if (!explanationRef.current || !explanation) return;
    setIsPreviewModalOpen(true);
  };

  const handleDownloadAllSliced = () => {
    if (!topic) return;
    slicedImages.forEach((dataUrl, index) => {
        const link = document.createElement('a');
        link.download = `${topic.replace(/\s+/g, '_').toLowerCase()}_part${index + 1}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
  };

  return (
    <div className="min-h-screen font-sans text-slate-800 p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">芝麻问答</h1>
          <p className="mt-2 text-lg text-slate-600">将复杂的概念，拆解为清晰易懂的步骤。</p>
        </header>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md border">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="输入一个您想了解的概念，例如“区块链”或“量子计算”"
              className="flex-grow w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              disabled={isLoading}
            >
              {isLoading ? '生成中...' : '生成解析'}
            </button>
          </div>
        </form>

        <main className="mt-8">
          {isLoading && <Loader />}
          {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert"><p>{error}</p></div>}
          
          {explanation && (
            <>
              <ExplanationDisplay data={explanation} containerRef={explanationRef} />
              <div className="text-center mt-8 flex justify-center gap-4">
                <button
                  onClick={handleDownloadHtml}
                  className="px-5 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  下载为 HTML 文件
                </button>
                <button
                  onClick={handleDownloadImageClick}
                  className="px-5 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                >
                  下载为图片
                </button>
              </div>
            </>
          )}

          {!isLoading && !explanation && !error && (
             <div className="text-center py-16 px-6 bg-white rounded-xl border shadow-sm">
                <h2 className="text-2xl font-semibold text-slate-700">准备好深入了解一个新概念了吗？</h2>
                <p className="mt-2 text-slate-500">在上方输入您感兴趣的主题，AI 将为您生成一份结构清晰的入门指南。</p>
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
    </div>
  );
};

export default App;