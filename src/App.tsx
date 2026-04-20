import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Cleanup } from './pages/Cleanup';
import { Selection } from './pages/Selection';
import { Voice } from './pages/Voice';
import { Settings } from './pages/Settings';
import { useStore } from './store/useStore';

function App() {
  const initializeMockData = useStore((state) => state.initializeMockData);

  useEffect(() => {
    initializeMockData();
  }, [initializeMockData]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="cleanup" element={<Cleanup />} />
          <Route path="selection" element={<Selection />} />
          <Route path="voice" element={<Voice />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
