import React, { useState, useEffect } from 'react';
import { Day, WorkoutSession, ProgressData } from './types';
import { WORKOUT_PLAN, BASELINE_PROGRAM } from './constants';

const App: React.FC = () => {
  // --- States ---
  const [currentWeek, setCurrentWeek] = useState<number>(() => parseInt(localStorage.getItem('currentWeek') || '1'));
  const [activeTab, setActiveTab] = useState<Day>('lundi');
  const [autoSaveVisible, setAutoSaveVisible] = useState<boolean>(false);
  
  // UX Features
  const [wakeLock, setWakeLock] = useState<any>(null);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [showPlateCalc, setShowPlateCalc] = useState<boolean>(false);
  const [calcWeight, setCalcWeight] = useState<number>(0);
  const [showAlternatives, setShowAlternatives] = useState<Record<string, boolean>>({});

  // Timer
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [targetTime, setTargetTime] = useState<number | null>(null);

  // Data
  const [workoutData, setWorkoutData] = useState<Record<string, string>>({});
  const [previousWeekData, setPreviousWeekData] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<string>('');
  const [mcGillDone, setMcGillDone] = useState<boolean>(false);
  const [progress, setProgress] = useState<ProgressData>(() => {
    try {
        return JSON.parse(localStorage.getItem('currentProgress') || '{"poids":"","taille":"","incline":"","rdl":"","photos":{}}');
    } catch {
        return {poids:"", taille:"", incline:"", rdl:"", photos:{}};
    }
  });

  // 1. WakeLock
  useEffect(() => {
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && ['lundi', 'mercredi', 'vendredi'].includes(activeTab)) {
        try {
          const lock = await (navigator as any).wakeLock.request('screen');
          setWakeLock(lock);
        } catch (err) { console.log("WakeLock error", err); }
      }
    };
    requestWakeLock();
    return () => { wakeLock?.release?.(); };
  }, [activeTab]);

  // 2. Timer Logic
  useEffect(() => {
    if (targetTime === null) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((targetTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        setTargetTime(null);
        setTimeLeft(0);
        try {
            if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 500]);
            new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play().catch(() => {});
        } catch (e) {}
      }
    }, 500);
    return () => clearInterval(interval);
  }, [targetTime]);

  // 3. Load Data
  useEffect(() => {
    if (['lundi', 'mercredi', 'vendredi'].includes(activeTab)) {
      const key = `workout-${activeTab}-w${currentWeek}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
            const p = JSON.parse(saved);
            setWorkoutData(p.exercises || {});
            setNotes(p.notes || '');
            setMcGillDone(p.mcGillDone || false);
        } catch {
            setWorkoutData({});
        }
      } else {
        setWorkoutData({});
        setNotes('');
        setMcGillDone(false);
      }
      
      if (currentWeek > 1) {
        const prev = localStorage.getItem(`workout-${activeTab}-w${currentWeek - 1}`);
        try {
            setPreviousWeekData(prev ? JSON.parse(prev).exercises : {});
        } catch {
            setPreviousWeekData({});
        }
      } else {
        setPreviousWeekData({});
      }
      localStorage.setItem('currentWeek', currentWeek.toString());
    }
  }, [activeTab, currentWeek]);

  const startTimer = (seconds: number) => {
    setTargetTime(Date.now() + seconds * 1000); 
    setTimeLeft(seconds);
  };

  const saveSession = (newData: Record<string, string>, newNotes: string, newMcGill: boolean) => {
      const session: WorkoutSession = {
        date: new Date().toISOString().split('T')[0],
        week: currentWeek,
        day: activeTab,
        exercises: newData,
        notes: newNotes,
        mcGillDone: newMcGill
      };
      localStorage.setItem(`workout-${activeTab}-w${currentWeek}`, JSON.stringify(session));
      setAutoSaveVisible(true);
      setTimeout(() => setAutoSaveVisible(false), 2000);
  };

  const getVal = (key: string) => {
    const raw = workoutData[key];
    if (!raw || typeof raw !== 'string') return { w: '', r: '' };
    const parts = raw.split('|');
    return { w: parts[0] || '', r: parts[1] || '' };
  };

  const updateVal = (key: string, field: 'w' | 'r', val: string) => {
    const current = getVal(key);
    const newVal = field === 'w' ? `${val}|${current.r}` : `${current.w}|${val}`;
    const newData = { ...workoutData, [key]: newVal };
    setWorkoutData(newData);
    saveSession(newData, notes, mcGillDone);
  };

  const toggleMcGill = () => {
      const newVal = !mcGillDone;
      setMcGillDone(newVal);
      saveSession(workoutData, notes, newVal);
  };

  const getVolume = () => {
    let vol = 0;
    Object.values(workoutData).forEach(v => {
        if (typeof v === 'string') {
            const [w, r] = v.split('|');
            if (w && r) vol += (parseFloat(w) * parseFloat(r));
        }
    });
    return vol;
  };

  const getRepStyle = (exId: string, setIdx: number, currentReps: string) => {
      if (!currentReps) return 'bg-neutral-800 text-gray-500';
      const prevKey = `${exId}-s${setIdx+1}`;
      const prevRaw = previousWeekData[prevKey];
      const prevReps = (prevRaw && typeof prevRaw === 'string') ? parseInt(prevRaw.split('|')[1]) : (currentWeek === 1 ? BASELINE_PROGRAM[exId]?.reps : 0);
      const curr = parseInt(currentReps);
      if (curr > (prevReps || 0)) return 'bg-green-900 border-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]';
      if (curr === prevReps) return 'bg-yellow-900 border-yellow-500 text-white';
      return 'bg-red-900 border-red-500 text-white';
  };

  return (
    <div className="min-h-screen pb-24 bg-black text-gray-200 font-sans">
      <div className={`fixed top-4 right-4 z-50 transition-opacity duration-300 ${autoSaveVisible ? 'opacity-100' : 'opacity-0'}`}>
         <span className="bg-green-900 text-green-300 text-xs font-bold px-3 py-1 rounded-full border border-green-700">💾 Sauvegardé</span>
      </div>

      {showPlateCalc && (
          <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4" onClick={() => setShowPlateCalc(false)}>
              <div className="bg-neutral-900 border border-gray-700 p-6 rounded-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                  <h3 className="text-white font-bold text-center mb-6">🧮 CHARGEMENT (Barre 20kg)</h3>
                  <div className="text-center text-4xl font-bold text-white mb-6">{calcWeight} kg</div>
                  <div className="bg-gray-800 p-4 rounded-xl mb-6 text-center">
                      <div className="text-indigo-400 font-bold mb-2">PAR CÔTÉ : {Math.max(0, (calcWeight - 20) / 2)} KG</div>
                      <div className="flex flex-wrap justify-center gap-2">
                          {[20, 10, 5, 2.5, 1.25].map(p => {
                              const rem = Math.max(0, (calcWeight - 20) / 2);
                              const n = Math.floor(rem / p);
                              return n > 0 ? <span key={p} className="bg-black border border-gray-600 px-2 py-1 rounded text-xs text-white">{p}kg (x{n})</span> : null;
                          })}
                      </div>
                  </div>
                  <button onClick={() => setShowPlateCalc(false)} className="w-full bg-indigo-600 py-3 rounded-lg font-bold text-white">Fermer</button>
              </div>
          </div>
      )}

      {activeVideo && (
          <div className="fixed inset-0 bg-black/95 z-[70] flex flex-col justify-center p-4" onClick={() => setActiveVideo(null)}>
              <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800">
                  <iframe width="100%" height="100%" src={`https://www.youtube-nocookie.com/embed/${activeVideo}?autoplay=1&rel=0`} title="Demo" allow="autoplay; encrypted-media" allowFullScreen />
              </div>
              <button className="mt-8 bg-white text-black py-3 rounded-full font-bold" onClick={() => setActiveVideo(null)}>Fermer</button>
          </div>
      )}

      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-gray-800 px-4 py-3 flex justify-between items-center h-16">
         <div className="flex items-center gap-3">
             <div className={`text-2xl font-mono font-bold ${timeLeft > 0 ? 'text-white animate-pulse' : 'text-gray-600'}`}>
                 {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
             </div>
             {timeLeft > 0 && <button onClick={() => setTargetTime(null)} className="bg-red-900/50 text-red-400 px-2 py-1 rounded text-xs font-bold">STOP</button>}
         </div>
         <div className="flex gap-2">
             {[60, 90, 120, 180].map(s => (
                 <button key={s} onClick={() => startTimer(s)} className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg text-xs font-bold transition">
                     {s}
                 </button>
             ))}
         </div>
      </div>

      <div className="p-4 max-w-lg mx-auto">
        <div className="flex justify-between items-end mb-8">
            <div>
                <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase">MASSE <span className="text-indigo-600">BUILDER</span></h1>
                <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Semaine {currentWeek} • Pro Edition</p>
            </div>
            <div className="flex gap-1 bg-gray-900 p-1 rounded-lg">
                <button onClick={() => currentWeek > 1 && setCurrentWeek(c => c-1)} className="px-3 py-1 text-gray-400">◀</button>
                <button onClick={() => setCurrentWeek(c => c+1)} className="px-3 py-1 text-gray-400">▶</button>
            </div>
        </div>

        {['lundi', 'mercredi', 'vendredi'].includes(activeTab) ? (
            <div className="space-y-8">
                <div onClick={toggleMcGill} className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${mcGillDone ? 'bg-green-900/20 border-green-600' : 'bg-red-900/10 border-red-800'}`}>
                    <div className="flex justify-between items-center">
                        <span className={`font-bold text-sm uppercase ${mcGillDone ? 'text-green-400' : 'text-red-400'}`}>
                            {mcGillDone ? '✅ Activation Validée' : '⚠️ McGill Big 3 Requis'}
                        </span>
                        {!mcGillDone && <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded animate-pulse">START</span>}
                    </div>
                </div>

                <div className={`${!mcGillDone ? 'opacity-30 pointer-events-none' : ''}`}>
                    {WORKOUT_PLAN[activeTab]?.map(ex => {
                        const isAlt = showAlternatives[ex.id];
                        return (
                            <div key={ex.id} className={`mb-8 pl-4 border-l-2 ${ex.isRappel ? 'border-orange-500' : 'border-indigo-600'}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-lg text-white leading-none">{isAlt ? ex.alternative : ex.title}</h3>
                                            {ex.videoId && <button onClick={() => setActiveVideo(ex.videoId!)} className="text-indigo-400">📺</button>}
                                        </div>
                                    </div>
                                    {ex.alternative && (
                                        <button onClick={() => setShowAlternatives(p => ({...p, [ex.id]: !p[ex.id]}))} className="text-[10px] text-gray-500 underline uppercase">Alt</button>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    {Array.from({length: ex.sets}).map((_, i) => {
                                        const key = `${ex.id}-s${i+1}`;
                                        const {w, r} = getVal(key);
                                        const prevRaw = previousWeekData[key];
                                        const prevData = (prevRaw && typeof prevRaw === 'string') ? prevRaw.split('|') : null;
                                        const targetW = prevData ? prevData[0] : (BASELINE_PROGRAM[ex.id]?.weight?.toString() || '-');
                                        const targetR = prevData ? prevData[1] : (BASELINE_PROGRAM[ex.id]?.reps.toString() || '0');
                                        
                                        return (
                                            <div key={i} className="flex gap-2 h-12">
                                                <div className="flex-[2] relative">
                                                    <input type="number" value={w} onChange={e => updateVal(key, 'w', e.target.value)} placeholder={targetW} className="w-full h-full bg-neutral-900 border border-neutral-800 rounded-lg text-center font-bold text-white text-lg focus:outline-none" />
                                                    <span className="absolute top-1 left-2 text-[8px] text-gray-600 font-bold uppercase">KG</span>
                                                    {w && <button onClick={() => {setCalcWeight(parseFloat(w)); setShowPlateCalc(true)}} className="absolute bottom-1 right-2 text-[10px] opacity-30">🧮</button>}
                                                </div>
                                                <div className={`flex-[3] flex items-center rounded-lg border border-neutral-800 overflow-hidden ${getRepStyle(ex.id, i, r)}`}>
                                                    <button className="h-full px-3 bg-black/20 font-bold text-lg" onClick={() => updateVal(key, 'r', Math.max(0, (parseInt(r)||0) - 1).toString())}>−</button>
                                                    <input type="number" value={r} onChange={e => updateVal(key, 'r', e.target.value)} placeholder={targetR} className="w-full h-full bg-transparent text-center font-bold text-xl focus:outline-none" />
                                                    <button className="h-full px-3 bg-black/20 font-bold text-lg" onClick={() => updateVal(key, 'r', ((parseInt(r)||0) + 1).toString())}>+</button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                    <div className="mt-12 p-6 bg-indigo-900/10 rounded-2xl border border-indigo-500/20 text-center">
                        <p className="text-gray-500 text-[10px] uppercase font-bold mb-1">Volume Total Séance</p>
                        <p className="text-4xl font-black text-white">{getVolume().toLocaleString()} KG</p>
                    </div>
                </div>
            </div>
        ) : activeTab === 'progression' ? (
            <div className="space-y-6">
                <div className="bg-neutral-900 p-6 rounded-2xl border border-gray-800">
                    <h3 className="text-gray-500 font-bold uppercase text-[10px] mb-4 tracking-widest text-center">Profil Physique</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {(['poids', 'taille'] as const).map(k => (
                            <div key={k}>
                                <label className="block text-[10px] text-gray-600 uppercase mb-1 font-bold">{k}</label>
                                <input type="number" value={progress[k as keyof ProgressData] as string} onChange={e => {
                                    const n = {...progress, [k]: e.target.value};
                                    setProgress(n);
                                    localStorage.setItem('currentProgress', JSON.stringify(n));
                                }} className="w-full bg-black border border-gray-700 rounded-lg p-4 text-white font-bold" />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => {
                        const b = new Blob([JSON.stringify(localStorage)], {type:'application/json'});
                        const a = document.createElement('a'); a.href=URL.createObjectURL(b); a.download=`MasseBuilder_${new Date().toISOString().split('T')[0]}.json`; a.click();
                    }} className="flex-1 bg-neutral-800 py-4 rounded-xl text-xs font-bold text-gray-400">💾 EXPORTER</button>
                    <label className="flex-1 bg-neutral-800 py-4 rounded-xl text-xs font-bold text-gray-400 text-center cursor-pointer">
                        📂 IMPORTER <input type="file" className="hidden" onChange={e => {
                            const f = e.target.files?.[0];
                            if(f) { const r = new FileReader(); r.onload=ev => { try{ const res = ev.target?.result as string; const d=JSON.parse(res); localStorage.clear(); Object.keys(d).forEach(k=>localStorage.setItem(k, d[k])); window.location.reload(); }catch(x){alert('Erreur import');} }; r.readAsText(f); }
                        }}/>
                    </label>
                </div>
            </div>
        ) : null}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-neutral-900/90 backdrop-blur-lg border-t border-white/5 pb-[env(safe-area-inset-bottom)] z-50">
          <div className="flex justify-around items-center h-16">
              {(['lundi', 'mercredi', 'vendredi', 'progression'] as const).map(d => (
                  <button key={d} onClick={() => setActiveTab(d)} className={`flex flex-col items-center justify-center w-full h-full transition ${activeTab === d ? 'text-indigo-500' : 'text-gray-600'}`}>
                      <span className="text-xl mb-1">{d === 'lundi' ? '🔴' : d === 'mercredi' ? '🔵' : d === 'vendredi' ? '🟢' : '📊'}</span>
                      <span className="text-[9px] font-bold uppercase tracking-widest">{d.substring(0,3)}</span>
                  </button>
              ))}
          </div>
      </div>
    </div>
  );
};

export default App;