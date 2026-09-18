
export const fileToBase64 = (file: Blob | File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      } else {
        reject(new Error("File conversion failed: result is not a string"));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

export const splitFile = async (file: File | Blob, maxSizeMB = 50): Promise<Blob[]> => {
  const chunks = [];
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  let offset = 0;

  while (offset < file.size) {
    const chunk = file.slice(offset, offset + maxSizeBytes);
    chunks.push(chunk);
    offset += maxSizeBytes;
  }

  return chunks;
};

export const downloadAsTxt = (text: string, fileName: string) => {
  const element = document.createElement("a");
  const file = new Blob([text], { type: 'text/plain;charset=utf-8' });
  element.href = URL.createObjectURL(file);
  element.download = `${fileName.split('.')[0]}_transcript.txt`;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  URL.revokeObjectURL(element.href);
};
