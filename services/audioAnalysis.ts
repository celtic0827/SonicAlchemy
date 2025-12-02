
/**
 * Detects BPM (Beats Per Minute) using a robust energy-based algorithm.
 * 
 * Strategy:
 * 1. Low-Pass Filter (150Hz) to isolate Kick/Bass.
 * 2. Find peaks with dynamic threshold.
 * 3. Interval Counting with STRICT range filtering (60-180 BPM).
 * 4. Harmonic correction (doubling/halving) to ensure human-readable tempo.
 */
export const detectBPM = async (audioBuffer: AudioBuffer): Promise<number> => {
  try {
    // 1. Pre-processing: Low-Pass Filter
    // 150Hz captures the "thump" and "click" of the kick better than 120Hz
    const offlineCtx = new OfflineAudioContext(1, audioBuffer.length, audioBuffer.sampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;

    const filter = offlineCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 150; 
    filter.Q.value = 1;

    source.connect(filter);
    filter.connect(offlineCtx.destination);
    source.start(0);

    const renderedBuffer = await offlineCtx.startRendering();
    let data = renderedBuffer.getChannelData(0);
    const sampleRate = renderedBuffer.sampleRate;

    // 2. Find Loudest 30s Window (Optimization)
    const windowSize = 30 * sampleRate; 
    if (data.length > windowSize) {
      let maxEnergy = 0;
      let maxOffset = 0;
      const scanStep = 2 * sampleRate; // Scan every 2 seconds for speed
      
      for (let i = 0; i < data.length - windowSize; i += scanStep) {
          let energy = 0;
          // Sub-sample energy calc
          for (let j = 0; j < windowSize; j += 1000) {
              energy += Math.abs(data[i + j]);
          }
          if (energy > maxEnergy) {
              maxEnergy = energy;
              maxOffset = i;
          }
      }
      data = data.slice(maxOffset, maxOffset + windowSize);
    }

    // 3. Peak Detection
    const peaks: number[] = [];
    const groupSize = Math.floor(sampleRate / 100); // 10ms windows for resolution
    const volumeLevels: number[] = [];

    // Calculate RMS for windows
    for (let i = 0; i < data.length; i += groupSize) {
        let sum = 0;
        for (let j = 0; j < groupSize && i + j < data.length; j++) {
            sum += data[i + j] * data[i + j];
        }
        volumeLevels.push(Math.sqrt(sum / groupSize));
    }

    // Dynamic Threshold
    for (let i = 0; i < volumeLevels.length; i++) {
        const current = volumeLevels[i];
        
        // Look at local neighborhood to determine threshold
        let localSum = 0;
        let count = 0;
        const range = 50; // +/- 0.5s
        
        for (let j = Math.max(0, i - range); j < Math.min(volumeLevels.length, i + range); j++) {
            localSum += volumeLevels[j];
            count++;
        }
        const localAvg = localSum / count;

        // Peak definition: Significantly higher than local average
        if (current > localAvg * 1.3) {
            // Must be local max
            if (
                (i === 0 || current >= volumeLevels[i-1]) &&
                (i === volumeLevels.length - 1 || current >= volumeLevels[i+1])
            ) {
                 // Debounce: Don't allow peaks too close (within 0.2s = 300bpm)
                 const time = (i * groupSize) / sampleRate;
                 if (peaks.length === 0 || time - peaks[peaks.length - 1] > 0.2) {
                     peaks.push(time);
                 }
            }
        }
    }

    // 4. Interval Analysis (Strict Range)
    const intervals: number[] = [];
    
    // Compare each peak to next few peaks
    peaks.forEach((peakTime, index) => {
        for (let i = 1; i < 5; i++) { // Check next 5 peaks
            const nextPeak = peaks[index + i];
            if (!nextPeak) break;
            const interval = nextPeak - peakTime;
            
            // STRICT FILTER: Only accept intervals that correspond to 60-180 BPM
            // 60 BPM = 1s, 180 BPM = 0.33s
            if (interval >= 0.33 && interval <= 1.0) {
                intervals.push(interval);
            }
        }
    });

    if (intervals.length === 0) return 0;

    // 5. Histogram
    const histogram: Record<number, number> = {};
    intervals.forEach(interval => {
        let bpm = Math.round(60 / interval);
        // Soft quantization to group 120.1 and 119.9 together
        // We'll just round to integer, histogram handles counts
        histogram[bpm] = (histogram[bpm] || 0) + 1;
        // Also add weight to neighbors to smooth out jitter
        histogram[bpm-1] = (histogram[bpm-1] || 0) + 0.25;
        histogram[bpm+1] = (histogram[bpm+1] || 0) + 0.25;
    });

    let candidates = Object.keys(histogram).map(Number).sort((a,b) => histogram[b] - histogram[a]);
    let bestBpm = candidates[0];

    // 6. Post-Processing & Clamp
    // Fix Halftime/Doubletime errors
    
    // Heuristic: Users usually prefer 70-160. 
    // If we detected 140, but 70 has significant votes, check ratio.
    
    // Force into range 70 - 180
    while (bestBpm < 70) {
        bestBpm *= 2;
    }
    while (bestBpm > 185) {
        bestBpm /= 2;
    }

    return Math.round(bestBpm);

  } catch (e) {
    console.error("BPM Detection Error", e);
    return 0;
  }
};
