
/**
 * Detects BPM (Beats Per Minute) from an AudioBuffer.
 * Uses a threshold-based peak detection algorithm suitable for client-side analysis.
 */
export const detectBPM = async (audioBuffer: AudioBuffer): Promise<number> => {
    try {
      // 1. Create offline context to process data if needed, or just access channel data directly
      // We will look at the first 30 seconds or the whole track if shorter, 
      // focusing on the center to avoid intro silence/buildup.
      
      const channelData = audioBuffer.getChannelData(0); // Use left channel
      const sampleRate = audioBuffer.sampleRate;
      
      // Analyze a 30s slice from the middle of the track for better accuracy
      const sliceDuration = 30;
      const totalDuration = audioBuffer.duration;
      
      let startSample = 0;
      let endSample = channelData.length;
  
      if (totalDuration > sliceDuration) {
        const startTime = (totalDuration - sliceDuration) / 2;
        startSample = Math.floor(startTime * sampleRate);
        endSample = Math.floor((startTime + sliceDuration) * sampleRate);
      }
  
      const sliceData = channelData.slice(startSample, endSample);
      
      // 2. Identify Peaks
      // We divide the audio into small windows and find the max volume in each
      const peaks = getPeaks([sliceData], sampleRate);
      
      // 3. Calculate Intervals between peaks
      const intervals = getIntervals(peaks);
      
      // 4. Group intervals to find the tempo
      const topCandidates = getTempoCandidates(intervals, sampleRate);
      
      // Return the top candidate, or 0 if failed
      return Math.round(topCandidates[0]?.tempo || 0);
  
    } catch (e) {
      console.error("BPM Detection failed", e);
      return 0;
    }
  };
  
  // --- Helpers ---
  
  function getPeaks(data: Float32Array[], sampleRate: number) {
    // What we call a "peak" here is a volume spike above a dynamic threshold
    // To simplify, we'll just check for volume spikes
    
    // We downsample to find peaks easier. 
    // Initial guess: 1 peak every 0.25s at least (240 BPM)
    
    const partSize = 22050 / 4;
    const parts = data[0].length / partSize;
    let peaks = [];
  
    for (let i = 0; i < parts; i++) {
      let max = 0;
      for (let j = i * partSize; j < (i + 1) * partSize; j++) {
        const vol = Math.abs(data[0][j]);
        if (vol > max) max = vol;
      }
      peaks.push({ position: i * partSize, volume: max });
    }
    
    // Sort by volume and take the loudest 
    peaks.sort((a, b) => b.volume - a.volume);
    peaks = peaks.splice(0, peaks.length * 0.5); // Take top 50% loudest parts
    
    // Re-sort by position
    peaks.sort((a, b) => a.position - b.position);
  
    return peaks;
  }
  
  function getIntervals(peaks: any[]) {
    const groups: any[] = [];
  
    peaks.forEach((peak, index) => {
      for (let i = 1; i < 10; i++) {
        const neighbor = peaks[index + i];
        if (!neighbor) break;
  
        const interval = neighbor.position - peak.position;
        
        // Find a group with similar interval
        const group = groups.find(p => Math.abs(p.interval - interval) < 200); // 200 samples tolerance
        if (group) {
          group.count++;
        } else {
          groups.push({ interval, count: 1 });
        }
      }
    });
    return groups;
  }
  
  function getTempoCandidates(groups: any[], sampleRate: number) {
    return groups
      .map(group => {
        const intervalSeconds = group.interval / sampleRate;
        const tempo = 60 / intervalSeconds;
        return { tempo, count: group.count };
      })
      .map(t => {
        // Adjust for typical BPM range (60 - 180)
        let tempo = t.tempo;
        while (tempo < 60) tempo *= 2;
        while (tempo > 180) tempo /= 2;
        return { tempo, count: t.count };
      })
      .sort((a, b) => b.count - a.count); // Sort by frequency
  }
