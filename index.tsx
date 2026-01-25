import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom/client';

// ==========================================
// 1. CONFIGURATION & DONNÉES
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
  exercises: Record<string, string>; // "80|10"
  notes: string;
  mcGillDone?: boolean;
}

interface ProgressData {
  poids: string;
  taille: string;
  waist: string; // Tour de taille (Viscéral)
  photos: Record<string, string>; // Base64 compressed
}

// Données par défaut (S-1 fictif pour la semaine 1)
const BASELINE_PROGRAM: Record<string, { weight?: number; reps: number }> = {
  'lun-1': { weight: 10, reps: 15 }, 'lun-2': { reps: 15 }, 'lun-3': { weight: 30, reps: 10 },
  'lun-4': { weight: 18, reps: 12 }, 'lun-5': { reps: 12 },
  'mer-1': { reps: 6 }, 'mer-2': { weight: 60, reps: 10 }, 'mer-3': { weight: 50, reps: 12 },
  'mer-4': { weight: 20, reps: 15 }, 'mer-5': { weight: 12, reps: 12 }, 'mer-rappel': { reps: 20 },
  'ven-1': { weight: 60, reps: 10 }, 'ven-2': { weight: 40, reps: 12 }, 'ven-3': { weight: 24, reps: 10 },
  'ven-4': { weight: 12, reps: 12 }, 'ven-rappel': { reps: 8 },
};

const WORKOUT_PLAN: Record<string, ExerciseData[]> = {
  lundi: [
    { id: 'lun-1', title: 'Élévations Latérales', sets: 4, targetReps: 15, restTime: 90, tempo: "2-0-1-1", videoId: "3VcKaXpzqRo", isUnilateral: true, alternative: "Élévations Poulie" },
    { id: 'lun-2', title: 'Face Pull', sets: 4, targetReps: 15, restTime: 90, tempo: "2-0-1-2", videoId: "rep-EPVktec", alternative: "Oiseau Haltères" },
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
// 2. UTILITAIRES & LOGIQUE MÉTIER
// ==========================================

// Compression d'image via Canvas pour éviter le dépassement de quota LocalStorage
const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800; // Largeur max pour mobile
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;
                
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                // Compression JPEG quality 0.7
                resolve(canvas.toDataURL('image/jpeg', 0.7)); 
            };
            img.onerror = (error) => reject(error);
        };
    });
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
          {breakdown.length > 0 ? breakdown.map((b, i) => (
            <div key={i} className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
              <span className="font-black text-white text-xl">{b.p} kg</span>
              <span className="text-indigo-400 font-black text-xl">x {b.count}</span>
            </div>
          )) : <div className="text-gray-500 italic">Barre vide ou charge trop légère</div>}
        </div>
        <button onClick={onClose} className="w-full bg-white text-black py-4 rounded-xl font-black uppercase text-sm tracking-widest hover:bg-gray-200 transition">Fermer</button>
      </div>
    </div>
  );
};

