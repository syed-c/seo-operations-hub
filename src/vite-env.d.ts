/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PAGES_REFRESH_WEBHOOK_URL: string;
  readonly VITE_BACKLINK_REVIEW_WEBHOOK_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}