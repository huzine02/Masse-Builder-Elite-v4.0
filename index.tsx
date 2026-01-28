import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom/client';

// ==========================================
// 1. TYPES & CONFIGURATION
// ==========================================

type Day = 'lundi' | 'mercredi' | 'vendredi' | 'progression';

interface ExerciseData {
  id: string;
  title: string;
  sets: number;
  targetReps: number;
  restTime?: number;
  tempo?: string;
  videoId?: string;
  alternative?: string;
  isRappel?: boolean;
  isUnilateral?: boolean;
}

interface WorkoutSession {
  date: string;
  week: number;
  day: string;
  exercises: Record<string, string>; 
  notes: string;
  mcGillDone?: boolean;
}

interface ProgressData {
  poids: string;
  taille: string;
  waist: string;
  photos: Record<string, string>; 
}

const BASELINE_PROGRAM: Record<string, { weight?: number; reps: number }> = {
  'lun-1': { weight: 10, reps: 15 }, 'lun-2': { weight: 30, reps: 15 }, 'lun-3': { weight: 24, reps: 10 },
  'lun-4': { weight: 18, reps: 12 }, 'lun-5': { reps: 12 },
  'mer-1': { reps: 6 }, 'mer-2': { weight: 60, reps: 10 }, 'mer-3': { weight: 50, reps: 12 },
  'mer-4': { weight: 20, reps: 15 }, 'mer-5': { weight: 12, reps: 12 }, 'mer-rappel': { reps: 20 },
  'ven-1': { weight: 60, reps: 10 }, 'ven-2': { weight: 40, reps: 12 }, 'ven-3': { weight: 24, reps: 12 },
  'ven-4': { weight: 12, reps: 10 }, 'ven-rappel': { reps: 8 },
};

const WORKOUT_PLAN: Record<string, ExerciseData[]> = {
  lundi: [
    { id: 'lun-1', title: 'Élévations Latérales', sets: 4, targetReps: 15, restTime: 90, tempo: "2-0-1-1", videoId: "3VcKaXpzqRo", isUnilateral: true, alternative: "Élévations Poulie" },
    { id: 'lun-2', title: 'Face Pull', sets: 4, targetReps: 15, restTime: 90, tempo: "2-0-1-2", videoId: "6SdfuG_p_Ho", alternative: "Oiseau Haltères" },
    { id: 'lun-3', title: 'Développé Incliné', sets: 4, targetReps: 10, restTime: 120, tempo: "3-1-1-0", videoId: "0G2_kHIv7p8", isUnilateral: true, alternative: "Machine Inclinée" },
    { id: 'lun-4', title: 'Développé Arnold', sets: 3, targetReps: 12, restTime: 90, tempo: "3-0-1-0", videoId: "6Z15_WdXMa4", isUnilateral: true },
    { id: 'lun-5', title: 'Dips / Triceps', sets: 3, targetReps: 12, restTime: 90, tempo: "3-0-1-0", videoId: "2z8JmcrW-As" },
  ],
  mercredi: [
    { id: 'mer-1', title: 'Tractions', sets: 5, targetReps: 6, restTime: 120, tempo: "3-0-X-1", videoId: "eGo4IYlbE5g", alternative: "Tirage Vertical" },
    { id: 'mer-2', title: 'Rowing Barre', sets: 4, targetReps: 10, restTime: 120, tempo: "3-0-1-1", videoId: "G8l_8chR5BE", alternative: "Rowing T-Bar" },
    { id: 'mer-3', title: 'Tirage Horizontal', sets: 3, targetReps: 12, restTime: 90, tempo: "3-0-1-2", videoId: "GZbfZ033f74" },
    { id: 'mer-4', title: 'Pull-over Poulie', sets: 3, targetReps: 15, restTime: 60, tempo: "4-1-1-0", videoId: "H5-0X3j0-s0" },
    { id: 'mer-5', title: 'Curl Incliné', sets: 3, targetReps: 12, restTime: 60, tempo: "3-0-1-0", videoId: "soxrZlIl35U", isUnilateral: true },
    { id: 'mer-rappel', title: '⚡ RAPPEL PUSH : Pompes', sets: 3, targetReps: 20, restTime: 60, isRappel: true, videoId: "IODxDxX7oi4" },
  ],
  vendredi: [
    { id: 'ven-1', title: 'RDL (Soulevé Roumain)', sets: 4, targetReps: 10, restTime: 180, tempo: "4-1-1-0", videoId: "JCXUYuzwNrM", alternative: "Leg Curl Assis" },
    { id: 'ven-2', title: 'Hip Thrust', sets: 4, targetReps: 12, restTime: 120, tempo: "2-1-X-2", videoId: "SEdqd1n0cvg" },
    { id: 'ven-3', title: 'Goblet Squat', sets: 4, targetReps: 12, restTime: 120, tempo: "3-1-1-0", videoId: "MeIiIdhvXT4", alternative: "Presse à cuisses" },
    { id: 'ven-4', title: 'Fentes Bulgares', sets: 3, targetReps: 10, restTime: 90, tempo: "3-0-1-0", videoId: "2C-uNgKwPLE", isUnilateral: true },
    { id: 'ven-rappel', title: '⚡ RAPPEL DOS : Tractions', sets: 3, targetReps: 8, restTime: 90, isRappel: true, videoId: "eGo4IYlbE5g" },
  ],
};

