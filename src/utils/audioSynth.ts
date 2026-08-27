// Focus Audio Synthesizer utilizing Web Audio API for Zero-Latency, Offline Lo-Fi & White Noise

export type FocusSoundType = 'lofi' | 'white_noise' | 'brown_noise' | 'rain' | 'cafe' | 'alpha_waves';

class FocusAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying = false;
  private currentType: FocusSoundType = 'lofi';
  private volume = 0.5;
  private activeNodes: { stop?: () => void; disconnect?: () => void }[] = [];
  private intervalId: number | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentType(): FocusSoundType {
    return this.currentType;
  }

  public stop() {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.activeNodes.forEach(node => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch {
        // ignore cleanup errors
      }
    });
    this.activeNodes = [];
    this.isPlaying = false;
  }

  public play(type: FocusSoundType = 'lofi') {
    this.stop();
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    this.currentType = type;
    this.isPlaying = true;

    switch (type) {
      case 'white_noise':
        this.startWhiteNoise();
        break;
      case 'brown_noise':
        this.startBrownNoise();
        break;
      case 'rain':
        this.startRainNoise();
        break;
      case 'cafe':
        this.startCafeNoise();
        break;
      case 'alpha_waves':
        this.startAlphaWaves();
        break;
      case 'lofi':
      default:
        this.startLofiBeats();
        break;
    }
  }

  private startWhiteNoise() {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter to make it soft and pleasant for study
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    whiteNoise.start();
    this.activeNodes.push(whiteNoise, gain, filter);
  }

  private startBrownNoise() {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // boost soft brownian
    }

    const brownNoise = this.ctx.createBufferSource();
    brownNoise.buffer = noiseBuffer;
    brownNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);

    brownNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    brownNoise.start();
    this.activeNodes.push(brownNoise, gain, filter);
  }

  private startRainNoise() {
    if (!this.ctx || !this.masterGain) return;
    // Layered pink noise + modulated drops
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11;
      b6 = white * 0.115926;
    }

    const rainSource = this.ctx.createBufferSource();
    rainSource.buffer = noiseBuffer;
    rainSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(850, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);

    rainSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    rainSource.start();
    this.activeNodes.push(rainSource, gain, filter);
  }

  private startCafeNoise() {
    if (!this.ctx || !this.masterGain) return;
    // Cafe ambient: soft background chatter frequencies + warm lowpass brown noise + subtle harmonic resonant pings
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.05 * white) / 1.05;
      lastOut = output[i];
    }

    const cafeSource = this.ctx.createBufferSource();
    cafeSource.buffer = noiseBuffer;
    cafeSource.loop = true;

    // Filter simulating cozy room ambience
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(480, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.28, this.ctx.currentTime);

    // Warm subtle hum
    const humOsc = this.ctx.createOscillator();
    const humGain = this.ctx.createGain();
    humOsc.type = 'sine';
    humOsc.frequency.setValueAtTime(110, this.ctx.currentTime);
    humGain.gain.setValueAtTime(0.02, this.ctx.currentTime);

    cafeSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    humOsc.connect(humGain);
    humGain.connect(this.masterGain);

    cafeSource.start();
    humOsc.start();
    this.activeNodes.push(cafeSource, gain, filter, humOsc, humGain);

    // Soft occasional coffee cup / book page turn ambient tones
    const triggerAmbientPing = () => {
      if (!this.ctx || !this.masterGain || !this.isPlaying || this.currentType !== 'cafe') return;
      const now = this.ctx.currentTime;
      const pingOsc = this.ctx.createOscillator();
      const pingGain = this.ctx.createGain();
      const pingFreqs = [1200, 1480, 1850, 2200];
      const freq = pingFreqs[Math.floor(Math.random() * pingFreqs.length)];
      
      pingOsc.type = 'sine';
      pingOsc.frequency.setValueAtTime(freq, now);
      pingGain.gain.setValueAtTime(0.001, now);
      pingGain.gain.linearRampToValueAtTime(0.015, now + 0.01);
      pingGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      pingOsc.connect(pingGain);
      pingGain.connect(this.masterGain);

      pingOsc.start(now);
      pingOsc.stop(now + 0.4);
    };

    this.intervalId = window.setInterval(triggerAmbientPing, 3500);
  }

  private startAlphaWaves() {
    if (!this.ctx || !this.masterGain) return;
    // 10Hz Alpha binaural carrier (200Hz left, 210Hz right or soft pulsing sine)
    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(216, this.ctx.currentTime); // Deep soothing tone

    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(10, this.ctx.currentTime); // 10 Hz Alpha frequency
    lfoGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);

    lfo.connect(gain.gain);
    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    lfo.start();
    this.activeNodes.push(osc, lfo, lfoGain, gain);
  }

  private startLofiBeats() {
    if (!this.ctx || !this.masterGain) return;

    // Chords: Dm9 -> G13 -> Cmaj9 -> Am7
    const chords = [
      [146.83, 174.61, 220.00, 261.63, 329.63], // Dm9
      [196.00, 246.94, 293.66, 329.63, 392.00], // G13
      [130.81, 164.81, 196.00, 246.94, 293.66], // Cmaj9
      [110.00, 164.81, 220.00, 261.63, 329.63]  // Am7
    ];

    let chordIdx = 0;
    const playNextChord = () => {
      if (!this.ctx || !this.masterGain || !this.isPlaying) return;
      const currentChord = chords[chordIdx];
      chordIdx = (chordIdx + 1) % chords.length;

      const now = this.ctx.currentTime;
      const duration = 4.0;

      // Soft vinyl crackle simulation in background
      currentChord.forEach((freq, i) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const chordGain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = i % 2 === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(650, now);

        chordGain.gain.setValueAtTime(0.001, now);
        chordGain.gain.linearRampToValueAtTime(0.045 / (i + 1), now + 0.8);
        chordGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(filter);
        filter.connect(chordGain);
        chordGain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + duration + 0.1);
      });
    };

    playNextChord();
    this.intervalId = window.setInterval(playNextChord, 4000);
  }
}

