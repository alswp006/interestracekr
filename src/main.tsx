// @AI:ANCHOR — 이 파일은 scaffold가 생성합니다. 코딩 에이전트가 수정하지 마세요.
// Provider 추가가 필요하면 App.tsx를 수정하세요.
// TDSMobileAITProvider: 토스 앱인토스 환경 통합 Provider.
//   내부적으로 TDSMobileProvider + GlobalCSSVariables(--adaptive*)
//   + SafeAreaInsets(--toss-safe-area-*) 자동 주입.
//   userAgent 자동 파싱, brandPrimaryColor는 granite.config.ts에서 자동.
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { TDSMobileAITProvider } from '@toss/tds-mobile-ait';
import App from './App';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TDSMobileAITProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </TDSMobileAITProvider>
  </React.StrictMode>,
);
