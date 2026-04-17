
import React, { useMemo } from 'react';
import { WeightLog, AppSettings, Milestone } from '../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingDown, Scale, Target, Activity, Flame, Trophy } from 'lucide-react';

interface DashboardProps {
  logs: WeightLog[];
  settings: AppSettings;
}

const Dashboard: React.FC<DashboardProps> = ({ logs, settings }) => {
  const currentLog = logs[0];
  const firstLog = logs[logs.length - 1];

  const stats = useMemo(() => {
    if (logs.length === 0) return null;
    const totalLost = firstLog.weight - currentLog.weight;
    const weightToTarget = currentLog.weight - settings.targetWeight;
    const bmi = currentLog.bmi || 0;

    // Milestones
    const milestones: Milestone[] = [5, 10, 15, 20, 25, 30].map(m => ({
      id: `m-${m}`,
      label: `${m}${currentLog.unit} Gone`,
      target: m,
      achieved: totalLost >= m
    }));

    return { totalLost, weightToTarget, bmi, milestones };
  }, [logs, settings, currentLog, firstLog]);

  const chartData = useMemo(() => {
    return logs.slice(0, 7).reverse().map(l => ({
      date: new Date(l.date).toLocaleDateString(undefined, { weekday: 'short' }),
      weight: l.weight
    }));
  }, [logs]);

  if (!currentLog) {
    return (
      <div className="p-8 text-center space-y-6 flex flex-col items-center justify-center h-full">
        <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center border border-white/5">
          <Scale size={40} className="text-zinc-600" />
        </div>
        <h2 className="text-2xl font-outfit font-bold">Start Your Journey</h2>
        <p className="text-zinc-500 max-w-[240px]">Record your first weight log and body photo to see the transformation.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Current Status Card */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 bg-zinc-900/50 rounded-3xl p-6 border border-white/5 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="flex justify-between items-start mb-4">
            <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Current Weight</span>
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Scale size={20} />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-5xl font-outfit font-bold">{currentLog.weight}</span>
            <span className="text-zinc-500 text-lg font-medium">{currentLog.unit}</span>
          </div>
          <div className="mt-4 flex items-center text-emerald-400 text-sm font-bold">
            <TrendingDown size={16} className="mr-1" />
            <span>{stats?.totalLost.toFixed(1)} {currentLog.unit} total lost</span>
          </div>
        </div>

        <div className="bg-zinc-900/50 rounded-3xl p-5 border border-white/5">
          <div className="flex items-center text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-2">
            <Activity size={14} className="mr-2 text-cyan-400" />
            BMI
          </div>
          <div className="text-2xl font-outfit font-bold">{stats?.bmi.toFixed(1)}</div>
          <div className="text-[10px] text-zinc-500 font-medium mt-1">Normal: 18.5 - 24.9</div>
        </div>

        <div className="bg-zinc-900/50 rounded-3xl p-5 border border-white/5">
          <div className="flex items-center text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-2">
            <Target size={14} className="mr-2 text-rose-400" />
            To Goal
          </div>
          <div className="text-2xl font-outfit font-bold">{stats?.weightToTarget.toFixed(1)}</div>
          <div className="text-[10px] text-zinc-500 font-medium mt-1">{currentLog.unit} left to go</div>
        </div>
      </div>

      {/* Progress Chart */}
      <div className="bg-zinc-900/50 rounded-3xl p-6 border border-white/5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6 flex items-center">
          <Flame size={14} className="mr-2 text-orange-400" />
          7-Day Trend
        </h3>
        <div className="h-48 w-full -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 10, fill: '#71717a'}} 
                dy={10}
              />
              <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
              <Tooltip 
                contentStyle={{backgroundColor: '#18181b', border: 'none', borderRadius: '12px', fontSize: '12px'}}
                itemStyle={{color: '#10b981'}}
              />
              <Area 
                type="monotone" 
                dataKey="weight" 
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorWeight)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Milestones */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center">
          <Trophy size={14} className="mr-2 text-yellow-400" />
          Milestones
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {stats?.milestones.map((m) => (
            <div 
              key={m.id}
              className={`p-4 rounded-2xl border transition-all ${
                m.achieved 
                  ? 'bg-emerald-500/10 border-emerald-500/20' 
                  : 'bg-zinc-900/30 border-white/5'
              }`}
            >
              <div className={`text-[10px] font-bold uppercase tracking-tight mb-1 ${m.achieved ? 'text-emerald-400' : 'text-zinc-600'}`}>
                {m.label}
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm font-outfit font-bold ${m.achieved ? 'text-white' : 'text-zinc-500'}`}>
                  {m.achieved ? 'Unlocked' : `Locked`}
                </span>
                {m.achieved && <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/40" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
