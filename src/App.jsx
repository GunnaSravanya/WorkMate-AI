import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import WorkerLogin from './pages/WorkerLogin';
import ContractorLogin from './pages/ContractorLogin';
import RegisterWorker from './pages/RegisterWorker';
import RegisterContractor from './pages/RegisterContractor';
import WorkerDashboard from './pages/WorkerDashboard';
import ContractorDashboard from './pages/ContractorDashboard';
import PostJob from './pages/PostJob';
import JobDetails from './pages/JobDetails';
import JobManagement from './pages/JobManagement';
import LoanDetails from './pages/LoanDetails';
import SearchEquipment from './pages/SearchEquipment';
import AddEquipment from './pages/AddEquipment';
import MyEquipment from './pages/MyEquipment';
import EditEquipment from './pages/EditEquipment';

import { useApp } from './context/AppContext';
import VoiceControls from './components/VoiceControls';
import VoiceInteractionLayer from './components/VoiceInteractionLayer';
import AIChatbot from './components/AIChatbot';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans antialiased selection:bg-red-100 selection:text-red-600">
      <AIChatbot />
      <VoiceInteractionLayer />
      <VoiceControls showUI={false} />
      <div className="fixed inset-0 overflow-hidden -z-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-500/5 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] right-[-10%] w-[30%] h-[30%] bg-orange-500/5 rounded-full blur-[100px]" />
      </div>

      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} /> {/* Keeping generic for fallback, but main flows are separate */}
        <Route path="/login-worker" element={<WorkerLogin />} />
        <Route path="/login-contractor" element={<ContractorLogin />} />
        <Route path="/register-worker" element={<RegisterWorker />} />
        <Route path="/register-contractor" element={<RegisterContractor />} />
        <Route path="/worker-dashboard" element={<WorkerDashboard />} />
        <Route path="/contractor-dashboard" element={<ContractorDashboard />} />
        <Route path="/post-job" element={<PostJob />} />
        <Route path="/job/:id" element={<JobDetails />} />
        <Route path="/manage-job/:id" element={<JobManagement />} />
        <Route path="/loan/:name" element={<LoanDetails />} />

        {/* Equipment Routes */}
        <Route path="/equipment/search" element={<SearchEquipment />} />
        <Route path="/equipment/add" element={<AddEquipment />} />
        <Route path="/equipment/my" element={<MyEquipment />} />
        <Route path="/equipment/edit/:id" element={<EditEquipment />} />
      </Routes>
    </div>
  );
}

export default App;
