import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // @apps-in-toss/web-framework는 절대 external 금지.
    // SDK는 importmap이 아닌 window.ReactNativeWebView 글로벌로 통신하므로
    // 번들에 포함해야 정상 동작. external 설정 시 bare specifier가 번들 첫 줄에
    // 남아 브라우저가 해석 불가 → JS 한 줄도 실행 안 됨 → 흰 화면.
    rollupOptions: {},
  },
});
