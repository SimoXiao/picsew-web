import React, { useState, useRef } from 'react';
import { Upload, ArrowUp, ArrowDown, Image as ImageIcon, Download, Trash2, LayoutTemplate } from 'lucide-react';

export default function App() {
  const [images, setImages] = useState([]);
  const [direction, setDirection] = useState('vertical'); // vertical or horizontal
  const [resultImage, setResultImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [quality] = useState(0.9);
  const fileInputRef = useRef(null);

  // 处理图片选择
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newImages = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file)
    }));

    setImages(prev => [...prev, ...newImages]);
    setResultImage(null);
  };

  // 移除图片
  const removeImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id));
    setResultImage(null);
  };

  // 上移图片
  const moveUp = (index) => {
    if (index === 0) return;
    const newImages = [...images];
    [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    setImages(newImages);
    setResultImage(null);
  };

  // 下移图片
  const moveDown = (index) => {
    if (index === images.length - 1) return;
    const newImages = [...images];
    [newImages[index + 1], newImages[index]] = [newImages[index], newImages[index + 1]];
    setImages(newImages);
    setResultImage(null);
  };

  // 清空所有
  const clearAll = () => {
    setImages([]);
    setResultImage(null);
  };

  // 核心拼接逻辑
  const stitchImages = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);

    try {
      const imageElements = await Promise.all(
        images.map(img => {
          return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = img.preview;
          });
        })
      );

      let canvasWidth = 0;
      let canvasHeight = 0;

      if (direction === 'vertical') {
        const baseWidth = imageElements[0].width;
        canvasWidth = baseWidth;
        canvasHeight = imageElements.reduce((total, img) => {
          const scale = baseWidth / img.width;
          return total + (img.height * scale);
        }, 0);
      } else {
        const baseHeight = imageElements[0].height;
        canvasHeight = baseHeight;
        canvasWidth = imageElements.reduce((total, img) => {
          const scale = baseHeight / img.height;
          return total + (img.width * scale);
        }, 0);
      }

      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      let currentX = 0;
      let currentY = 0;

      if (direction === 'vertical') {
        const baseWidth = imageElements[0].width;
        imageElements.forEach(img => {
          const scale = baseWidth / img.width;
          const drawHeight = img.height * scale;
          ctx.drawImage(img, 0, currentY, baseWidth, drawHeight);
          currentY += drawHeight;
        });
      } else {
        const baseHeight = imageElements[0].height;
        imageElements.forEach(img => {
          const scale = baseHeight / img.height;
          const drawWidth = img.width * scale;
          ctx.drawImage(img, currentX, 0, drawWidth, baseHeight);
          currentX += drawWidth;
        });
      }

      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      setResultImage(dataUrl);

    } catch (error) {
      console.error("拼接失败:", error);
      alert("图片处理出错，请重试");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 pb-20 font-sans">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3 flex justify-between items-center shadow-sm">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <LayoutTemplate className="w-5 h-5 text-blue-500" />
          简易拼图
        </h1>
        <button 
          onClick={clearAll}
          className="text-sm text-red-500 font-medium disabled:opacity-50"
          disabled={images.length === 0}
        >
          清空
        </button>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex gap-2 mb-4">
             <button
              onClick={() => { setDirection('vertical'); setResultImage(null); }}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                direction === 'vertical' ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              竖向长图
            </button>
            <button
              onClick={() => { setDirection('horizontal'); setResultImage(null); }}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                direction === 'horizontal' ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              横向拼接
            </button>
          </div>
          
          <input type="file" accept="image/*" multiple ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
          <button 
            onClick={() => fileInputRef.current.click()}
            className="w-full py-3 border-2 border-dashed border-blue-200 rounded-xl flex items-center justify-center gap-2 text-blue-500 hover:bg-blue-50 transition-colors font-medium"
          >
            <Upload className="w-5 h-5" />
            添加图片
          </button>
        </div>

        {images.length > 0 && !resultImage && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-500 pl-1">已选图片 ({images.length})</h2>
            <div className="space-y-2">
              {images.map((img, index) => (
                <div key={img.id} className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                  <div className="relative w-16 h-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    <img src={img.preview} alt="preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex justify-end gap-1">
                    <button onClick={() => moveUp(index)} disabled={index === 0} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full disabled:opacity-20"><ArrowUp className="w-5 h-5" /></button>
                    <button onClick={() => moveDown(index)} disabled={index === images.length - 1} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full disabled:opacity-20"><ArrowDown className="w-5 h-5" /></button>
                    <button onClick={() => removeImage(img.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full ml-2"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {resultImage && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 text-xs text-gray-500 flex justify-between items-center">
                <span>预览结果</span>
                <span className="text-blue-600 font-medium">长按图片保存</span>
              </div>
              <div className="p-4 flex justify-center bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEwIDBoMTB2MTBIMTBWMHkwIDEwaDEwdjEwSDBWMTB6IiBmaWxsPSIjZjBmMGYwIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L3N2Zz4=')]">
                <img src={resultImage} alt="Result" className="max-w-full h-auto shadow-sm rounded-sm" style={{ maxHeight: '60vh' }} />
              </div>
            </div>
            <button onClick={() => setResultImage(null)} className="w-full py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium shadow-sm">重新调整</button>
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-8 safe-area-pb">
          <div className="max-w-md mx-auto flex gap-4">
             {!resultImage ? (
                <button
                onClick={stitchImages}
                disabled={images.length < 1 || isProcessing}
                className={`flex-1 py-3.5 rounded-xl font-bold text-lg text-white shadow-lg flex items-center justify-center gap-2 ${images.length < 1 ? 'bg-gray-300' : 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-blue-200'}`}
              >
                {isProcessing ? '处理中...' : '开始拼接'}
                {!isProcessing && <ImageIcon className="w-5 h-5" />}
              </button>
             ) : (
                <button
                  onClick={() => { const link = document.createElement('a'); link.download = `stitch_${new Date().getTime()}.jpg`; link.href = resultImage; document.body.appendChild(link); link.click(); document.body.removeChild(link); }}
                  className="flex-1 py-3.5 bg-green-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-green-200 flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  保存图片
                </button>
             )}
          </div>
        </div>
      </div>
      <style>{`.safe-area-pb { padding-bottom: env(safe-area-inset-bottom, 20px); }`}</style>
    </div>
  );
}
