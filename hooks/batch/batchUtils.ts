import * as musicMetadata from 'music-metadata-browser';

export const getFileMetadata = (file: File): Promise<any> => {
  return new Promise((resolve) => {
    let resolved = false;
    
    const finish = (result: any) => {
      if (resolved) return;
      resolved = true;
      resolve(result);
    };

    const isOpus = file.name.toLowerCase().endsWith('.opus') || file.name.toLowerCase().endsWith('.ogg') || file.type.includes('opus') || file.type.includes('ogg');

    if (isOpus) {
      musicMetadata.parseBlob(file).then((metadata) => {
          let durationStr = "Unknown";
          if (metadata && metadata.format && metadata.format.duration) {
              const duration = metadata.format.duration;
              const mins = Math.floor(duration / 60);
              const secs = Math.floor(duration % 60);
              durationStr = `${mins}:${secs.toString().padStart(2, '0')}`;
          } else {
              const estimatedSecs = Math.max(10, Math.round(file.size / 4000));
              const mins = Math.floor(estimatedSecs / 60);
              const secs = Math.floor(estimatedSecs % 60);
              durationStr = `${mins}:${secs.toString().padStart(2, '0')}`;
          }
          finish({
            name: file.name,
            size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
            duration: durationStr,
            type: file.type,
            date: new Date().toISOString()
          });
      }).catch(() => {
          finish({
            name: file.name,
            size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
            duration: "Unknown",
            type: file.type,
            date: new Date().toISOString()
          });
      });
      return;
    }

    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    
    audio.onloadedmetadata = () => {
      const duration = audio.duration;
      let durationStr = "Unknown";
      if (isFinite(duration) && !isNaN(duration)) {
        const mins = Math.floor(duration / 60);
        const secs = Math.floor(duration % 60);
        durationStr = `${mins}:${secs.toString().padStart(2, '0')}`;
      }
      URL.revokeObjectURL(url);
      finish({
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        duration: durationStr,
        type: file.type,
        date: new Date().toISOString()
      });
    };
    
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      finish({
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        duration: "Unknown",
        type: file.type,
        date: new Date().toISOString()
      });
    };

    setTimeout(() => {
      URL.revokeObjectURL(url);
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
