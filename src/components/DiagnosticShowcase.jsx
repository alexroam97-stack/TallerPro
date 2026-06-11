import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, Cpu, ShieldAlert, CheckCircle, Radio } from 'lucide-react';

export default function DiagnosticShowcase() {
  const [stage, setStage] = useState('scanning'); // 'scanning', 'complete'
  const [progress, setProgress] = useState(0);
  const [rpm, setRpm] = useState(800);
  const [temp, setTemp] = useState(45);
  const [voltage, setVoltage] = useState(12.4);
  const [errorCode, setErrorCode] = useState('SCANNING...');

  const startScan = () => {
    setStage('scanning');
    setProgress(0);
    setErrorCode('SCANNING...');
    setVoltage(12.4);
    
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 2;
      if (currentProgress >= 100) {
        currentProgress = 100;
        setStage('complete');
        setErrorCode('NO DTC CODES FOUND');
        setVoltage(14.2); // battery alternator active
        clearInterval(interval);
      }
      setProgress(currentProgress);

      // Simulate vehicle telemetry dynamics
      if (currentProgress < 30) {
        setRpm(1200 + Math.floor(Math.random() * 600));
        setTemp(45 + Math.floor(currentProgress * 0.8));
      } else if (currentProgress < 75) {
        setRpm(3800 + Math.floor(Math.random() * 800)); // peak acceleration check
        setTemp(65 + Math.floor((currentProgress - 30) * 0.5));
      } else if (currentProgress < 95) {
        setRpm(2100 + Math.floor(Math.random() * 300));
        setTemp(82 + Math.floor((currentProgress - 75) * 0.3));
      } else {
        setRpm(1200); // stable idle at completion
        setTemp(88); // operating temperature
      }
    }, 80);
  };

  useEffect(() => {
    startScan();
  }, []);

  // Calculate circular dasharray offset for gauge
  const maxRpm = 6000;
  const radius = 55;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(rpm, maxRpm) / maxRpm) * circumference;

  return (
    <div className="relative rounded-[2.5rem] border border-white/10 bg-black/50 p-6 shadow-ui overflow-hidden max-w-4xl mx-auto backdrop-blur-md">
      {/* High-tech metal bracket corner details */}
      <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-accent-primary/40" />
      <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-accent-primary/40" />
      <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-accent-primary/40" />
      <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-accent-primary/40" />

      {/* Grid Pattern overlay inside video frame */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

      {/* Header section of dashboard */}
      <header className="flex flex-wrap justify-between items-center pb-4 mb-6 border-b border-white/5 relative z-10">
        <div className="flex items-center gap-3">
          <Radio className={`w-4 h-4 ${stage === 'scanning' ? 'text-accent-primary animate-pulse' : 'text-accent-success'}`} />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            TallerPro OBD-II Diagnostic Scan Terminal
          </span>
        </div>
        
        <div className="flex items-center gap-4 mt-2 sm:mt-0">
          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${stage === 'scanning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-accent-success/10 text-accent-success border border-accent-success/20'}`}>
            {stage === 'scanning' ? 'Escaneando...' : 'Escaneo Completado'}
          </span>
          {stage === 'complete' && (
            <button
              onClick={startScan}
              className="p-1.5 rounded-lg border border-white/10 hover:border-accent-primary hover:text-accent-primary text-gray-400 transition-colors flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider cursor-pointer"
              title="Reiniciar Simulación"
            >
              <RotateCcw size={12} />
              Re-Escanear
            </button>
          )}
        </div>
      </header>

      {/* Main telemetry grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        
        {/* Tachometer gauge column */}
        <div className="flex flex-col items-center justify-center p-4 bg-white/5 border border-white/5 rounded-2xl relative overflow-hidden">
          <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider mb-2">Tachometer (RPM)</span>
          
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              {/* Dial background track */}
              <circle
                cx="72"
                cy="72"
                r={radius}
                fill="transparent"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="8"
                className="translate-x-1 translate-y-1"
              />
              {/* Dial active track */}
              <circle
                cx="72"
                cy="72"
                r={radius}
                fill="transparent"
                stroke={stage === 'scanning' ? '#00f2ff' : '#00ff88'}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="translate-x-1 translate-y-1 transition-all duration-100 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-3xl font-black font-mono tracking-tight text-white block">
                {rpm.toLocaleString()}
              </span>
              <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-0.5 block">RPM</span>
            </div>
          </div>
        </div>

        {/* Oscilloscope column */}
        <div className="md:col-span-2 flex flex-col justify-between p-4 bg-white/5 border border-white/5 rounded-2xl h-44 md:h-auto">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider">Combustion Oscilloscope (Cylinder-1)</span>
            <span className="text-[9px] font-mono text-accent-primary">CH1: 200mV / 5ms</span>
          </div>

          {/* Oscilloscope canvas path drawing */}
          <div className="flex-1 border border-white/5 rounded-xl bg-black/40 overflow-hidden relative flex items-center">
            <svg className="w-full h-24" viewBox="0 0 500 100" preserveAspectRatio="none">
              {/* Grid lines inside oscilloscope */}
              <line x1="0" y1="50" x2="500" y2="50" stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="5,5" />
              <line x1="250" y1="0" x2="250" y2="100" stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="5,5" />
              
              {/* Simulated diagnostic waves */}
              <path
                d={stage === 'scanning' 
                  ? `M 0 50 Q 50 10, 100 80 T 200 20 T 300 90 T 400 30 T 500 50` 
                  : `M 0 50 L 50 50 L 100 20 L 110 80 L 120 40 L 130 60 L 140 50 L 300 50 L 350 20 L 360 85 L 370 35 L 380 65 L 390 50 L 500 50`
                }
                fill="none"
                stroke={stage === 'scanning' ? '#00f2ff' : '#00ff88'}
                strokeWidth="2.5"
                className={stage === 'scanning' ? 'animate-[wave-distort_0.5s_linear_infinite]' : ''}
              />
            </svg>
            
            {/* Real-time scanning noise overlay */}
            {stage === 'scanning' && (
              <div className="absolute inset-0 bg-accent-primary/5 animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* Lower telemetry readouts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 relative z-10">
        <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
          <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider block">Coolant Temp</span>
          <span className="text-xl font-black font-mono text-white mt-1 block">{temp}°C</span>
        </div>
        <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
          <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider block">OBD Voltage</span>
          <span className="text-xl font-black font-mono text-white mt-1 block">{voltage}V</span>
        </div>
        <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
          <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider block">Oxygen Sensor</span>
          <span className="text-xl font-black font-mono text-accent-primary mt-1 block">0.82V</span>
        </div>
        <div className="p-3 bg-white/5 border border-white/5 rounded-xl col-span-2 md:col-span-1">
          <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider block">Diagnostic DTC</span>
          <span className={`text-xs font-black font-mono mt-1.5 block truncate uppercase ${stage === 'scanning' ? 'text-amber-400' : 'text-accent-success'}`}>
            {errorCode}
          </span>
        </div>
      </div>

      {/* Scanning status and progress bar */}
      <footer className="mt-6 pt-4 border-t border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div className="flex-1 max-w-xl">
          <div className="flex justify-between items-center text-[9px] font-black uppercase text-gray-500 tracking-wider mb-1.5">
            <span>Scan Telemetry Pipeline</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/10 p-0.5">
            <div 
              className={`h-full rounded-full transition-all duration-75 ${stage === 'scanning' ? 'bg-gradient-to-r from-accent-primary to-accent-secondary' : 'bg-accent-success'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {stage === 'scanning' ? (
            <>
              <div className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
              <span className="text-xs font-black text-amber-500 uppercase tracking-widest">Checking Sensors...</span>
            </>
          ) : (
            <>
              <CheckCircle className="text-accent-success animate-bounce" size={18} />
              <span className="text-xs font-black text-accent-success uppercase tracking-widest">System Secure</span>
            </>
          )}
        </div>
      </footer>

      {/* Oscilloscope wave distortion animations */}
      <style>{`
        @keyframes wave-distort {
          0% { transform: scaleY(0.9) translateY(-1px); }
          50% { transform: scaleY(1.2) translateY(2px); }
          100% { transform: scaleY(0.9) translateY(-1px); }
        }
      `}</style>
    </div>
  );
}
