'use client';

import React, { useState, useEffect, useRef } from 'react';

// إعدادات EmailJS الحقيقية + نظام الطوارئ
const EMAILJS_SERVICE_ID = 'service_7fm4xri';
const EMAILJS_TEMPLATE_ID = 'template_6i9sdti';
const EMAILJS_PUBLIC_KEY = 'IScusL6sweHOdmQ0Y';
const ALERT_EMAIL = 'akarbal01@gmail.com';

interface AlarmItem {
  heure: string;
  equipement: string;
  message: string;
  severite: 'Élevée' | 'Moyenne';
}

export default function OIPProductionDashboard() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'generale' | 'production'>('generale');

  // Valeurs
  const [boxes, setBoxes] = useState<number>(842);
  const [speedMs, setSpeedMs] = useState<number>(0.45);
  const [temperature, setTemperature] = useState<number>(62.4);
  const [vibration, setVibration] = useState<number>(2.8);
  const [pressure, setPressure] = useState<number>(6.0);
  const [machineHealth, setMachineHealth] = useState<number>(99.2); // الحالة اللي طلبتي نرجع

  const [selectedRange, setSelectedRange] = useState<'1h' | '6h' | '12h' | '24h'>('1h');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [fps, setFps] = useState<number>(12);

  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'fallback'>('idle');
  const alertSentRef = useRef<boolean>(false);
  
  const tempRef = useRef<number>(62.4);
  const healthRef = useRef<number>(99.2);
  const boxesRef = useRef<number>(842);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [alarms, setAlarms] = useState<AlarmItem[]>([
    { heure: '18:42', equipement: 'Température', message: 'Température élevée (62.4°C)', severite: 'Élevée' },
    { heure: '18:31', equipement: 'Vibration', message: 'Vibration anormale (2.8 mm/s)', severite: 'Moyenne' },
    { heure: '18:15', equipement: 'Pression', message: 'Pression basse (5.8 bar)', severite: 'Moyenne' },
    { heure: '17:58', equipement: 'Convoyeur', message: "Arrêt d'urgence activé", severite: 'Élevée' },
  ]);

  // دالة إرسال الإيميل الأوتوماتيكي
  const triggerAlertEmail = async (
    currTemp: number,
    currPress: number,
    currVib: number,
    currSpeed: number,
    currHealth: number
  ) => {
    setEmailStatus('sending');
    const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    setAlarms((prev) => [
      {
        heure: nowTime,
        equipement: 'Système IA',
        message: `Seuil dépassé: Temp ${currTemp.toFixed(1)}°C, État ${currHealth.toFixed(1)}%`,
        severite: 'Élevée',
      },
      ...prev.slice(0, 3),
    ]);

    try {
      const payload = {
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: {
          to_email: ALERT_EMAIL,
          temperature: currTemp.toFixed(1),
          pression: currPress.toFixed(2),
          etat: currHealth.toFixed(1),
          vitesse: `${currSpeed.toFixed(2)} m/s`,
          horodatage: new Date().toLocaleString('fr-FR'),
          name: 'OIP Industry Supervision',
          email: ALERT_EMAIL,
          message: `ALERTE CRITIQUE OIP : Temp=${currTemp.toFixed(1)}°C, Pression=${currPress.toFixed(2)} bar, Santé=${currHealth.toFixed(1)}%`,
        },
      };

      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setEmailStatus('sent');
      } else {
        throw new Error('API bloquée');
      }
    } catch {
      setEmailStatus('fallback');
      const subject = encodeURIComponent('⚠️ ALERTE CRITIQUE OIP : Seuils machines dépassés');
      const body = encodeURIComponent(
        `ALERTE SYSTÈME - OIP INDUSTRY (SUPERVISION DE PRODUCTION)\n\n` +
          `Les paramètres critiques de l'installation ont dépassé les seuils :\n` +
          `- Température machine : ${currTemp.toFixed(1)} °C (Seuil > 65.0 °C)\n` +
          `- Pression : ${currPress.toFixed(2)} bar (Seuil > 6.00 bar)\n` +
          `- État (Santé) : ${currHealth.toFixed(1)} %\n` +
          `- Vitesse du convoyeur : ${currSpeed.toFixed(2)} m/s (Flux x${playbackRate})\n\n` +
          `Horodatage : ${new Date().toLocaleString('fr-FR')}\n` +
          `Action requise : Intervention immédiate sur le convoyeur.`
      );
      window.open(`mailto:${ALERT_EMAIL}?subject=${subject}&body=${body}`, '_blank');
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setIsPlaying(true);
    setPlaybackRate(1);
    alertSentRef.current = false;
    setEmailStatus('idle');
  };

  const changeSpeed = (rate: number) => {
    setPlaybackRate(rate);
    setIsPlaying(true);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      videoRef.current.play().catch(() => {});
    }
  };

  // محاكاة فيزيائية 
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const jitter = (Math.random() - 0.5) * 0.02;
      const nextSpeed = Number(Math.max(0.2, 0.45 * playbackRate + jitter).toFixed(2));

      const targetTemp = playbackRate <= 1 ? 62.4 : 62.4 + (playbackRate - 1) * 14.5;
      const currT = tempRef.current;
      const nextTemp = Number((currT + (targetTemp - currT) * 0.28 + (Math.random() - 0.5) * 0.3).toFixed(1));
      tempRef.current = nextTemp;

      const nextVib = Number(Math.max(1.2, 2.8 * (0.7 + 0.3 * playbackRate) + (Math.random() - 0.5) * 0.2).toFixed(1));
      const nextPress = Number(Math.max(4.5, 6.0 + (playbackRate - 1) * 1.15 + (nextTemp - 62.4) * 0.04).toFixed(2));

      // حساب صحة الماكينة
      const currHealth = healthRef.current;
      let nextHealth = currHealth;
      if (playbackRate >= 2 || nextTemp > 65 || nextPress > 6.0) {
        nextHealth = Math.max(15.0, currHealth - (playbackRate >= 3 ? 3.5 : 2.2));
      } else if (playbackRate <= 1 && nextTemp < 64 && currHealth < 99.0) {
        nextHealth = Math.min(99.2, currHealth + 0.8);
      }
      healthRef.current = nextHealth;

      setSpeedMs(nextSpeed);
      setTemperature(nextTemp);
      setVibration(nextVib);
      setPressure(nextPress);
      setMachineHealth(nextHealth);
      setFps(Math.round(12 * Math.min(2, playbackRate)));

      if (Math.random() < 0.45 * playbackRate) {
        boxesRef.current += 1;
        setBoxes(boxesRef.current);
      }

      if (nextTemp > 65.0 && nextPress > 6.0 && !alertSentRef.current) {
        alertSentRef.current = true;
        triggerAlertEmail(nextTemp, nextPress, nextVib, nextSpeed, nextHealth);
      }

      if (nextTemp < 64.0 && nextPress <= 6.05 && alertSentRef.current) {
        alertSentRef.current = false;
        setEmailStatus('idle');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, playbackRate]);

  const getHealthBadge = () => {
    if (machineHealth >= 80) return { label: `${machineHealth.toFixed(1)} %`, color: 'text-emerald-400', icon: 'text-emerald-400' };
    if (machineHealth >= 50) return { label: `${machineHealth.toFixed(1)} %`, color: 'text-amber-400', icon: 'text-amber-400' };
    return { label: `${machineHealth.toFixed(1)} %`, color: 'text-red-400', icon: 'text-red-400' };
  };
  const healthInfo = getHealthBadge();

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-100 flex font-sans select-none overflow-x-hidden">
      {/* ================= SIDEBAR ================= */}
      <aside className="w-56 bg-[#0d1526] border-r border-[#1e2d4a] flex flex-col justify-between shrink-0 relative">
        <div>
          {/* Logo */}
          <div className="px-5 py-5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2563eb] flex items-center justify-center shadow-md shadow-blue-600/30">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 21h18v-2H3v2zm0-4h18v-6l-4 3v-3l-4 3V9H3v8zm2-6h6v4H5v-4z" />
              </svg>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black tracking-wide text-white">OIP</span>
              <span className="text-xs font-semibold tracking-widest text-slate-400">INDUSTRY</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="px-3 mt-2 space-y-1">
            {/* Vue générale (Tab 1) */}
            <div 
              onClick={() => setActiveTab('generale')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                activeTab === 'generale' ? 'bg-[#2563eb] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-[#152036]'
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              <span>Vue générale</span>
            </div>

            {/* Production / Courbe (Tab 2) */}
            <div 
              onClick={() => setActiveTab('production')}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                activeTab === 'production' ? 'bg-[#2563eb] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-[#152036]'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span>Production (Courbe)</span>
            </div>

            {/* Other inactive links */}
            <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#152036] text-xs font-medium cursor-pointer transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              <span>Machines</span>
            </div>

            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#152036] text-xs font-medium cursor-pointer transition">
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span>Alarmes</span>
              </div>
              <span className="w-4 h-4 rounded-full bg-red-600 text-[10px] font-bold text-white flex items-center justify-center">2</span>
            </div>
          </nav>
        </div>

        {/* Bottom Status */}
        <div className="p-4 border-t border-[#1e2d4a]/60">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-[11px] font-medium text-slate-300">Connexion OIP</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">26/10/2026 19:00</p>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 p-5 space-y-4 overflow-y-auto">
        {/* Top Header */}
        <header className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-widest text-[#38bdf8] uppercase">
              TABLEAU DE BORD - OPEN INDUSTRY PROJECT
            </p>
            <h1 className="text-2xl font-bold text-white mt-0.5">Supervision de production</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Suivi en temps réel des machines et des paramètres de l&apos;installation.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {emailStatus === 'sending' && (
              <span className="px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-semibold animate-pulse">
                Envoi alerte email...
              </span>
            )}
            {(emailStatus === 'sent' || emailStatus === 'fallback') && (
              <span className="px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-[11px] font-semibold">
                📩 Alerte transmise ({ALERT_EMAIL})
              </span>
            )}

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0d3b2e] border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Système en ligne
            </div>
          </div>
        </header>

        {/* ================= 6 KPI CARDS ================= */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          {/* Card 1: Production */}
          <div className="bg-[#131d31] border border-[#1e2d4a] rounded-xl p-4 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Production</p>
              <h2 className="text-xl font-bold text-white mt-0.5">{boxes}</h2>
            </div>
          </div>

          {/* Card 2: Vitesse */}
          <div className="bg-[#131d31] border border-[#1e2d4a] rounded-xl p-4 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Vitesse</p>
              <h2 className="text-xl font-bold text-white mt-0.5">{speedMs.toFixed(2)} m/s</h2>
            </div>
          </div>

          {/* Card 3: Température */}
          <div className="bg-[#131d31] border border-[#1e2d4a] rounded-xl p-4 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0 mt-0.5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Température</p>
              <h2 className={`text-xl font-bold mt-0.5 ${temperature > 65 ? 'text-red-400' : 'text-white'}`}>{temperature.toFixed(1)} °C</h2>
            </div>
          </div>

          {/* Card 4: Vibration */}
          <div className="bg-[#131d31] border border-[#1e2d4a] rounded-xl p-4 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 12h2l2-5 4 10 4-10 2 5h2" /></svg>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Vibration</p>
              <h2 className="text-xl font-bold text-white mt-0.5">{vibration.toFixed(1)} mm/s</h2>
            </div>
          </div>

          {/* Card 5: Pression */}
          <div className="bg-[#131d31] border border-[#1e2d4a] rounded-xl p-4 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Pression</p>
              <h2 className={`text-xl font-bold mt-0.5 ${pressure > 6.05 ? 'text-amber-400' : 'text-white'}`}>{pressure.toFixed(2)} bar</h2>
            </div>
          </div>

          {/* Card 6: Santé Machine (الطلب الرابع: نسبة صحة الماكينة) */}
          <div className="bg-[#131d31] border border-[#1e2d4a] rounded-xl p-4 flex items-start gap-3.5">
            <div className={`w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5 ${healthInfo.icon}`}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Santé Machine</p>
              <h2 className={`text-xl font-bold mt-0.5 ${healthInfo.color}`}>{healthInfo.label}</h2>
            </div>
          </div>
        </section>

        {/* ================= CONDITIONAL VIEWS ================= */}
        {activeTab === 'generale' && (
          <div className="space-y-4">
            {/* 1. Vision artificielle (كبيرة وعريضة - الطلب الثاني) */}
            <section className="bg-[#131d31] border border-[#1e2d4a] rounded-xl p-4 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm">📹</span>
                  <h3 className="text-sm font-bold text-white">Vision artificielle (Analyse en direct)</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
                  En temps réel
                </span>
              </div>

              {/* Viewport : كبرنا الطول والعرض باش الفيديو يبان واعر */}
              <div className="relative rounded-lg overflow-hidden bg-[#000] border border-[#1e2d4a] h-[400px] w-full flex items-center justify-center group">
                {videoUrl ? (
                  <video ref={videoRef} src={videoUrl} autoPlay loop muted playsInline className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full relative bg-gradient-to-b from-[#1a2436] via-[#111827] to-[#090d16] flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 opacity-35 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"></div>
                    <div className="absolute bottom-0 w-full h-28 bg-gradient-to-t from-[#1e293b] to-[#334155] transform -skew-x-12 border-t-2 border-slate-500/40 flex flex-col justify-around py-1">
                      <div className="w-full h-1.5 bg-slate-900/60"></div>
                      <div className="w-full h-1.5 bg-slate-900/60"></div>
                      <div className="w-full h-1.5 bg-slate-900/60"></div>
                    </div>
                    <div className="relative z-10 w-32 h-28 bg-gradient-to-br from-[#d99b66] to-[#a66c38] rounded-xs shadow-2xl border border-[#e6b383]/50 flex flex-col justify-between p-1.5">
                      <div className="w-full h-4 bg-[#c4834d] border-b border-[#8c5222]/60"></div>
                      <div className="w-8 h-4 bg-white/80 rounded-2xs self-end mr-1 mb-1"></div>
                    </div>
                  </div>
                )}

                <div className="absolute z-20 w-40 h-36 border-2 border-emerald-400 rounded-xs pointer-events-none flex items-start">
                  <span className="-mt-6 -ml-0.5 px-2 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded-t-xs shadow">
                    Boîte détectée
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 z-30 flex items-center justify-between bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-2">
                    {[1, 1.5, 2, 3].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => changeSpeed(rate)}
                        className={`px-3 py-1 rounded text-[11px] font-bold transition ${
                          playbackRate === rate && isPlaying ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white bg-slate-800'
                        }`}
                      >
                        x{rate}
                      </button>
                    ))}
                  </div>
                  <label className="text-[11px] font-bold text-blue-400 hover:text-blue-300 cursor-pointer bg-blue-500/10 px-3 py-1 rounded-md border border-blue-500/30">
                    + Uploader Vidéo
                    <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 text-[12px]">
                <div className="flex items-center gap-2 text-slate-300 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  <span>Détection 100% Opérationnelle</span>
                </div>
                <span className="text-slate-400 font-mono font-bold">FPS : {fps}</span>
              </div>
            </section>

            {/* 2. État des machines & Alarmes */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-6 bg-[#131d31] border border-[#1e2d4a] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3.5">
                  <span className="w-5 h-5 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">⚙️</span>
                  <h3 className="text-xs font-bold text-white">État des machines</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { name: 'Convoyeur', active: true, icon: '➾' },
                    { name: 'Diverter', active: false, icon: '✥' },
                    { name: 'Robot 6 axes', active: true, icon: '🦾' },
                    { name: 'Box Spawner', active: true, icon: '📦' },
                    { name: 'AGV', active: true, icon: '🚜' },
                    { name: 'Pallet Spawner', active: true, icon: '▦' },
                  ].map((m, idx) => (
                    <div key={idx} className="bg-[#10192b] border border-[#1e2d4a]/80 rounded-lg px-3.5 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-slate-300 text-sm">{m.icon}</span>
                        <span className="text-xs font-semibold text-slate-200">{m.name}</span>
                      </div>
                      {m.active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0d3b2e] border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>En marche
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>À l&apos;arrêt
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-6 bg-[#131d31] border border-[#1e2d4a] rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-red-500/20 text-red-400 flex items-center justify-center text-xs">🔔</span>
                    <h3 className="text-xs font-bold text-white">Dernières alarmes</h3>
                  </div>
                  <span className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 cursor-pointer">Voir tout →</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#1e2d4a] text-[10px] text-slate-400">
                        <th className="pb-2 font-medium">Heure</th>
                        <th className="pb-2 font-medium">Équipement</th>
                        <th className="pb-2 font-medium">Message</th>
                        <th className="pb-2 font-medium text-right">Sévérité</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e2d4a]/50 text-xs">
                      {alarms.map((al, i) => (
                        <tr key={i} className="hover:bg-[#152036]/60 transition">
                          <td className="py-2.5 text-slate-400 font-mono text-[11px]">{al.heure}</td>
                          <td className="py-2.5 text-slate-200 font-medium">{al.equipement}</td>
                          <td className="py-2.5 text-slate-300 text-[11px]">{al.message}</td>
                          <td className="py-2.5 text-right">
                            {al.severite === 'Élevée' ? (
                              <span className="inline-block px-2.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-bold">Élevée</span>
                            ) : (
                              <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-bold">Moyenne</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ================= PAGE "PRODUCTION" (المبيان بوحدو فصفحة - الطلب الثالث) ================= */}
        {activeTab === 'production' && (
          <section className="bg-[#131d31] border border-[#1e2d4a] rounded-xl p-5 flex flex-col w-full h-[550px]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm">📈</span>
                <h3 className="text-sm font-bold text-white">Courbe de production et paramètres machines détaillés</h3>
              </div>
              <div className="flex items-center gap-1 bg-[#0b1120] p-1 rounded-lg border border-[#1e2d4a]">
                {(['1h', '6h', '12h', '24h'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedRange(t)}
                    className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
                      selectedRange === t ? 'bg-[#2563eb] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Multi-Axis SVG Chart (كبير فصفحتو) */}
            <div className="relative w-full flex-1">
              <svg className="w-full h-full" viewBox="0 0 620 220" preserveAspectRatio="none">
                <text x="10" y="14" fill="#94a3b8" fontSize="9" fontWeight="600">Production (boîtes)</text>
                <text x="435" y="14" fill="#10b981" fontSize="8" fontWeight="600">Vitesse (m/s)</text>
                <text x="495" y="14" fill="#f97316" fontSize="8" fontWeight="600">Temp (°C)</text>
                <text x="548" y="14" fill="#3b82f6" fontSize="8" fontWeight="600">Pression (bar)</text>

                {[
                  { y: 30, label: '1000' }, { y: 62, label: '800' }, { y: 94, label: '600' },
                  { y: 126, label: '400' }, { y: 158, label: '200' }, { y: 190, label: '0' },
                ].map((row, idx) => (
                  <g key={idx}>
                    <text x="28" y={row.y + 3} fill="#64748b" fontSize="8" textAnchor="end">{row.label}</text>
                    <line x1="36" y1={row.y} x2="430" y2={row.y} stroke="#1e293b" strokeWidth="1" />
                  </g>
                ))}

                {[
                  { x: 45, t: '18:00' }, { x: 108, t: '18:10' }, { x: 171, t: '18:20' },
                  { x: 234, t: '18:30' }, { x: 297, t: '18:40' }, { x: 360, t: '18:50' }, { x: 420, t: '19:00' },
                ].map((col, idx) => (
                  <text key={idx} x={col.x} y="206" fill="#64748b" fontSize="8" textAnchor="middle">{col.t}</text>
                ))}

                <polyline fill="none" stroke="#3b82f6" strokeWidth="2.5" points="45,122 108,105 171,103 234,104 297,92 360,78 420,65" />
                {[[45, 122], [108, 105], [171, 103], [234, 104], [297, 92], [360, 78], [420, 65]].map(([cx, cy], i) => (
                  <circle key={`b-${i}`} cx={cx} cy={cy} r="3" fill="#3b82f6" />
                ))}

                <polyline fill="none" stroke="#10b981" strokeWidth="2.5" points="45,134 108,125 171,123 234,125 297,118 360,112 420,105" />
                {[[45, 134], [108, 125], [171, 123], [234, 125], [297, 118], [360, 112], [420, 105]].map(([cx, cy], i) => (
                  <circle key={`g-${i}`} cx={cx} cy={cy} r="3" fill="#10b981" />
                ))}

                <polyline fill="none" stroke="#f97316" strokeWidth="2.5" points="45,152 108,150 171,134 234,137 297,131 360,127 420,119" />
                {[[45, 152], [108, 150], [171, 134], [234, 137], [297, 131], [360, 127], [420, 119]].map(([cx, cy], i) => (
                  <circle key={`o-${i}`} cx={cx} cy={cy} r="3" fill="#f97316" />
                ))}

                <polyline fill="none" stroke="#0ea5e9" strokeWidth="2.5" points="45,159 108,158 171,158 234,158 297,151 360,151 420,151" />
                {[[45, 159], [108, 158], [171, 158], [234, 158], [297, 151], [360, 151], [420, 151]].map(([cx, cy], i) => (
                  <circle key={`c-${i}`} cx={cx} cy={cy} r="3" fill="#0ea5e9" />
                ))}

                <line x1="455" y1="26" x2="455" y2="190" stroke="#10b981" strokeWidth="1.5" />
                {[{ y: 32, v: '0.8' }, { y: 72, v: '0.6' }, { y: 112, v: '0.4' }, { y: 152, v: '0.2' }, { y: 190, v: '0.0' }].map((a, i) => (
                  <text key={i} x="460" y={a.y} fill="#10b981" fontSize="9" fontWeight="500">{a.v}</text>
                ))}

                <line x1="508" y1="26" x2="508" y2="190" stroke="#f97316" strokeWidth="1.5" />
                {[{ y: 32, v: '80' }, { y: 85, v: '60' }, { y: 138, v: '40' }, { y: 190, v: '20' }].map((a, i) => (
                  <text key={i} x="513" y={a.y} fill="#f97316" fontSize="9" fontWeight="500">{a.v}</text>
                ))}

                <line x1="560" y1="26" x2="560" y2="190" stroke="#3b82f6" strokeWidth="1.5" />
                {[{ y: 32, v: '8' }, { y: 72, v: '6' }, { y: 112, v: '4' }, { y: 152, v: '2' }, { y: 190, v: '0' }].map((a, i) => (
                  <text key={i} x="565" y={a.y} fill="#3b82f6" fontSize="9" fontWeight="500">{a.v}</text>
                ))}
              </svg>
            </div>

            <div className="flex items-center justify-center gap-8 pt-5 border-t border-[#1e2d4a]/60 text-xs text-slate-300 mt-4">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#3b82f6]"></span><span>Production (boîtes)</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#10b981]"></span><span>Vitesse (m/s)</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#f97316]"></span><span>Température (°C)</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#0ea5e9]"></span><span>Pression (bar)</span></div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}