// ==========================================
// 2. UTILITAIRES
// ==========================================

const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const scale = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
        };
    });
};

const extractVideoId = (url: string) => {
  if (!url) return '';
  // Rule C: Robust Extraction - plus tolérante
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  const id = (match && match[2]) ? match[2] : url;
  // On nettoie les espaces éventuels qui cassent l'embed
  return id.trim();
};

const PlateCalc = ({ weight, onClose }: { weight: number, onClose: () => void }) => {
  const perSide = Math.max(0, (weight - 20) / 2);
  const breakdown = [20, 10, 5, 2.5, 1.25].map(p => ({ p, count: Math.floor(perSide / p) })).filter(b => b.count > 0);
  return (
    <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-6 animate-enter" onClick={onClose}>
      <div className="bg-neutral-900 border border-neutral-700 p-8 rounded-[2rem] w-full max-w-sm text-center shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="text-gray-500 uppercase text-[10px] font-black tracking-widest mb-4">Barre Olympique (20kg)</div>
        <div className="text-6xl font-black text-white mb-2">{weight} <span className="text-2xl text-gray-500">kg</span></div>
        <div className="text-indigo-400 font-bold mb-8 text-lg">({perSide}kg par côté)</div>
        <div className="space-y-3 mb-8">
          {breakdown.map((b, i) => (
            <div key={i} className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
              <span className="font-black text-white text-xl">{b.p} kg</span>
              <span className="text-indigo-400 font-black text-xl">x {b.count}</span>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="w-full bg-white text-black py-4 rounded-xl font-black uppercase text-sm tracking-widest">Fermer</button>
      </div>
    </div>
  );
};

const VideoModal = ({ videoId, onClose }: { videoId: string, onClose: () => void }) => {
  const cleanId = extractVideoId(videoId);
  return (
    <div className="fixed inset-0 bg-black/95 z-[110] flex flex-col justify-center p-4 animate-enter" onClick={onClose}>
      <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-neutral-800 relative">
        <iframe 
            width="100%" 
            height="100%" 
            // Fix: mute=1 est OBLIGATOIRE pour autoplay sur mobile + playsinline pour iOS
            src={`https://www.youtube.com/embed/${cleanId}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1&controls=1`} 
            title="Demo" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      <button className="mt-8 bg-indigo-600 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs" onClick={onClose}>Retour à l'entraînement</button>
    </div>
  );
};

// ==========================================
// 3. LOGIQUE & UI
// ==========================================

const App = () => {
  const [currentWeek, setCurrentWeek] = useState<number>(() => parseInt(localStorage.getItem('currentWeek') || '1'));
  const [activeTab, setActiveTab] = useState<Day>('lundi');
  const [wakeLock, setWakeLock] = useState<any>(null);
  const [autoSaveVisible, setAutoSaveVisible] = useState(false);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [calcWeight, setCalcWeight] = useState<number | null>(null);
  const [showAlternatives, setShowAlternatives] = useState<Record<string, boolean>>({});

  // Timer Invincible
  const [timeLeft, setTimeLeft] = useState(0);
  const [targetTime, setTargetTime] = useState<number | null>(null);

  // Data
  const [workoutData, setWorkoutData] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<string>('');
  const [prevWeekData, setPrevWeekData] = useState<Record<string, string>>({});
  const [mcGillDone, setMcGillDone] = useState(false);
  const [progress, setProgress] = useState<ProgressData>(() => {
    try { return JSON.parse(localStorage.getItem('mb_progress_v2') || '{"poids":"","taille":"","waist":"","photos":{}}'); } catch { return {poids:"", taille:"", waist:"", photos:{}}; }
  });

  // Rule A: Auto-Navigation & Week Calculation
  useEffect(() => {
    const initApp = () => {
        // 1. Detect Day (Logic Smart)
        const dayMap: Record<number, Day> = { 
            1: 'lundi', 
            2: 'mercredi', // Mardi -> On anticipe Mercredi
            3: 'mercredi', 
            4: 'vendredi', // Jeudi -> On anticipe Vendredi
            5: 'vendredi',
            6: 'progression', // Samedi -> Bilan
            0: 'progression'  // Dimanche -> Bilan
        };
        const today = new Date().getDay();
        if (dayMap[today]) {
            setActiveTab(dayMap[today]);
        }

        // 2. Calc Week
        let startStr = localStorage.getItem('mb_start_date');
        if (!startStr) {
            startStr = new Date().toISOString();
            localStorage.setItem('mb_start_date', startStr);
        }
        const start = new Date(startStr);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        const calcWeek = Math.ceil(diffDays / 7) || 1;
        
        if (parseInt(localStorage.getItem('currentWeek') || '1') === 1 && calcWeek > 1) {
            setCurrentWeek(calcWeek);
        }
    };
    initApp();
  }, []);

  // Notifs & WakeLock
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') Notification.requestPermission();
    const requestLock = async () => {
      if ('wakeLock' in navigator && activeTab !== 'progression') {
        try { setWakeLock(await (navigator as any).wakeLock.request('screen')); } catch {}
      }
    };
    requestLock();
    return () => wakeLock?.release?.();
  }, [activeTab]);

  // Timer Background
  useEffect(() => {
    if (!targetTime) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((targetTime - Date.now()) / 1000);
      setTimeLeft(remaining > 0 ? remaining : 0);
      if (remaining <= 0) {
        setTargetTime(null);
        try { (navigator as any).vibrate?.([200, 100, 200, 100, 500]); } catch {}
        if (document.hidden && Notification.permission === 'granted') {
           new Notification("⏰ REPOS TERMINÉ", { body: "Prêt pour la suite !", icon: "https://cdn-icons-png.flaticon.com/512/2548/2548530.png" });
        }
      }
    }, 500);
    return () => clearInterval(interval);
  }, [targetTime]);

  // Load Persistence
  useEffect(() => {
    if (activeTab === 'progression') return;
    const currentKey = `workout-${activeTab}-w${currentWeek}`;
    const saved = JSON.parse(localStorage.getItem(currentKey) || '{}');
    setWorkoutData(saved.exercises || {});
    setNotes(saved.notes || '');
    setMcGillDone(saved.mcGillDone || false);

    if (currentWeek > 1) {
      const prev = JSON.parse(localStorage.getItem(`workout-${activeTab}-w${currentWeek - 1}`) || '{}');
      setPrevWeekData(prev.exercises || {});
    } else {
      setPrevWeekData({});
    }
    localStorage.setItem('currentWeek', currentWeek.toString());
  }, [activeTab, currentWeek]);

  // startTimer function
  const startTimer = (seconds: number) => {
    setTargetTime(Date.now() + seconds * 1000);
    setTimeLeft(seconds);
  };

  const save = (newData: Record<string, string>, newMcGill: boolean, newNotes: string) => {
    localStorage.setItem(`workout-${activeTab}-w${currentWeek}`, JSON.stringify({
      exercises: newData, notes: newNotes, mcGillDone: newMcGill, week: currentWeek, day: activeTab
    }));
    setAutoSaveVisible(true);
    setTimeout(() => setAutoSaveVisible(false), 2000);
  };

  const updateVal = (exId: string, idx: number, type: 'w'|'r', val: string) => {
    const k = `${exId}-s${idx}`;
    const [w, r] = (workoutData[k] || '|').split('|');
    const newVal = type === 'w' ? `${val}|${r}` : `${w}|${val}`;
    const next = { ...workoutData, [k]: newVal };
    setWorkoutData(next);
    save(next, mcGillDone, notes);
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const compressed = await compressImage(e.target.files[0]);
      const next = { ...progress, photos: { ...progress.photos, [new Date().toISOString().split('T')[0]]: compressed } };
      setProgress(next);
      localStorage.setItem('mb_progress_v2', JSON.stringify(next));
    }
  };

  const getRepColor = (curr: string, prev: string) => {
    if (!curr) return 'bg-neutral-900 border-neutral-800';
    const c = parseInt(curr), p = parseInt(prev || '0');
    // Rule B: Feedback (Border Green if > S-1)
    if (c > p) return 'bg-indigo-900/20 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)] text-green-400';
    if (c === p) return 'bg-yellow-900/20 border-yellow-600 text-yellow-400';
    return 'bg-red-900/10 border-red-900/50 text-red-400';
  };

  const getPrevVal = (exId: string, idx: number) => {
    const raw = prevWeekData[`${exId}-s${idx}`];
    if (raw) return raw.split('|');
    const base = BASELINE_PROGRAM[exId];
    return [base?.weight?.toString() || '-', base?.reps?.toString() || '-'];
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white pb-32 max-w-md mx-auto relative overflow-x-hidden selection:bg-indigo-500/30">
      {calcWeight && <PlateCalc weight={calcWeight} onClose={() => setCalcWeight(null)} />}
      {activeVideo && <VideoModal videoId={activeVideo} onClose={() => setActiveVideo(null)} />}
      
      <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all ${autoSaveVisible ? 'opacity-100' : 'opacity-0'}`}>
         <div className="bg-green-500/20 backdrop-blur-md border border-green-500/50 px-4 py-2 rounded-full text-xs font-bold text-green-400">SAUVEGARDÉ</div>
      </div>

      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/5 px-5 py-4 flex justify-between items-center">
        <div className="flex flex-col">
           <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none">MASSE <span className="text-indigo-500">PRO</span></h1>
           <div className="flex items-center gap-2 mt-1">
             <span className="text-[9px] font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded uppercase">S{currentWeek}</span>
             <button onClick={() => setCurrentWeek(w => Math.max(1, w-1))} className="text-gray-600 px-1">◀</button>
             <button onClick={() => setCurrentWeek(w => w+1)} className="text-gray-600 px-1">▶</button>
           </div>
        </div>
        <div className={`text-3xl font-mono font-black tabular-nums tracking-tight ${timeLeft > 0 ? 'text-white' : 'text-neutral-800'}`}>
          {Math.floor(timeLeft/60)}:{(timeLeft%60).toString().padStart(2, '0')}
        </div>
      </header>

      <main className="flex-1 p-5">
        {activeTab === 'progression' ? (
          <div className="space-y-8 animate-enter">
            <h2 className="text-2xl font-black uppercase tracking-tight">Suivi Pro</h2>
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 grid grid-cols-2 gap-4">
              {['poids', 'taille', 'waist'].map(k => (
                <div key={k} className="relative">
                  <label className="text-[9px] font-bold text-indigo-400 uppercase absolute -top-2 left-3 bg-neutral-900 px-1">{k}</label>
                  <input type="number" value={(progress as any)[k]} onChange={e => { const n = {...progress, [k]: e.target.value}; setProgress(n); localStorage.setItem('mb_progress_v2', JSON.stringify(n)); }} className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-4 font-bold outline-none focus:border-indigo-500" />
                </div>
              ))}
            </div>
            
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6">
               <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Photos (Compression S-1)</h3>
               <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                  <label className="flex-shrink-0 w-24 h-32 bg-neutral-800 rounded-xl border-2 border-dashed border-gray-700 flex flex-col items-center justify-center cursor-pointer">
                      <span className="text-2xl">📷</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                  </label>
                  {Object.entries(progress.photos || {}).reverse().map(([date, src]) => (
                      <div key={date} className="flex-shrink-0 w-24 h-32 relative rounded-xl overflow-hidden border border-gray-700">
                          <img src={src} className="w-full h-full object-cover" />
                          <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-center py-1">{date}</div>
                      </div>
                  ))}
               </div>
            </div>

            <div className="bg-indigo-900/10 border border-indigo-500/30 rounded-3xl p-6">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4">Récupération Thermique (44+)</h3>
                <div className="space-y-2 text-sm text-gray-300">
                    <p>🔥 Sauna : <span className="text-white font-bold">15-20 min</span></p>
                    <p>❄️ Douche Froide : <span className="text-white font-bold">2 min</span></p>
                </div>
            </div>

            <button onClick={() => { const b = new Blob([JSON.stringify(localStorage)], {type:'application/json'}); const a = document.createElement('a'); a.href=URL.createObjectURL(b); a.download=`MasseBuilder_${new Date().toISOString().split('T')[0]}.json`; a.click(); }} className="w-full bg-neutral-800 py-4 rounded-xl font-bold uppercase text-xs tracking-widest">💾 Exporter Sauvegarde</button>
            <label className="block w-full text-center bg-neutral-900 py-4 rounded-xl text-xs font-bold text-gray-500 uppercase tracking-widest cursor-pointer">
                📂 Importer
                <input type="file" className="hidden" onChange={e => {
                    const f = e.target.files?.[0];
                    if(f) { const r = new FileReader(); r.onload=ev => { try{ const res = ev.target?.result as string; const d=JSON.parse(res); Object.keys(d).forEach(k=>localStorage.setItem(k, d[k])); window.location.reload(); }catch(x){alert('Erreur import');} }; r.readAsText(f); }
                }}/>
            </label>
          </div>
        ) : (
          <div className="space-y-8">
            <div onClick={() => { const n = !mcGillDone; setMcGillDone(n); save(workoutData, n, notes); }} className={`p-5 rounded-3xl border transition-all cursor-pointer ${mcGillDone ? 'bg-indigo-900/10 border-indigo-500/50' : 'bg-red-900/10 border-red-500/30'}`}>
               <div className="flex justify-between items-center">
                 <div>
                   <h3 className={`font-black uppercase text-sm ${mcGillDone ? 'text-indigo-400' : 'text-red-400'}`}>{mcGillDone ? 'Dos sécurisé ✓' : 'McGill Big 3 Requis !'}</h3>
                   <p className="text-[10px] text-gray-500 font-bold">Curl-up • Side Plank • Bird-Dog</p>
                 </div>
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${mcGillDone ? 'bg-indigo-500 text-white' : 'bg-red-500/20 text-red-500 animate-pulse'}`}>
                   {mcGillDone ? '✓' : '!'}
                 </div>
               </div>
            </div>

            <div className={`space-y-10 transition-all ${!mcGillDone ? 'opacity-30 blur-sm pointer-events-none' : ''}`}>
              {(WORKOUT_PLAN[activeTab] || []).map((ex) => {
                const isAlt = showAlternatives[ex.id];
                return (
                  <div key={ex.id} className="animate-enter">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                         <h3 className="text-lg font-black leading-tight flex items-center gap-2">
                           {ex.isRappel && <span className="text-[10px] bg-orange-600 px-1.5 py-0.5 rounded">RAPPEL</span>}
                           {isAlt ? ex.alternative : ex.title}
                         </h3>
                         <div className="flex gap-4 mt-2">
                           {ex.videoId && <button onClick={() => setActiveVideo(ex.videoId!)} className="text-[10px] font-bold text-indigo-400 uppercase">▶ Démo</button>}
                           {ex.alternative && <button onClick={() => setShowAlternatives(p => ({...p, [ex.id]: !p[ex.id]}))} className="text-[10px] font-bold text-gray-600 uppercase">⇄ Alternative</button>}
                         </div>
                      </div>
                      <div className="text-right text-[10px] text-gray-500 font-mono">T: {ex.tempo}</div>
                    </div>

                    <div className="space-y-3">
                      {Array.from({ length: ex.sets }).map((_, i) => {
                        const k = `${ex.id}-s${i}`;
                        const [w, r] = (workoutData[k] || '|').split('|');
                        const [pW, pR] = getPrevVal(ex.id, i);
                        
                        return (
                          <div key={i} className="flex gap-2 h-14">
                            <div className="flex-1 relative group">
                              <input type="number" placeholder={pW} value={w} onChange={e => updateVal(ex.id, i, 'w', e.target.value)} className="w-full h-full bg-neutral-900 border border-neutral-800 rounded-2xl text-center font-black text-xl text-white outline-none focus:border-indigo-500" />
                              <span className="absolute top-2 left-3 text-[8px] font-bold text-gray-600 uppercase">KG</span>
                              
                              {/* Rule B: Ghost Mode Auto-Fill for Weight (Mobile Optimized) */}
                              {!w && pW !== '-' && (
                                <button 
                                    onClick={() => updateVal(ex.id, i, 'w', pW)}
                                    className="absolute inset-0 flex items-center justify-center bg-black/50 text-gray-400 opacity-50 z-10"
                                >
                                    <span className="text-xs font-bold uppercase tracking-widest">↺ {pW}</span>
                                </button>
                              )}
                              
                              <button onClick={() => setCalcWeight(parseFloat(w))} className="absolute bottom-2 right-3 text-indigo-500 text-lg">🧮</button>
                            </div>
                            
                            <div className={`flex-[1.4] relative rounded-2xl border flex overflow-hidden ${getRepColor(r, pR)}`}>
                               <button className="w-14 h-full flex items-center justify-center text-2xl font-bold" onClick={() => updateVal(ex.id, i, 'r', Math.max(0, (parseInt(r)||0) - 1).toString())}>−</button>
                               <input 
                                   type="number" 
                                   placeholder={pR !== '-' ? pR : ex.targetReps.toString()} 
                                   value={r} 
                                   onChange={e => updateVal(ex.id, i, 'r', e.target.value)}
                                   // Rule D: Auto-Timer on Blur
                                   onBlur={() => {
                                      if (r && parseInt(r) > 0 && ex.restTime && timeLeft === 0) {
                                          startTimer(ex.restTime);
                                      }
                                   }}
                                   className="flex-1 h-full bg-transparent text-center font-black text-2xl outline-none" 
                               />
                               <button className="w-14 h-full flex items-center justify-center text-2xl font-bold" onClick={() => updateVal(ex.id, i, 'r', ((parseInt(r)||0) + 1).toString())}>+</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <textarea value={notes} onChange={e => {setNotes(e.target.value); save(workoutData, mcGillDone, e.target.value);}} placeholder="Notes de séance..." className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-white h-24 text-sm" />
            </div>
          </div>
        )}
      </main>

      {timeLeft === 0 && activeTab !== 'progression' && (
        <div className="fixed bottom-28 left-0 right-0 px-5 z-30 animate-enter">
          <div className="bg-neutral-900/95 backdrop-blur-md border border-white/10 rounded-2xl p-2 flex gap-2 overflow-x-auto no-scrollbar">
            {[60, 90, 120, 180].map(s => (
              <button key={s} onClick={() => startTimer(s)} className="flex-1 min-w-[75px] bg-neutral-800 py-4 rounded-xl text-xs font-black text-gray-300 border border-white/5 active:scale-95 transition">{s}s</button>
            ))}
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 h-24 pb-6 px-4 z-40">
        <div className="flex justify-between items-center h-full max-w-sm mx-auto">
          {(['lundi', 'mercredi', 'vendredi', 'progression'] as const).map(d => (
            <button key={d} onClick={() => setActiveTab(d)} className={`flex flex-col items-center gap-1.5 transition-all w-16 ${activeTab === d ? 'text-indigo-500 -translate-y-2' : 'text-neutral-500'}`}>
              <span className="text-2xl">{d === 'lundi' ? '🔥' : d === 'mercredi' ? '🧊' : d === 'vendredi' ? '⚡' : '⚙️'}</span>
              <span className="text-[9px] font-black uppercase tracking-widest">{d.substring(0,3)}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);