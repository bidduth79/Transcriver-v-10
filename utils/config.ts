export const DEFAULT_API_URL = 'http://127.0.0.1/licell_api';

export const getApiBaseUrl = () => {
  return localStorage.getItem('api_base_url') || DEFAULT_API_URL;
};

export const setApiBaseUrl = (url: string) => {
  const cleanUrl = url.replace(/\/$/, '');
  localStorage.setItem('api_base_url', cleanUrl);
};

export const getApiUrl = (endpoint: string) => {
  const base = getApiBaseUrl();
  return `${base}/${endpoint}`;
};
