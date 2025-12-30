import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { HistoryPage } from './pages/HistoryPage';
import InvestmentsPage from './pages/InvestmentsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/investments" element={<InvestmentsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;