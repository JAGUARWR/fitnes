import React from 'react';
import { Target, Activity, ShieldCheck, Dumbbell, Zap, TrendingUp } from 'lucide-react';
import { BodyAnalysisResult } from '../../utils/bodyAnalysis';

interface BodyAnalysisCardProps {
  analysis: BodyAnalysisResult;
  showRecommendation?: boolean;
}

export const BodyAnalysisCard: React.FC<BodyAnalysisCardProps> = ({
  analysis,
  showRecommendation = true,
}) => {
  return (
    <div className="space-y-3">
      {/* Somatotype & BMI */}
      <div className="bg-gradient-to-br from-[#0F172A]/90 to-[#0B1120]/90 backdrop-blur-md border border-sky-500/20 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Activity className="text-sky-400" size={18} />
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Тип телосложения
            </span>
          </div>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${analysis.bmiColor}`}>
            ИМТ {analysis.bmi} · {analysis.bmiCategory}
          </span>
        </div>

        <h3 className="text-base font-bold text-white tracking-tight">
          {analysis.somatotype}
        </h3>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          {analysis.somatotypeDescription}
        </p>
      </div>

      {/* Proportions Grid */}
      <div className="grid grid-cols-2 gap-2">
        {analysis.chestToWaistRatio && (
          <div className="bg-[#0F172A]/80 backdrop-blur-md border border-white/[0.07] p-3 rounded-2xl">
            <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center space-x-1 mb-1">
              <Zap size={12} className="text-amber-400" />
              <span>V-образный торс</span>
            </div>
            <div className="text-lg font-bold text-white font-mono">
              {analysis.chestToWaistRatio} <span className="text-xs font-normal text-slate-500">Грудь/Талия</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 truncate">
              {analysis.vTaperCategory || 'Атлетичное сложение'}
            </div>
          </div>
        )}

        {analysis.waistToHipRatio && (
          <div className="bg-[#0F172A]/80 backdrop-blur-md border border-white/[0.07] p-3 rounded-2xl">
            <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center space-x-1 mb-1">
              <Target size={12} className="text-sky-400" />
              <span>Талия к бёдрам</span>
            </div>
            <div className="text-lg font-bold text-white font-mono">
              {analysis.waistToHipRatio} <span className="text-xs font-normal text-slate-500">WHR</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 truncate">
              {analysis.whrCategory || 'Гармоничные пропорции'}
            </div>
          </div>
        )}

        <div className="bg-[#0F172A]/80 backdrop-blur-md border border-white/[0.07] p-3 rounded-2xl">
          <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center space-x-1 mb-1">
            <TrendingUp size={12} className="text-sky-400" />
            <span>Ориентир веса</span>
          </div>
          <div className="text-lg font-bold text-sky-400 font-mono">
            ~{analysis.idealWeightKg} <span className="text-xs font-normal text-slate-500">кг</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Сухая мышечная форма</div>
        </div>

        {analysis.waistToHeightRatio && (
          <div className="bg-[#0F172A]/80 backdrop-blur-md border border-white/[0.07] p-3 rounded-2xl">
            <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center space-x-1 mb-1">
              <ShieldCheck size={12} className="text-sky-400" />
              <span>Талия / Рост</span>
            </div>
            <div className="text-lg font-bold text-white font-mono">
              {analysis.waistToHeightRatio} <span className="text-xs font-normal text-slate-500">(WHtR)</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {analysis.waistToHeightRatio <= 0.5 ? 'Идеальный баланс' : 'Зона внимания'}
            </div>
          </div>
        )}
      </div>

      {/* Strengths & Focus */}
      <div className="bg-[#0F172A]/80 backdrop-blur-md border border-white/[0.07] rounded-2xl p-4 space-y-3">
        {analysis.strengths.length > 0 && (
          <div>
            <div className="text-[11px] font-bold uppercase text-sky-400 tracking-wider mb-1.5">
              Сильные стороны
            </div>
            <ul className="space-y-1">
              {analysis.strengths.map((s, idx) => (
                <li key={idx} className="text-xs text-slate-300 flex items-start space-x-1.5">
                  <span className="text-sky-500 font-bold">·</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {analysis.focusAreas.length > 0 && (
          <div>
            <div className="text-[11px] font-bold uppercase text-amber-400 tracking-wider mb-1.5 flex items-center space-x-1">
              <Dumbbell size={12} />
              <span>Зоны фокуса</span>
            </div>
            <ul className="space-y-1">
              {analysis.focusAreas.map((f, idx) => (
                <li key={idx} className="text-xs text-slate-300 flex items-start space-x-1.5">
                  <span className="text-amber-500 font-bold">·</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Recommendation */}
      {showRecommendation && (
        <div className="bg-sky-500/5 border border-sky-500/15 rounded-2xl p-3.5">
          <div className="text-[11px] font-bold uppercase text-sky-400 tracking-wider mb-1">
            Рекомендация для программы
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {analysis.recommendation}
          </p>
        </div>
      )}
    </div>
  );
};
