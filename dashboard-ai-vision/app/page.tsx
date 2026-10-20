'use client';

import React, { useState, useEffect, useRef } from 'react';

export default function OIPProductionDashboard() {
  // حالة الفيديو والأناليز
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false); // مرحلة الأناليز الأولي
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);

  // المتغيرات الأصلية (Cases & Pallets) - كتبدا بـ null باش تبان "—" قبل الفيديو
  const [casesCount, setCasesCount] = useState<number | null>(null);
  const [palletsCount, setPalletsCount] = useState<number | null>(null);
  const [scannerStatus, setScannerStatus] = useState<string>('En attente');
  const [lastReception, setLastReception] = useState<string>('—');

  // متغيرات الماكينات (Vitesse, Température, Pression, État) - كتبدا بـ null قبل الفيديو
  const [machineSpeed, setMachineSpeed] = useState<number | null>(null);
  const [temperature, setTemperature] = useState<number | null>(null);
  const [pressure, setPressure] = useState<number | null>(null);
  const [machineHealth, setMachineHealth] = useState<number | null>(null);

  // سجل العمليات التقنية (Logs)
  const [logs, setLogs] = useState<string[]>([
    '// Log système en temps réel',
    "En attente d'une source vidéo..."
  ]);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // دالة لإضافة سطر جديد في الـ Log بالوقت الحقيقي
  const addLog = (message: string) => {
    const now = new Date().toLocaleTimeString('fr-FR');
    setLogs((prev) => [...prev.slice(-14), `[${now}] ${message}`]);
  };

  // عند رفع الفيديو
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setIsAnalyzing(true);
    setIsPlaying(false);
    setPlaybackRate(1);
    setScannerStatus('Calibrage IA...');

    // تصفير القيم أثناء التحليل الأولي
    setCasesCount(null);
    setPalletsCount(null);
    setMachineSpeed(null);
    setTemperature(null);
    setPressure(null);
    setMachineHealth(null);

    addLog(`Fichier importé : "${file.name}"`);
    addLog('Initialisation du modèle de vision par ordinateur...');

    // محاكاة التحليل الأولي للفيديو (ثانية ونصف) قبل بدء عرض البيانات
    setTimeout(() => {
      setIsAnalyzing(false);
      setScannerStatus('Analyse Active');
      setCasesCount(12);
      setPalletsCount(1);
      setMachineSpeed(58);
      setTemperature(42.0);
      setPressure(3.80);
      setMachineHealth(99.2);
      setLastReception(new Date().toLocaleTimeString('fr-FR'));
      addLog('Calibrage terminé. Détection des machines et OCR opérationnels.');
    }, 1500);
  };

  // تغيير سرعة الفيديو (x0.5, x1, x1.5, x2, x3)
  const changeVideoSpeed = (newRate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = newRate;
    }
    setPlaybackRate(newRate);
    addLog(`Vitesse du flux vidéo modifiée : x${newRate.toFixed(1)}`);
  };

  // المحرك الفيزيائي المباشر (لا يشتغل إلا بعد انتهاء التحليل وتشغيل الفيديو)
  useEffect(() => {
    if (!videoUrl || isAnalyzing || !isPlaying) return;

    const interval = setInterval(() => {
      // 1. حساب سرعة الماكينة مباشرة بناءً على سرعة الفيديو (x1, x2, x3...)
      // تذبذب طفيف جداً (±1 RPM) لكي يبدو كقراءة حساس حقيقية بدون عشوائية
      const baseSpeedForRate = 58 * playbackRate;
      const microSensorJitter = (Math.random() - 0.5) * 1.4;
      const currentSpeed = Math.round(baseSpeedForRate + microSensorJitter);
      setMachineSpeed(currentSpeed);

      // 2. حساب الحرارة المستهدفة حسب السرعة الحالية للفيديو
      // لا تنزل الحرارة أبداً إلا إذا قام المستخدم بتخفيض سرعة الفيديو!
      setTemperature((prevTemp) => {
        const currentTemp = prevTemp ?? 42.0;
        // الحرارة القصوى المستهدفة لكل سرعة: x0.5 -> 36°C | x1 -> 48°C | x2 -> 78°C | x3 -> 104°C
        const targetTemp = 24 + (baseSpeedForRate * 0.45);

        let nextTemp = currentTemp;
        if (currentTemp < targetTemp) {
          // الحرارة ترتفع تدريجياً نحو الهدف عند زيادة السرعة
          const climbStep = (targetTemp - currentTemp) * 0.14 + (playbackRate * 0.25);
          nextTemp = Math.min(targetTemp, currentTemp + climbStep);
        } else if (currentTemp > targetTemp + 0.5) {
          // الحرارة لا تنزل إلا إذا تم تخفيض سرعة الفيديو (تبريد تدريجي)
          const coolStep = (currentTemp - targetTemp) * 0.12;
          nextTemp = Math.max(targetTemp, currentTemp - coolStep);
        }

        const finalTemp = Number(nextTemp.toFixed(1));

        // 3. حساب الضغط الهيدروليكي (مرتبط طردياً بالسرعة والحرارة الحالية)
        const calcPressure = 1.8 + (currentSpeed * 0.028) + ((finalTemp - 25) * 0.032);
        const finalPressure = Number(Math.max(2.1, calcPressure).toFixed(2));
        setPressure(finalPressure);

        // 4. حساب حالة الماكينة (État de la machine)
        setMachineHealth((prevHealth) => {
          const currHealth = prevHealth ?? 99.2;
          let nextHealth = currHealth;

          if (playbackRate >= 2 || finalTemp > 72 || finalPressure > 6.2) {
            // تدهور مستمر لحالة الماكينة طالما السرعة والحرارة مرتفعة
            const degradationRate = playbackRate >= 3 ? 0.6 : 0.25;
            nextHealth = Math.max(15.0, currHealth - degradationRate);
          } else if (playbackRate <= 1 && finalTemp < 52 && currHealth < 99.0) {
            // استقرار وتحسن طفيف جداً فقط عند إرجاع السرعة للوضع العادي أو البطيء
            nextHealth = Math.min(99.2, currHealth + 0.05);
          }

          return Number(nextHealth.toFixed(1));
        });

        return finalTemp;
      });

      // 5. تحديث الصناديق والباليت حسب سرعة الإنتاج
      if (Math.random() < 0.35 * playbackRate) {
        setCasesCount((prev) => {
          const currentCases = prev ?? 12;
          const added = playbackRate >= 2 ? 2 : 1;
          const nextCases = currentCases + added;
          setPalletsCount(Math.floor(nextCases / 12) + 1);
          setLastReception(new Date().toLocaleTimeString('fr-FR'));
          return nextCases;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [videoUrl, isAnalyzing, isPlaying, playbackRate]);

  // تنبيهات أوتوماتيكية في الـ Log عند ارتفاع الحرارة أو السرعة
  useEffect(() => {
    if (temperature && temperature > 75 && playbackRate >= 2) {
      addLog(`ALERTE : Surchauffe détectée (${temperature.toFixed(1)} °C) à vitesse x${playbackRate}`);
    }
  }, [ playbackRate, temperature !== null && Math.floor(temperature / 10) ]);

  // تحديد لون وحالة الماكينة
  const getHealthBadge = () => {
    if (machineHealth === null) return { label: 'En attente', color: 'text-slate-900', subColor: 'text-slate-400' };
    if (machineHealth >= 80) return { label: `${machineHealth.toFixed(1)} %`, status: 'Optimal', color: 'text-emerald-600', subColor: 'text-emerald-600' };
    if (machineHealth >= 50) return { label: `${machineHealth.toFixed(1)} %`, status: 'Sous tension', color: 'text-amber-500', subColor: 'text-amber-600' };
    return { label: `${machineHealth.toFixed(1)} %`, status: 'Critique', color: 'text-red-600', subColor: 'text-red-600' };
  };

  const healthInfo = getHealthBadge();

  return (
    <div className="min-h-screen flex bg-[#f8fafc] text-slate-900 font-sans">
      {/* السايدبار الأيسر (نفس الديزاين الأصلي) */}
      <aside className="w-64 bg-[#0f172a] text-white flex flex-col shrink-0 select-none">
        <div className="p-6">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-white">OIP</span>
            <span className="text-xs font-medium tracking-widest text-slate-400 uppercase">INDUSTRY</span>
          </div>
          <p className="text-xs text-slate-400 mt-8">Dashboard de production</p>
        </div>

        <nav className="mt-2 flex-1 space-y-1">
          <div className="bg-[#1e293b] text-white font-semibold text-sm px-6 py-3.5 border-l-4 border-blue-500 cursor-pointer">
            Vue générale
          </div>
          <div className="text-slate-400 hover:text-slate-200 text-sm px-6 py-3.5 cursor-pointer transition">
            Données du projet
          </div>
          <div className="text-slate-400 hover:text-slate-200 text-sm px-6 py-3.5 cursor-pointer transition">
            Connexion
          </div>
        </nav>
      </aside>

      {/* المحتوى الرئيسي (الأبيض والرمادي الفاتح المنظم) */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* الهيدر العلوي */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div>
              <p className="text-[11px] font-bold tracking-wider text-blue-600 uppercase">
                SUPERVISION INDUSTRIELLE • OPEN INDUSTRY PROJECT
              </p>
              <h1 className="text-3xl font-extrabold text-slate-900 mt-1">
                Dashboard de production
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Extraction des données par IA en temps réel.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-xs">
                <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-500 animate-ping' : 'bg-emerald-500'}`}></span>
                Système Actif
              </div>
            </div>
          </header>

          {/* الصف الأول: الكارطات الـ 4 الأصلية (Cases, Pallets, Scanner, Réception) */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* 1. Cases détectées */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">Cases détectées</p>
              <h2 className="text-3xl font-black text-slate-900 mt-3">
                {casesCount !== null ? casesCount : '—'}
              </h2>
              <p className="text-[11px] text-slate-400 mt-3">Analyse visuelle IA</p>
            </div>

            {/* 2. Pallets détectés */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">Pallets détectés</p>
              <h2 className="text-3xl font-black text-slate-900 mt-3">
                {palletsCount !== null ? palletsCount : '—'}
              </h2>
              <p className="text-[11px] text-slate-400 mt-3">Analyse visuelle IA</p>
            </div>

            {/* 3. État du Scanner */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">État du Scanner</p>
              <h2 className={`text-2xl font-extrabold mt-3 ${
                isAnalyzing ? 'text-amber-600 animate-pulse' : isPlaying ? 'text-blue-600' : 'text-slate-900'
              }`}>
                {scannerStatus}
              </h2>
              <p className="text-[11px] text-slate-400 mt-3">Moteur Vision par Ordinateur</p>
            </div>

            {/* 4. Dernière réception */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">Dernière réception</p>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-3">
                {lastReception}
              </h2>
              <p className="text-[11px] text-slate-400 mt-3">Horodatage local</p>
            </div>
          </section>

          {/* الصف الثاني: الكارطات الـ 4 ديال الماكينات (بنفس الفورما والديزاين الأبيض النقي) */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* 1. Vitesse Machine */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs">
              <div className="flex justify-between items-center">
                <p className="text-xs font-semibold text-slate-500">Vitesse Machine</p>
                {machineSpeed !== null && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-600">
                    Flux x{playbackRate}
                  </span>
                )}
              </div>
              <h2 className="text-3xl font-black text-slate-900 mt-3">
                {machineSpeed !== null ? (
                  <>
                    {machineSpeed} <span className="text-sm font-semibold text-slate-400">RPM</span>
                  </>
                ) : (
                  '—'
                )}
              </h2>
              <p className="text-[11px] text-slate-400 mt-3">Détection cinématique IA</p>
            </div>

            {/* 2. Température */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs">
              <div className="flex justify-between items-center">
                <p className="text-xs font-semibold text-slate-500">Température</p>
                {temperature !== null && temperature > 70 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-600">
                    Élevée
                  </span>
                )}
              </div>
              <h2 className={`text-3xl font-black mt-3 ${
                temperature !== null && temperature > 70 ? 'text-red-600' : 'text-slate-900'
              }`}>
                {temperature !== null ? (
                  <>
                    {temperature.toFixed(1)} <span className="text-sm font-semibold text-slate-400">°C</span>
                  </>
                ) : (
                  '—'
                )}
              </h2>
              <p className="text-[11px] text-slate-400 mt-3">Corrélation thermique directe</p>
            </div>

            {/* 3. Pression Hydraulique */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">Pression Machine</p>
              <h2 className={`text-3xl font-black mt-3 ${
                pressure !== null && pressure > 6.2 ? 'text-amber-600' : 'text-slate-900'
              }`}>
                {pressure !== null ? (
                  <>
                    {pressure.toFixed(2)} <span className="text-sm font-semibold text-slate-400">Bar</span>
                  </>
                ) : (
                  '—'
                )}
              </h2>
              <p className="text-[11px] text-slate-400 mt-3">Déduction physico-mathématique</p>
            </div>

            {/* 4. État de la Machine */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs">
              <div className="flex justify-between items-center">
                <p className="text-xs font-semibold text-slate-500">État des Machines</p>
                {machineHealth !== null && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 ${healthInfo.subColor}`}>
                    {healthInfo.status}
                  </span>
                )}
              </div>
              <h2 className={`text-2xl font-extrabold mt-3 ${healthInfo.color}`}>
                {healthInfo.label}
              </h2>
              <p className="text-[11px] text-slate-400 mt-3">Indice de santé opérationnelle</p>
            </div>
          </section>

          {/* الصف الثالث: الفيديو على اليسار + اللوغ التقني على اليمين (نفس التصميم الأصلي) */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* INTERFACE DE VISION ARTIFICIELLE */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden flex flex-col">
              {/* الخط المتدرج الأزرق/البنفسجي الفوق */}
              <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

              <div className="p-6 flex-1 flex flex-col">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600 font-bold text-sm">[ ]</span>
                    <h3 className="text-xs font-extrabold tracking-wider text-slate-800 uppercase">
                      INTERFACE DE VISION ARTIFICIELLE
                    </h3>
                  </div>

                  {/* أزرار التحكم في سرعة الفيديو والمحاكاة */}
                  {videoUrl && !isAnalyzing && (
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                      <span className="text-[11px] font-semibold text-slate-500 px-2">Vitesse :</span>
                      {[0.5, 1, 1.5, 2, 3].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => changeVideoSpeed(rate)}
                          className={`px-2.5 py-1 rounded-md text-xs font-bold transition ${
                            playbackRate === rate
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          x{rate}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* منطقة الفيديو أو الرفع */}
                {!videoUrl ? (
                  <label className="flex-1 min-h-[280px] border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/50 rounded-xl flex flex-col items-center justify-center p-8 cursor-pointer transition">
                    <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-slate-100 flex items-center justify-center text-blue-600 mb-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-slate-800">Uploader la vidéo OIP</p>
                    <p className="text-xs text-slate-400 mt-1">Formats supportés: MP4, WebM</p>
                    <input type="file" accept="video/mp4,video/webm,video/*" onChange={handleVideoUpload} className="hidden" />
                  </label>
                ) : isAnalyzing ? (
                  <div className="flex-1 min-h-[280px] border border-slate-200 bg-slate-50 rounded-xl flex flex-col items-center justify-center p-8">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-sm font-bold text-slate-800">Analyse et calibrage IA du flux vidéo...</p>
                    <p className="text-xs text-slate-500 mt-1">Détection des machines et initialisation des capteurs virtuels</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-slate-200">
                      <video
                        ref={videoRef}
                        src={videoUrl}
                        controls
                        autoPlay
                        loop
                        muted
                        onPlay={() => {
                          setIsPlaying(true);
                          setScannerStatus('Analyse Active');
                          addLog('Lecture vidéo démarrée. Extraction télémétrique en cours.');
                        }}
                        onPause={() => {
                          setIsPlaying(false);
                          setScannerStatus('En pause');
                          addLog('Flux vidéo en pause. Mesures figées.');
                        }}
                        onRateChange={(e) => {
                          const newRate = e.currentTarget.playbackRate;
                          setPlaybackRate(newRate);
                        }}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="flex justify-between items-center pt-1">
                      <span className="text-xs text-slate-500">
                        Synchronisation directe : modifier la vitesse de la vidéo ajuste les paramètres machines.
                      </span>
                      <label className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer">
                        Changer la vidéo
                        <input type="file" accept="video/mp4,video/webm,video/*" onChange={handleVideoUpload} className="hidden" />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* INFORMATIONS TECHNIQUES */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-xs p-6 flex flex-col">
              <h3 className="text-xs font-extrabold tracking-wider text-blue-600 uppercase mb-4">
                INFORMATIONS TECHNIQUES
              </h3>

              <div className="flex-1 min-h-[280px] bg-slate-50 border border-slate-200/80 rounded-xl p-4 font-mono text-xs text-slate-600 overflow-y-auto space-y-1.5">
                {logs.map((log, index) => (
                  <p
                    key={index}
                    className={
                      log.startsWith('//')
                        ? 'text-slate-400'
                        : log.includes('ALERTE')
                        ? 'text-red-600 font-bold'
                        : 'text-slate-700'
                    }
                  >
                    {log}
                  </p>
                ))}
              </div>
            </div>

          </section>

        </div>
      </main>
    </div>
  );
}