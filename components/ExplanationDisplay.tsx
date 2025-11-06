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
          // Use a plain <strong> tag to inherit parent styles correctly.
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
        <svg className="w-5 h-5 text-blue-500 mr-3 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span className="text-slate-700"><SimpleMarkdown text={item.text} /></span>
      </li>
    ))}
  </ul>
);

const PowerCardsComponent: React.FC<{ items: PowerCard[], example?: Example }> = ({ items, example }) => (
  <div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {items.map((card, index) => (
        <div key={index} className="bg-slate-50 rounded-lg p-4 text-center border">
          <div className="text-3xl mb-2">{card.icon}</div>
          <h4 className="font-bold text-slate-800"><SimpleMarkdown text={card.title} /></h4>
          <p className="text-sm text-slate-600 mt-1"><SimpleMarkdown text={card.description} /></p>
        </div>
      ))}
    </div>
    {example && (
      <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
        <p className="font-semibold text-blue-800">例如：</p>
        <p className="text-blue-700 mt-1">你说：“{example.trigger}”</p>
        <p className="text-blue-700 mt-2">AI 会自动完成这一切：<SimpleMarkdown text={example.result} /></p>
      </div>
    )}
  </div>
);

const NumberedStepsComponent: React.FC<{ items: NumberedStep[] }> = ({ items }) => (
  <div className="space-y-4">
    {items.map((item, index) => (
      <div key={index} className="flex items-start">
        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 font-bold rounded-full flex items-center justify-center mr-4">{index + 1}</div>
        <div>
          <h4 className="font-semibold text-slate-800"><SimpleMarkdown text={item.title} /></h4>
          <p className="text-slate-600"><SimpleMarkdown text={item.description} /></p>
        </div>
      </div>
    ))}
  </div>
);

const ToolChipsComponent: React.FC<{ items: ToolChip[], summary: string }> = ({ items, summary }) => (
  <div>
    <div className="flex flex-wrap gap-3 mb-4">
      {items.map((item, index) => (
        <div key={index} className="bg-slate-100 border border-slate-200 rounded-full px-4 py-1.5 text-sm text-slate-700 flex items-center gap-2">
          <span>{item.icon}</span>
          <span><SimpleMarkdown text={item.name} /></span>
        </div>
      ))}
    </div>
    <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded-r-lg text-purple-800">
      <SimpleMarkdown text={summary} />
    </div>
  </div>
);

const FinalListComponent: React.FC<{ items: string[] }> = ({ items }) => (
  <ul className="list-disc list-inside space-y-2 text-slate-700">
    {items.map((item, index) => <li key={index}><SimpleMarkdown text={item} /></li>)}
  </ul>
);

const SectionContentComponent: React.FC<{ content: SectionContent }> = ({ content }) => {
  if (content.bullets) return <BulletListComponent items={content.bullets} />;
  if (content.power_cards) return <PowerCardsComponent items={content.power_cards} example={content.example} />;
  if (content.numbered_steps) return <NumberedStepsComponent items={content.numbered_steps} />;
  if (content.tool_chips && content.summary) return <ToolChipsComponent items={content.tool_chips} summary={content.summary} />;
  if (content.final_list) return <FinalListComponent items={content.final_list} />;
  return null;
};

const stepNames: { [key: number]: string } = {
  1: '初识',
  2: '神通',
  3: '揭秘',
  4: '分身',
  5: '修炼',
  6: '利器',
  7: '身边',
};

const SectionCard: React.FC<{ section: Section }> = ({ section }) => {
  const IconComponent = iconMap[section.iconKey] || InfoIcon;
  const colorClasses = [
    'text-blue-500', 'text-purple-500', 'text-green-500', 'text-yellow-500', 'text-red-500', 'text-indigo-500', 'text-pink-500'
  ][(section.step - 1) % 7];

  const stepName = stepNames[section.step] || `步骤 ${section.step}`;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-slate-200/80">
      <div className="flex items-center mb-4">
        <IconComponent className={`w-7 h-7 mr-3 ${colorClasses}`} />
        <h3 className="text-xl font-bold text-slate-800">
            <span className="text-blue-600">{stepName}</span>
            <span className="font-normal text-slate-300 mx-2">|</span>
            <span><SimpleMarkdown text={section.title} /></span>
        </h3>
      </div>
      {section.description && <p className="text-slate-600 mb-5"><SimpleMarkdown text={section.description} /></p>}
      <SectionContentComponent content={section.content} />
    </div>
  );
};

const ExplanationDisplay: React.FC<{ data: ExplanationResponse, containerRef: React.Ref<HTMLDivElement> }> = ({ data, containerRef }) => {
  return (
    <div ref={containerRef} className="max-w-4xl mx-auto my-8 p-4 md:p-8 bg-slate-50 rounded-2xl shadow-lg">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight"><SimpleMarkdown text={data.mainTitle} /></h1>
        <p className="mt-2 text-slate-500"><SimpleMarkdown text={data.subtitle} /></p>
      </div>
      {data.sections.map(section => (
        <SectionCard key={section.step} section={section} />
      ))}
    </div>
  );
};

export default ExplanationDisplay;