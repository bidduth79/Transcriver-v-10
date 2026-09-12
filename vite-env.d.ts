/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_KEY_1: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