export const focusAudio = new FocusAudioEngine();

// Tactile Mechanical Keyboard Click Synthesizer
let keyboardAudioCtx: AudioContext | null = null;
let lastKeySoundTime = 0;

export function playMechanicalKeyClick(key?: string): void {
  try {
    const now = performance.now();
    // Throttle to max 35 clicks/sec to prevent audio glitch on long key hold
    if (now - lastKeySoundTime < 28) return;
    lastKeySoundTime = now;

    if (!keyboardAudioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      keyboardAudioCtx = new AudioCtxClass();
    }

    if (keyboardAudioCtx.state === 'suspended') {
      keyboardAudioCtx.resume();
    }

    const ctx = keyboardAudioCtx;
    const t = ctx.currentTime;

    // Pitch determination based on key type
    let clickFreq = 1900 + (Math.random() * 250 - 125);
    let thudFreq = 180 + (Math.random() * 30 - 15);
    let clickVol = 0.08;

    if (key === ' ' || key === 'Space') {
      clickFreq = 1100 + (Math.random() * 100 - 50);
      thudFreq = 120;
      clickVol = 0.11;
    } else if (key === 'Enter') {
      clickFreq = 1450 + (Math.random() * 100 - 50);
      thudFreq = 150;
      clickVol = 0.10;
    } else if (key === 'Backspace' || key === 'Delete') {
      clickFreq = 1600;
      thudFreq = 160;
      clickVol = 0.09;
    }

    // 1. High-frequency crisp click (tactile switch contact)
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    const clickFilter = ctx.createBiquadFilter();

    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(clickFreq, t);
    clickOsc.frequency.exponentialRampToValueAtTime(clickFreq * 0.4, t + 0.025);

    clickFilter.type = 'bandpass';
    clickFilter.frequency.setValueAtTime(clickFreq, t);
    clickFilter.Q.setValueAtTime(3.0, t);

    clickGain.gain.setValueAtTime(0.001, t);
    clickGain.gain.linearRampToValueAtTime(clickVol, t + 0.002);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.028);

    clickOsc.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(ctx.destination);

    clickOsc.start(t);
    clickOsc.stop(t + 0.03);

    // 2. Low-frequency acoustic bottom-out thud (switch bottoming out)
    const thudOsc = ctx.createOscillator();
    const thudGain = ctx.createGain();
    const thudFilter = ctx.createBiquadFilter();

    thudOsc.type = 'sine';
    thudOsc.frequency.setValueAtTime(thudFreq, t);
    thudOsc.frequency.exponentialRampToValueAtTime(thudFreq * 0.5, t + 0.04);

    thudFilter.type = 'lowpass';
    thudFilter.frequency.setValueAtTime(300, t);

    thudGain.gain.setValueAtTime(0.001, t);
    thudGain.gain.linearRampToValueAtTime(clickVol * 0.7, t + 0.003);
    thudGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);

    thudOsc.connect(thudFilter);
    thudFilter.connect(thudGain);
    thudGain.connect(ctx.destination);

    thudOsc.start(t);
    thudOsc.stop(t + 0.05);
  } catch {
    // Gracefully ignore audio errors if not initialized or user hasn't interacted
  }
}

