
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

    const content = explanationRef.current.outerHTML; // Use outerHTML to include the ExplanationDisplay's root div
    const fullHtml = `
      <!DOCTYPE html>
      <html lang="zh-CN">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${explanation.mainTitle}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            /* Ensure the body and root container take up full height */
            html, body, #root {
              height: 100%;
            }
          </style>
        </head>
        <body class="bg-[#fffdfa]">
          <div class="min-h-screen font-sans text-slate-800 p-4 sm:p-6 md:p-8">
            ${content}
          </div>
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
      backgroundColor: '#fffdfa', // updated to new primary background
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

    // Fix: Correctly check if sectionElements is empty
    if (sectionElements.length === 0) {
      setError('无法找到内容元素来生成图片。');
      setIsSlicing(false);
      return;
    }

    const imageUrls: string[] = [];
    
    // Generate one image per section
    for (let i = 0; i < sectionElements.length; i++) {
      const sliceContainer = document.createElement('div');
      
      // Container with fixed 3:4 aspect ratio
      sliceContainer.className = "bg-[#fffdfa]"; // updated to new primary background
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

      // Add header ONLY to the first image
      if (i === 0 && headerElement) {
        const clonedHeader = headerElement.cloneNode(true) as HTMLElement;
        // Adjust margin-bottom for the header in the first slice
        clonedHeader.style.marginBottom = '2rem'; 
        sliceContainer.appendChild(clonedHeader);
      } else {
        // For subsequent slices, add some top padding if no header is present,
        // to keep content visually consistent or centered.
        sliceContainer.style.paddingTop = '4rem'; 
      }

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
          backgroundColor: '#fffdfa', // updated to new primary background
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
          <div className="flex items-center justify-center"> {/* New flex container */}
            {/* Inline SVG content for the logo */}
            <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
            	 viewBox="0 0 512.001 512.001" xmlSpace="preserve" className="h-10 w-10 mr-3">
            <g>
            	<path style={{fill:'#b63c27'}} d="M273.357,385.122c0-202.505,225.648,0,225.648,0S273.357,587.626,273.357,385.122z"/>
            	<path style={{fill:'#b63c27'}} d="M12.994,385.122c0,0,225.648-202.505,225.648,0S12.994,385.122,12.994,385.122z"/>
            </g>
            <path style={{fill:'#e14b30'}} d="M255.999,41.188c0,0,202.505,225.648,0,225.648S255.999,41.188,255.999,41.188z"/>
            <path style={{fill:'#6a1e16'}} d="M255.999,275.514c-49.985,0-81.409-13.622-93.397-40.488c-13.002-29.14-2.003-71.908,32.689-127.115
            	c25.016-39.808,53.067-71.203,54.249-72.52l6.459-7.198l6.459,7.198c1.181,1.317,29.234,32.712,54.249,72.52
            	c34.692,55.207,45.691,97.975,32.689,127.115C337.409,261.892,305.986,275.514,255.999,275.514z M256.002,54.391
            	c-33.418,39.315-97.514,128.835-77.547,173.566c8.945,20.039,35.034,30.199,77.544,30.199c42.512,0,68.603-10.162,77.547-30.204
            	C353.522,183.185,289.424,93.693,256.002,54.391z"/>
            <path style={{fill:'#6a1e16'}} d="M331.875,483.807c-9.892,0-18.801-1.76-26.707-5.289c-26.866-11.988-40.488-43.411-40.488-93.396
            	s13.622-81.409,40.488-93.396c29.141-13.001,71.908-2.003,127.115,32.689c39.809,25.016,71.203,53.068,72.521,54.249l7.198,6.459
            	l-7.198,6.459c-1.318,1.181-32.712,29.234-72.521,54.249C392.056,471.109,358.432,483.807,331.875,483.807z M331.802,303.8
            	c-7.146,0-13.734,1.175-19.567,3.778c-20.039,8.945-30.2,35.034-30.2,77.543c0,42.512,10.162,68.603,30.204,77.545
            	c5.838,2.605,12.438,3.78,19.586,3.78c47.668,0.002,119.797-52.26,153.975-81.325C451.612,356.064,379.454,303.8,331.802,303.8z"/>
            <path style={{fill:'#6a1e16'}} d="M180.125,483.807c-26.558,0-60.177-12.698-100.408-37.977c-39.809-25.016-71.203-53.068-72.521-54.249L0,385.122
            	l7.198-6.459c1.318-1.181,32.712-29.234,72.521-54.249c55.207-34.694,97.978-45.692,127.115-32.689
            	c26.866,11.988,40.488,43.411,40.488,93.396s-13.622,81.409-40.488-93.396C198.927,482.046,190.013,483.807,180.125,483.807z
            	 M26.199,385.12c34.189,29.06,106.346,81.32,153.998,81.322c7.146,0,13.734-1.175,19.567-3.778
            	c20.039-8.945,30.2-35.034,30.2-77.543c0-42.512-10.162-68.603-30.204-77.545C154.989,287.601,65.5,351.697,26.199,385.12z"/>
            </svg>
            <h1 className="text-4xl font-bold tracking-tight text-[#2d3336]">芝麻问答</h1>
          </div>
          <p className="mt-2 text-lg text-[#2d3336]">将复杂的概念，拆解为清晰易懂的步骤。</p>
        </header>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md border">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="输入一个您想了解的概念，例如“区块链”或“量子计算”"
              className="flex-grow w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#e14b30] focus:border-[#e14b30] outline-none transition"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 bg-[#e14b30] text-white font-semibold rounded-lg hover:bg-[#b63c27] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e14b30] disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
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
                  className="px-5 py-2.5 bg-[#e14b30] text-white font-semibold rounded-lg hover:bg-[#b63c27] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e14b30] transition-colors"
                >
                  下载为 HTML 文件
                </button>
                <button
                  onClick={handleDownloadImageClick}
                  className="px-5 py-2.5 bg-[#2d3336] text-white font-semibold rounded-lg hover:bg-[#4a555c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2d3336] transition-colors"
                >
                  下载为图片
                </button>
              </div>
            </>
          )}

          {!isLoading && !explanation && !error && (
             <div className="text-center py-16 px-6 bg-white rounded-xl border shadow-sm">
                <h2 className="text-2xl font-semibold text-[#2d3336]">准备好深入了解一个新概念了吗？</h2>
                <p className="mt-2 text-[#2d3336]">在上方输入您感兴趣的主题，AI 将为您生成一份结构清晰的入门指南。</p>
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
