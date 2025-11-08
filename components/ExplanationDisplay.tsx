import React from 'react';
import type { ExplanationResponse, Section, SectionContent, BulletPoint, PowerCard, NumberedStep, ToolChip, Example } from '../types';
import { IconKey } from '../types';
import InfoIcon from './icons/InfoIcon';
import CapacityIcon from './icons/CapacityIcon';
import ProcessIcon from './icons/ProcessIcon';
import TypesIcon from './icons/TypesIcon';
import LearnIcon from './icons/LearnIcon';
import ToolsIcon from './icons/ToolsIcon';
import LifeIcon from './icons/LifeIcon';

const iconMap: Record<IconKey, React.ComponentType<{ className?: string }>> = {
  [IconKey.INFO]: InfoIcon,
  [IconKey.CAPACITY]: CapacityIcon,
  [IconKey.PROCESS]: ProcessIcon,
  [IconKey.TYPES]: TypesIcon,
  [IconKey.LEARN]: LearnIcon,
  [IconKey.TOOLS]: ToolsIcon,
  [IconKey.LIFE]: LifeIcon,
};

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


const BulletListComponent: React.FC<{ items: BulletPoint[] }> = ({ items }) => (
  <ul className="space-y-3">
    {items.map((item, index) => (
      <li key={index} className="flex items-start">
        <svg className="w-5 h-5 text-[#e14b30] mr-3 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span className="text-[#2d3336] dark:text-slate-300"><SimpleMarkdown text={item.text} /></span>
      </li>
    ))}
  </ul>
);

const PowerCardsComponent: React.FC<{ items: PowerCard[], example?: Example }> = ({ items, example }) => (
  <div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {items.map((card, index) => (
        <div key={index} className="bg-[#fffdfa] dark:bg-slate-700/50 rounded-lg p-4 text-center border dark:border-slate-600">
          <div className="text-3xl mb-2">{card.icon}</div>
          <h4 className="font-bold text-[#2d3336] dark:text-slate-100"><SimpleMarkdown text={card.title} /></h4>
          <p className="text-sm text-[#2d3336] dark:text-slate-300 mt-1"><SimpleMarkdown text={card.description} /></p>
        </div>
      ))}
    </div>
    {example && (
      <div className="mt-6 bg-[#fef3f2] dark:bg-red-900/20 border-l-4 border-[#e14b30] dark:border-red-500/50 p-4 rounded-r-lg">
        <p className="font-semibold text-[#b63c27] dark:text-red-300">例如：</p>
        <p className="text-[#b63c27] dark:text-red-300 mt-1">你说：“{example.trigger}”</p>
        <p className="text-[#b63c27] dark:text-red-300 mt-2">AI 会自动完成这一切：<SimpleMarkdown text={example.result} /></p>
      </div>
    )}
  </div>
);

const NumberedStepsComponent: React.FC<{ items: NumberedStep[] }> = ({ items }) => (
  <div className="space-y-4">
    {items.map((item, index) => (
      <div key={index} className="flex items-start">
        <div className="flex-shrink-0 w-8 h-8 bg-[#fef3f2] dark:bg-red-900/30 text-[#e14b30] dark:text-red-300 font-bold rounded-full flex items-center justify-center mr-4">{index + 1}</div>
        <div>
          <h4 className="font-semibold text-[#2d3336] dark:text-slate-100"><SimpleMarkdown text={item.title} /></h4>
          <p className="text-[#2d3336] dark:text-slate-300"><SimpleMarkdown text={item.description} /></p>
        </div>
      </div>
    ))}
  </div>
);

const ToolChipsComponent: React.FC<{ items: ToolChip[], summary: string, onChipClick: (chipName: string) => void }> = ({ items, summary, onChipClick }) => (
  <div>
    <div className="flex flex-wrap gap-3 mb-4">
      {items.map((item, index) => (
        <button
          key={index}
          onClick={() => onChipClick(item.name)}
          className="bg-[#fffdfa] dark:bg-slate-700/50 border border-slate-200/80 dark:border-slate-600 rounded-full px-4 py-1.5 text-sm text-[#2d3336] dark:text-slate-300 flex items-center gap-2 hover:border-[#e14b30] dark:hover:border-red-500 hover:text-[#e14b30] dark:hover:text-red-300 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#e14b30] dark:focus:ring-offset-slate-800"
          aria-label={`解释 ${item.name}`}
        >
          <span>{item.icon}</span>
          <span><SimpleMarkdown text={item.name} /></span>
        </button>
      ))}
    </div>
    <div className="bg-[#fef3f2] dark:bg-red-900/20 border-l-4 border-[#e14b30] dark:border-red-500/50 p-4 rounded-r-lg text-[#b63c27] dark:text-red-300">
      <SimpleMarkdown text={summary} />
    </div>
  </div>
);


const FinalListComponent: React.FC<{ items: string[] }> = ({ items }) => (
    <ul className="space-y-3">
        {items.map((item, index) => (
            <li key={index} className="flex items-start">
                <svg className="w-5 h-5 text-[#e14b30] mr-3 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-[#2d3336] dark:text-slate-300"><SimpleMarkdown text={item} /></span>
            </li>
        ))}
    </ul>
);

const SectionContentComponent: React.FC<{ content: SectionContent, onChipClick: (chipName: string) => void }> = ({ content, onChipClick }) => {
  if (content.bullets) return <BulletListComponent items={content.bullets} />;
  if (content.power_cards) return <PowerCardsComponent items={content.power_cards} example={content.example} />;
  if (content.numbered_steps) return <NumberedStepsComponent items={content.numbered_steps} />;
  if (content.tool_chips && content.summary) return <ToolChipsComponent items={content.tool_chips} summary={content.summary} onChipClick={onChipClick} />;
  if (content.final_list) return <FinalListComponent items={content.final_list} />;
  return null;
};

const stepNames: { [key: number]: string } = {
  1: '初识',
  2: '妙用',
  3: '揭秘',
  4: '分身',
  5: '修炼',
  6: '利器',
  7: '身边',
};

const SectionCard: React.FC<{ section: Section, onChipClick: (chipName: string) => void }> = ({ section, onChipClick }) => {
  const IconComponent = iconMap[section.iconKey] || InfoIcon;
  const iconColorClass = 'text-[#e14b30]';
  const stepName = stepNames[section.step] || `步骤 ${section.step}`;

  return (
    <div className="explanation-section-card bg-white dark:bg-slate-800 rounded-xl shadow-sm dark:shadow-md dark:shadow-slate-950/50 p-6 mb-6 border border-slate-200/80 dark:border-slate-700">
      <div className="flex items-center mb-4">
        <IconComponent className={`w-7 h-7 mr-3 ${iconColorClass}`} />
        <h3 className="text-xl font-bold text-[#2d3336] dark:text-slate-100">
            <span className="text-[#e14b30]">{stepName}</span>
            <span className="font-normal text-[#4a555c] dark:text-slate-500 mx-2">|</span>
            <span><SimpleMarkdown text={section.title} /></span>
        </h3>
      </div>
      {section.description && <p className="text-[#2d3336] dark:text-slate-300 mb-5"><SimpleMarkdown text={section.description} /></p>}
      <SectionContentComponent content={section.content} onChipClick={onChipClick} />
    </div>
  );
};

interface ExplanationDisplayProps {
  data: ExplanationResponse;
  containerRef: React.Ref<HTMLDivElement>;
  onChipClick: (chipName: string) => void;
  currentTopic: string;
}

const ExplanationDisplay: React.FC<ExplanationDisplayProps> = ({ data, containerRef, onChipClick, currentTopic }) => {
  const titleFromApi = data.mainTitle || '';
  // Use regex to find the first colon (either full-width or half-width)
  const separatorMatch = titleFromApi.match(/[:：]/);
  
  const displayTitle = currentTopic;
  let displaySubtitle = data.subtitle;

  if (separatorMatch) {
    const separatorIndex = separatorMatch.index;
    const potentialSubtitle = typeof separatorIndex === 'number' ? titleFromApi.substring(separatorIndex + 1).trim() : '';
    if (potentialSubtitle) {
        displaySubtitle = potentialSubtitle;
    }
  }

  return (
    <div ref={containerRef} className="max-w-4xl mx-auto my-8 p-4 md:p-8 bg-[#fffdfa] dark:bg-slate-800/50 rounded-2xl shadow-lg dark:shadow-xl dark:shadow-slate-950/50">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#e14b30] tracking-tight">
          <span>一图看懂：</span>
          <SimpleMarkdown text={displayTitle} />
        </h1>
        <p className="mt-2 text-lg text-[#2d3336] dark:text-slate-300">
          {data.topicEmoji && <span className="mr-2">{data.topicEmoji}</span>}
          <SimpleMarkdown text={displaySubtitle} />
        </p>
      </div>
      {data.sections.map(section => (
        <SectionCard key={section.step} section={section} onChipClick={onChipClick} />
      ))}
    </div>
  );
};

export default ExplanationDisplay;