import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import './index.css'
import { queryClient } from './lib/queryClient.js';
import App from './App.jsx'
import Header from './components/Header.jsx';
import { ToastProvider } from './components/Toast.jsx';
import CyclesView from './views/CyclesView.jsx';
import NominateView from './views/NominateView.jsx';
import CyclesDetail from './views/CyclesDetail.jsx';
import EditNominations from './views/EditNominations.jsx';
import StatsPage from './views/StatsPage.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <Header />
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/cycles" element={<CyclesView />} />
            <Route path="/nominate" element={<NominateView />} />
            <Route path="/cycles/:cycleId" element={<CyclesDetail />} />
            <Route path="/cycles/:cycleId/edit" element={<EditNominations />} />
            <Route path="/stats" element={<StatsPage />} />
          </Routes>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);



