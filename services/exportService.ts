import type { ExplanationResponse } from '../types';

declare global {
    interface Window {
        html2canvas: any;
        JSZip: any;
        jspdf: any;
    }
}

export const downloadAsHtml = (
    explanationRef: React.RefObject<HTMLDivElement>,
    explanation: ExplanationResponse | null,
    topic: string
) => {
    if (!explanationRef.current || !explanation) return;
    const isDarkMode = document.documentElement.classList.contains('dark');
    const content = explanationRef.current.outerHTML;
    const fullHtml = `
      <!DOCTYPE html>
      <html lang="zh-CN" class="${isDarkMode ? 'dark' : ''}">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${explanation.mainTitle}</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-[#fffdfa] dark:bg-slate-900">
          <div class="min-h-screen font-sans text-slate-800 dark:text-slate-200 p-4 sm:p-6 md:p-8">
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

export const downloadAsSingleImage = (
    explanationRef: React.RefObject<HTMLDivElement>,
    topic: string
): Promise<void> => {
    if (!explanationRef.current) {
        return Promise.reject(new Error("Explanation content reference is not available."));
    }

    const html2canvas = window.html2canvas;
    if (typeof html2canvas !== 'function') {
        return Promise.reject(new Error('html2canvas library is not loaded.'));
    }

    const element = explanationRef.current;
    const originalShadow = element.style.boxShadow;
    element.style.boxShadow = 'none';
    const isDarkMode = document.documentElement.classList.contains('dark');

    return html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: isDarkMode ? '#1e293b' : '#fffdfa',
    }).then(canvas => {
      const link = document.createElement('a');
      link.download = `${topic.replace(/\s+/g, '_').toLowerCase()}_explanation_full.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }).finally(() => {
      element.style.boxShadow = originalShadow;
    });
};

export const downloadAsPdf = (
  explanationRef: React.RefObject<HTMLDivElement>,
  topic: string
): Promise<void> => {
  if (!explanationRef.current) {
    return Promise.reject(new Error("Explanation content reference is not available."));
  }

  const html2canvas = window.html2canvas;
  const jsPDF = window.jspdf?.jsPDF;

  if (typeof html2canvas !== 'function' || typeof jsPDF !== 'function') {
    return Promise.reject(new Error('Required PDF generation libraries (html2canvas, jsPDF) are not loaded.'));
  }

  const element = explanationRef.current;
  const originalShadow = element.style.boxShadow;
  element.style.boxShadow = 'none';
  const isDarkMode = document.documentElement.classList.contains('dark');
  const safeTopic = topic.replace(/\s+/g, '_').toLowerCase();

  return html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: isDarkMode ? '#1e293b' : '#fffdfa',
  }).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const ratio = canvasWidth / pdfWidth;
    const imgHeight = canvasHeight / ratio;
    
    let heightLeft = imgHeight;
    let position = 0;
    
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = -heightLeft;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;
    }
    
    pdf.save(`${safeTopic}_explanation.pdf`);
  }).finally(() => {
    element.style.boxShadow = originalShadow;
  });
};


export const createImageSlices = async (
    explanationRef: React.RefObject<HTMLDivElement>
): Promise<string[]> => {
    if (!explanationRef.current) {
        throw new Error("Explanation content reference is not available.");
    }

    const html2canvas = window.html2canvas;
    if (typeof html2canvas !== 'function') {
        throw new Error('html2canvas library is not loaded.');
    }

    const sourceElement = explanationRef.current;
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    const IMAGE_BASE_WIDTH = 450;
    const IMAGE_BASE_HEIGHT = IMAGE_BASE_WIDTH * 4 / 3;
    const CANVAS_SCALE = 2;

    await new Promise(resolve => setTimeout(resolve, 50));

    const headerElement = sourceElement.querySelector('.text-center');
    const sectionElements = sourceElement.querySelectorAll('.explanation-section-card');

    if (sectionElements.length === 0) {
        throw new Error('Cannot find content elements to generate images.');
    }

    const imageUrls: string[] = [];
    
    for (let i = 0; i < sectionElements.length; i++) {
      const sliceContainer = document.createElement('div');
      sliceContainer.className = isDarkMode ? "dark" : "";
      
      sliceContainer.style.width = `${IMAGE_BASE_WIDTH}px`;
      sliceContainer.style.height = `${IMAGE_BASE_HEIGHT}px`;
      sliceContainer.style.position = 'absolute';
      sliceContainer.style.left = '-9999px';
      sliceContainer.style.top = '0';
      sliceContainer.style.margin = '0';
      sliceContainer.style.padding = '32px 24px';
      sliceContainer.style.boxSizing = 'border-box';
      sliceContainer.style.fontFamily = 'sans-serif';
      sliceContainer.style.display = 'flex';
      sliceContainer.style.flexDirection = 'column';
      sliceContainer.style.justifyContent = 'center';
      sliceContainer.style.backgroundColor = isDarkMode ? '#1e293b' : '#fffdfa';

      if (i === 0 && headerElement) {
        const clonedHeader = headerElement.cloneNode(true) as HTMLElement;
        clonedHeader.style.marginBottom = '2rem'; 
        sliceContainer.appendChild(clonedHeader);
      } else {
        sliceContainer.style.paddingTop = '4rem'; 
      }

      const section = sectionElements[i];
      if (section) {
        sliceContainer.appendChild(section.cloneNode(true));
      }

      document.body.appendChild(sliceContainer);

      try {
        const canvas = await html2canvas(sliceContainer, {
          scale: CANVAS_SCALE,
          useCORS: true,
          backgroundColor: null,
          width: IMAGE_BASE_WIDTH,
          height: IMAGE_BASE_HEIGHT,
          windowWidth: IMAGE_BASE_WIDTH,
        });
        imageUrls.push(canvas.toDataURL('image/png'));
      } catch (err) {
         if (document.body.contains(sliceContainer)) {
          document.body.removeChild(sliceContainer);
        }
        throw err; // Re-throw the error to be caught by the caller
      } finally {
        if (document.body.contains(sliceContainer)) {
          document.body.removeChild(sliceContainer);
        }
      }
    }
    
    return imageUrls;
};


export const downloadSlicesAsZip = async (
    slicedImages: string[],
    topic: string
) => {
    if (!topic || slicedImages.length === 0) return;

    const JSZip = window.JSZip;
    if (typeof JSZip !== 'function') {
        throw new Error('JSZip library is not loaded.');
    }

    const zip = new JSZip();
    const safeTopic = topic.replace(/\s+/g, '_').toLowerCase();
    
    slicedImages.forEach((dataUrl, index) => {
        const base64Data = dataUrl.split(',')[1];
        zip.file(
          `${safeTopic}_part${index + 1}.png`,
          base64Data,
          { base64: true }
        );
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `${safeTopic}_explanation.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
};