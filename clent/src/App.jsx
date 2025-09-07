import React from 'react'
import Header from './components/Header'
import "./config/connection"
import { ToastContainer } from "react-toastify"
import 'react-toastify/dist/ReactToastify.css';
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home';
import PropertyForm from './components/PropertyForm';
import KYCForm from './components/KYCForm';
import KycAdminPanel from './pages/AdminPanel';
import AllProperties from './pages/Properties';
import PropertyDetails from './pages/PropertyDetails';
import UpdateProperty from './components/UpdateProperty';
import MyProperties from './pages/MyProperties'
import ThunderSuccess from './components/ThunderSuccess';
import About from './components/About';
import TermsAndConditions from './pages/TermsAndConditions';
import ProtectedKYC from './components/ProtectedKYC';
import FAQ from './pages/FAQ';
import PrivacyPolicy from './pages/PolicyAndPrivacy';
import ContactAdmin from './pages/ContactAdmin';
import ChatPage from './pages/Chatpage';

const App = () => {
  return (
    <div>
      <Header />
 
      <Routes>
         <Route path="/" element={<Home />} />
        <Route path="/create" element={<PropertyForm />} />
        {/* <Route path="/kyc" element={<KYCForm />} /> */}
        <Route path="/kyc" element={<ProtectedKYC><KYCForm /></ProtectedKYC>} />

        <Route path="/properties" element={<AllProperties  />} />
        <Route path="/me" element={<MyProperties  />} />
        <Route path="/success" element={<ThunderSuccess />} />
        <Route path="/terms" element={<TermsAndConditions />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<ContactAdmin />} />
        <Route path="/properties/:id/update" element={<UpdateProperty />} />

        <Route path="/properties/:id" element={<PropertyDetails />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/dashboard" element={<KycAdminPanel />} />


      </Routes>
      <ToastContainer position='bottom-center' theme='dark'/>
    </div>
  )
}

export default App