const VideoModal = ({ videoId, onClose }: { videoId: string, onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/95 z-[110] flex flex-col justify-center p-4 animate-enter" onClick={onClose}>
    <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-neutral-800">
      <iframe width="100%" height="100%" src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`} title="Demo" allow="autoplay; encrypted-media" allowFullScreen />
    </div>
    <button className="mt-8 bg-indigo-600 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs" onClick={onClose}>Retour à l'entraînement</button>
  </div>
);

// ==========================================
// 3. APPLICATION PRINCIPALE
// ==========================================

const App = () => {
  // --- States ---
  const [currentWeek, setCurrentWeek] = useState<number>(() => { try { return parseInt(localStorage.getItem('currentWeek') || '1'); } catch { return 1; } });
  const [activeTab, setActiveTab] = useState<Day>('lundi');
  const [wakeLock, setWakeLock] = useState<any>(null);
  
  // UI Features
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [calcWeight, setCalcWeight] = useState<number | null>(null);
  const [showAlternatives, setShowAlternatives] = useState<Record<string, boolean>>({});
  const [autoSaveVisible, setAutoSaveVisible] = useState(false);

  // Timer "Invincible"
  const [timeLeft, setTimeLeft] = useState(0);
  const [targetTime, setTargetTime] = useState<number | null>(null);

  // Données
  const [workoutData, setWorkoutData] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<string>('');
  const [prevWeekData, setPrevWeekData] = useState<Record<string, string>>({});
  const [mcGillDone, setMcGillDone] = useState(false);
  const [progress, setProgress] = useState<ProgressData>(() => {
    try { return JSON.parse(localStorage.getItem('mb_progress') || '{"poids":"","taille":"","waist":"","photos":{}}'); } catch { return {poids:"", taille:"", waist:"", photos:{}}; }
  });

  // --- EFFETS ---

  // 1. Initialisation & Permissions
  useEffect(() => {
    // Demander permission Notif pour le Timer Background
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  // 2. WakeLock (Garder l'écran allumé)
  useEffect(() => {
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && activeTab !== 'progression') {
        try { const lock = await (navigator as any).wakeLock.request('screen'); setWakeLock(lock); } catch (e) { console.log('WakeLock fail', e); }
      }
    };
    requestWakeLock();
    return () => wakeLock?.release?.();
  }, [activeTab]);

  // 3. Timer Logic (Avec Notification)
  useEffect(() => {
    if (!targetTime) return;
    const interval = setInterval(() => {
      // Calcul basé sur le Timestamp système (résiste à la mise en veille)
      const remaining = Math.ceil((targetTime - Date.now()) / 1000);
      setTimeLeft(remaining > 0 ? remaining : 0);
      
      if (remaining <= 0) {
        setTargetTime(null);
        // Feedback haptique
        try { (navigator as any).vibrate?.([200, 100, 200, 100, 500]); } catch {}
        // Feedback audio
        new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play().catch(() => {});
        // Notification système si l'app est en arrière-plan
        if (document.hidden && Notification.permission === 'granted') {
           new Notification("⏰ REPOS TERMINÉ", { body: "C'est l'heure de pousser !", icon: "https://cdn-icons-png.flaticon.com/512/2548/2548530.png" });
        }
      }
    }, 500);
    return () => clearInterval(interval);
  }, [targetTime]);

  // 4. Chargement des données
  useEffect(() => {
    if (activeTab === 'progression') return;
    
    // Charger semaine courante
    const currentKey = `workout-${activeTab}-w${currentWeek}`;
    try {
      const saved = JSON.parse(localStorage.getItem(currentKey) || '{}');
      setWorkoutData(saved.exercises || {});
      setNotes(saved.notes || '');
      setMcGillDone(saved.mcGillDone || false);
    } catch { setWorkoutData({}); setNotes(''); setMcGillDone(false); }

    // Charger S-1 pour la Surcharge Progressive
    if (currentWeek > 1) {
      const prevKey = `workout-${activeTab}-w${currentWeek - 1}`;
      try {
        const savedPrev = JSON.parse(localStorage.getItem(prevKey) || '{}');
        setPrevWeekData(savedPrev.exercises || {});
      } catch { setPrevWeekData({}); }
    } else {
      setPrevWeekData({});
    }
    
    localStorage.setItem('currentWeek', currentWeek.toString());
  }, [activeTab, currentWeek]);

  // --- ACTIONS ---

  const saveSession = (newData: Record<string, string>, newMcGill: boolean, newNotes: string) => {
    const key = `workout-${activeTab}-w${currentWeek}`;
    const session: WorkoutSession = {
      date: new Date().toISOString().split('T')[0],
      week: currentWeek,
      day: activeTab,
      exercises: newData,
      notes: newNotes,
      mcGillDone: newMcGill
    };
    localStorage.setItem(key, JSON.stringify(session));
    
    setAutoSaveVisible(true);
    setTimeout(() => setAutoSaveVisible(false), 2000);
  };

  const updateVal = (exId: string, setIndex: number, type: 'w' | 'r', value: string) => {
    const key = `${exId}-s${setIndex}`;
    const current = workoutData[key] || '|';
    const [w, r] = current.split('|');
    const newVal = type === 'w' ? `${value}|${r}` : `${w}|${value}`;
    const newData = { ...workoutData, [key]: newVal };
    setWorkoutData(newData);
    saveSession(newData, mcGillDone, notes);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        try {
            const compressed = await compressImage(e.target.files[0]);
            const newProgress = { 
                ...progress, 
                photos: { ...progress.photos, [`${new Date().toISOString().split('T')[0]}`]: compressed } 
            };
            setProgress(newProgress);
            localStorage.setItem('mb_progress', JSON.stringify(newProgress));
            alert("Photo compressée et sauvegardée !");
        } catch (err) {
            alert("Erreur lors de la compression");
        }
    }
  };

  const getPrevVal = (exId: string, setIndex: number) => {
    const key = `${exId}-s${setIndex}`;
    const prevRaw = prevWeekData[key];
    if (prevRaw) return prevRaw.split('|');
    const base = BASELINE_PROGRAM[exId];
    if (base) return [base.weight?.toString() || '', base.reps.toString()];
    return ['', ''];
  };

  const startTimer = (sec: number) => {
    setTargetTime(Date.now() + sec * 1000); // Utilise Date.now() pour la robustesse
    setTimeLeft(sec);
  };

  const totalVolume = useMemo(() => {
    let vol = 0;
    Object.values(workoutData).forEach(v => {
      const [w, r] = v.split('|');
      if (w && r) vol += (parseFloat(w) * parseFloat(r));
    });
    return vol;
  }, [workoutData]);

  // Code Couleur Surcharge Progressive
  const getRepStatusColor = (currentReps: string, prevReps: string) => {
      if (!currentReps) return 'bg-neutral-900 border-neutral-800';
      const curr = parseInt(currentReps);
      const prev = parseInt(prevReps || '0');
      
      if (curr > prev) return 'bg-indigo-900/20 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)] text-indigo-400';
      if (curr === prev) return 'bg-yellow-900/20 border-yellow-600 text-yellow-400';
      return 'bg-red-900/10 border-red-900/50 text-red-400';
  };

  // --- RENDU ---

  return (
    <div className="flex flex-col min-h-screen bg-black text-white pb-32 max-w-md mx-auto relative font-sans selection:bg-indigo-500/30">
      
      {calcWeight && <PlateCalc weight={calcWeight} onClose={() => setCalcWeight(null)} />}
      {activeVideo && <VideoModal videoId={activeVideo} onClose={() => setActiveVideo(null)} />}
      
      {/* Toast Sauvegarde */}
      <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${autoSaveVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
         <div className="bg-green-500/20 backdrop-blur-md border border-green-500/50 px-4 py-2 rounded-full flex items-center gap-2 shadow-xl shadow-green-900/20">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-xs font-bold text-green-400 uppercase tracking-wide">Sauvegardé</span>
         </div>
      </div>

      {/* Header Sticky */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/5 px-5 py-4 flex justify-between items-center">
        <div className="flex flex-col">
           <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none">MASSE <span className="text-indigo-500">PRO</span></h1>
           <div className="flex items-center gap-2 mt-1">
             <span className="text-[9px] font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded uppercase tracking-wider">Semaine {currentWeek}</span>
             <div className="flex gap-1">
                <button onClick={() => currentWeek > 1 && setCurrentWeek(c => c-1)} className="text-gray-600 hover:text-white px-1">◀</button>
                <button onClick={() => setCurrentWeek(c => c+1)} className="text-gray-600 hover:text-white px-1">▶</button>
             </div>
           </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`text-3xl font-mono font-black tabular-nums tracking-tight ${timeLeft > 0 ? 'text-white' : 'text-neutral-800'}`}>
            {Math.floor(timeLeft/60)}:{(timeLeft%60).toString().padStart(2, '0')}
          </div>
        </div>
      </header>

      <main className="flex-1 p-5">
        {activeTab === 'progression' ? (
          <div className="space-y-8 animate-enter">
            <h2 className="text-2xl font-black uppercase tracking-tight mb-6">Suivi & Récupération</h2>
            
            {/* Mesures */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-6">Mesures (cm/kg)</h3>
              <div className="grid grid-cols-2 gap-4">
                {['poids', 'taille', 'waist'].map(k => (
                  <div key={k} className="relative group">
                    <label className="text-[9px] font-bold text-indigo-400 uppercase absolute -top-2 left-3 bg-neutral-900 px-1">{k}</label>
                    <input type="number" value={(progress as any)[k]} onChange={e => { const n = {...progress, [k]: e.target.value}; setProgress(n); localStorage.setItem('mb_progress', JSON.stringify(n)); }}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-4 text-white font-bold outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Photos */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6">
               <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Photos de forme</h3>
               <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                  <label className="flex-shrink-0 w-24 h-32 bg-neutral-800 rounded-xl border-2 border-dashed border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition">
                      <span className="text-2xl mb-1">📷</span>
                      <span className="text-[8px] uppercase font-bold text-gray-500">Ajouter</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                  {Object.entries(progress.photos || {}).reverse().map(([date, src]) => (
                      <div key={date} className="flex-shrink-0 w-24 h-32 relative rounded-xl overflow-hidden border border-gray-700">
                          <img src={src} className="w-full h-full object-cover" />
                          <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-center py-1 font-mono">{date}</div>
                      </div>
                  ))}
               </div>
            </div>

            {/* Protocole Récupération (Spec 44 ans) */}
            <div className="bg-indigo-900/10 border border-indigo-500/30 rounded-3xl p-6">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4">Protocole Thermique (44+)</h3>
                <div className="space-y-3 text-sm text-gray-300">
                    <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center text-xs font-bold">1</span>
                        <p>Sauna / Bain chaud : <span className="text-white font-bold">15-20 min</span></p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-xs font-bold">2</span>
                        <p>Douche Froide : <span className="text-white font-bold">2-3 min</span> (Respiration lente)</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-500 flex items-center justify-center text-xs font-bold">3</span>
                        <p>Retour au calme : <span className="text-white font-bold">5 min</span> (Hydratation)</p>
                    </div>
                </div>
            </div>

            {/* Backup */}
            <div className="space-y-3 pt-4 border-t border-white/5">
               <button onClick={() => { const b = new Blob([JSON.stringify(localStorage)], {type:'application/json'}); const a = document.createElement('a'); a.href=URL.createObjectURL(b); a.download=`MasseBuilder_${new Date().toISOString().split('T')[0]}.json`; a.click(); }} className="w-full bg-neutral-800 hover:bg-neutral-700 text-white py-4 rounded-xl font-bold uppercase text-xs tracking-widest transition-colors">
                 💾 Exporter Sauvegarde
               </button>
               <div className="relative">
                 <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => { const f = e.target.files?.[0]; if(f) { const r = new FileReader(); r.onload=ev => { try{ const d=JSON.parse(ev.target?.result as string); Object.assign(localStorage, d); window.location.reload(); }catch{alert('Fichier invalide');} }; r.readAsText(f); } }}/>
                 <button className="w-full bg-neutral-900 text-gray-500 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest border border-neutral-800">
                   ⬆️ Restaurer Données
                 </button>
               </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* McGill Check */}
            <div onClick={() => { const n = !mcGillDone; setMcGillDone(n); saveSession(workoutData, n, notes); }} 
                 className={`relative overflow-hidden p-5 rounded-3xl border transition-all cursor-pointer group ${mcGillDone ? 'bg-indigo-900/10 border-indigo-500/50' : 'bg-red-900/10 border-red-500/30'}`}>
               <div className="flex justify-between items-center relative z-10">
                 <div>
                   <h3 className={`font-black uppercase text-sm ${mcGillDone ? 'text-indigo-400' : 'text-red-400'}`}>{mcGillDone ? 'Zone lombaire sécurisée' : 'Activation McGill Requise'}</h3>
                   <p className="text-[10px] text-gray-500 font-bold mt-1">BIG 3 : CURL-UP • SIDE PLANK • BIRD DOG</p>
                 </div>
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg transition-transform ${mcGillDone ? 'bg-indigo-500 text-white rotate-0' : 'bg-red-500/20 text-red-500 rotate-180'}`}>
                   {mcGillDone ? '✓' : '!'}
                 </div>
               </div>
            </div>

            <div className={`space-y-10 transition-all duration-500 ${!mcGillDone ? 'opacity-30 blur-sm pointer-events-none grayscale' : ''}`}>
              <div className="flex items-end justify-between border-b border-white/5 pb-4">
                 <h2 className="text-3xl font-black uppercase text-white tracking-tighter">{activeTab}</h2>
                 <div className="text-right">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Volume Total</div>
                    <div className="text-xl font-black text-indigo-500">{totalVolume.toLocaleString()} <span className="text-sm text-gray-600">KG</span></div>
                 </div>
              </div>

              {(WORKOUT_PLAN[activeTab] || []).map((ex) => {
                const isAlt = showAlternatives[ex.id];
                return (
                  <div key={ex.id} className="animate-enter">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                         <h3 className="text-lg font-black leading-tight text-gray-100 flex items-center gap-2">
                           {ex.isRappel && <span className="text-[10px] bg-orange-600 text-white px-1.5 py-0.5 rounded font-bold">RAPPEL</span>}
                           {isAlt ? ex.alternative : ex.title}
                           {ex.isUnilateral && <span className="text-[10px] text-gray-500 font-normal ml-1">(Unilatéral)</span>}
                         </h3>
                         <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400 font-mono">
                            <span className="bg-white/5 px-2 py-0.5 rounded">Tempo: {ex.tempo || 'Standard'}</span>
                            <span className="bg-white/5 px-2 py-0.5 rounded">Obj: {ex.targetReps} reps</span>
                         </div>
                         <div className="flex gap-3 mt-2">
                           {ex.videoId && (
                             <button onClick={() => setActiveVideo(ex.videoId!)} className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1 hover:text-white transition"><span>▶ Voir la démo</span></button>
                           )}
                           {ex.alternative && (
                             <button onClick={() => setShowAlternatives(p => ({...p, [ex.id]: !p[ex.id]}))} className="text-[10px] font-bold text-gray-600 uppercase tracking-wider hover:text-white transition">⇄ {isAlt ? 'Original' : 'Alternative'}</button>
                           )}
                         </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {Array.from({ length: ex.sets }).map((_, i) => {
                        const key = `${ex.id}-s${i}`;
                        const rawVal = workoutData[key] || '|';
                        const [w, r] = rawVal.split('|');
                        const [prevW, prevR] = getPrevVal(ex.id, i);
                        
                        return (
                          <div key={i} className="flex gap-2 h-14">
                            {/* Poids avec PlateCalc trigger */}
                            <div className="flex-1 relative group">
                              <input type="number" placeholder={prevW || '-'} value={w} onChange={e => updateVal(ex.id, i, 'w', e.target.value)}
                                className="w-full h-full bg-neutral-900 border border-neutral-800 rounded-2xl text-center font-black text-xl text-white outline-none focus:border-indigo-500 transition-colors placeholder:text-gray-700"
                              />
                              <span className="absolute top-2 left-3 text-[8px] font-bold text-gray-600 uppercase tracking-wider pointer-events-none">KG</span>
                              {w && <button onClick={() => setCalcWeight(parseFloat(w))} className="absolute bottom-2 right-3 text-indigo-500 opacity-50 hover:opacity-100 transition-opacity text-xl">🧮</button>}
                            </div>

                            {/* Reps avec Steppers Fat Finger */}
                            <div className={`flex-[1.4] relative rounded-2xl border flex overflow-hidden transition-colors duration-300 ${getRepStatusColor(r, prevR)}`}>
                               <button className="w-14 h-full flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 active:bg-white/10 transition text-2xl font-bold" onClick={() => updateVal(ex.id, i, 'r', Math.max(0, (parseInt(r)||0) - 1).toString())}>−</button>
                               <input type="number" placeholder={prevR || ex.targetReps.toString()} value={r} onChange={e => updateVal(ex.id, i, 'r', e.target.value)} className="flex-1 h-full bg-transparent text-center font-black text-2xl outline-none placeholder:text-gray-600/50" />
                               <button className="w-14 h-full flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 active:bg-white/10 transition text-2xl font-bold" onClick={() => updateVal(ex.id, i, 'r', ((parseInt(r)||0) + 1).toString())}>+</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div className="mt-8 pt-8 border-t border-white/5">
                 <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Notes de séance</label>
                 <textarea value={notes} onChange={e => {setNotes(e.target.value); saveSession(workoutData, mcGillDone, e.target.value);}} placeholder="Douleurs, sensations..." className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-white focus:border-indigo-500 outline-none h-24 text-sm" />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Timer Bar Flottante */}
      {timeLeft === 0 && activeTab !== 'progression' && (
        <div className="fixed bottom-28 left-0 right-0 px-5 z-30 animate-enter">
          <div className="bg-neutral-900/95 backdrop-blur-md border border-white/10 rounded-2xl p-2 flex gap-2 shadow-2xl overflow-x-auto no-scrollbar">
            {[60, 90, 120, 180].map(s => (
              <button key={s} onClick={() => startTimer(s)} className="flex-1 min-w-[70px] bg-neutral-800 hover:bg-neutral-700 py-4 rounded-xl text-xs font-black text-gray-300 transition active:scale-95 border border-white/5">
                {s}s
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Fixe (Pouce) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 h-24 pb-6 px-4 z-40">
        <div className="flex justify-between items-center h-full max-w-sm mx-auto">
          {(['lundi', 'mercredi', 'vendredi', 'progression'] as const).map(d => (
            <button key={d} onClick={() => setActiveTab(d)} className={`flex flex-col items-center gap-1.5 transition-all duration-300 w-16 ${activeTab === d ? 'text-indigo-500 -translate-y-2' : 'text-neutral-500'}`}>
              <span className="text-2xl filter drop-shadow-lg">{d === 'lundi' ? '🔥' : d === 'mercredi' ? '🧊' : d === 'vendredi' ? '⚡' : '⚙️'}</span>
              <span className="text-[9px] font-black uppercase tracking-widest">{d.substring(0,3)}</span>
              {activeTab === d && <div className="w-1 h-1 bg-indigo-500 rounded-full shadow-[0_0_10px_currentColor]"></div>}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);