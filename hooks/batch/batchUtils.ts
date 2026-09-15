export const getFileMetadata = (file: File): Promise<any> => {
  return new Promise((resolve) => {
    let resolved = false;
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    
    const finish = (result: any) => {
      if (resolved) return;
      resolved = true;
      URL.revokeObjectURL(url);
      resolve(result);
    };
    
    audio.onloadedmetadata = () => {
      const duration = audio.duration;
      let durationStr = "Unknown";
      if (isFinite(duration) && !isNaN(duration)) {
        const mins = Math.floor(duration / 60);
        const secs = Math.floor(duration % 60);
        durationStr = `${mins}:${secs.toString().padStart(2, '0')}`;
      }
      finish({
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        duration: durationStr,
        type: file.type,
        date: new Date().toISOString()
      });
    };
    
    audio.onerror = () => {
      finish({
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        duration: "Unknown",
        type: file.type,
        date: new Date().toISOString()
      });
    };

    setTimeout(() => {
      finish({
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        duration: "Unknown",
        type: file.type,
        date: new Date().toISOString()
      });
    }, 3000);
  });
};
