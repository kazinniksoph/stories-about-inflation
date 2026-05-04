import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Explorer from './pages/Explorer';
import Staircase from './pages/Staircase';
import Geography from './pages/Geography';
import Results from './pages/Results';
import Methodology from './pages/Methodology';
import Frames from './pages/Frames';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/explorer" element={<Explorer />} />
          <Route path="/staircase" element={<Staircase />} />
          <Route path="/geography" element={<Geography />} />
          <Route path="/results" element={<Results />} />
          <Route path="/methodology" element={<Methodology />} />
          <Route path="/frames" element={<Frames />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
