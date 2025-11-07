import React, { useState, useEffect } from 'react';

const messages = [
  "请稍候，AI 大脑高速运转中...",
  "正在为您绘制知识的蓝图...",
  "马上就好，正在简化复杂概念...",
  "AI 正在连接知识的星辰...",
  "知识的魔法正在酝酿...",
];

const Loader: React.FC = () => {
  const [message, setMessage] = useState(messages[0]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setMessage(prevMessage => {
        const currentIndex = messages.indexOf(prevMessage);
        const nextIndex = (currentIndex + 1) % messages.length;
        return messages[nextIndex];
      });
    }, 2500); // Change message every 2.5 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-10 bg-white/50 dark:bg-slate-800/50 rounded-lg">
      <div className="w-12 h-12 border-4 border-blue-500 dark:border-blue-400 border-dashed rounded-full animate-spin"></div>
      <p className="mt-4 text-slate-600 dark:text-slate-400 text-center">{message}</p>
    </div>
  );
};

export default Loader;
