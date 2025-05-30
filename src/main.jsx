import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css'
import App from './App.jsx'
import Header from './components/Header.jsx';
import CyclesView from './components/CyclesView.jsx';
import NominateView from './components/NominateView.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/cycles" element={<CyclesView />} />
        <Route path="/nominate" element={<NominateView />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);



