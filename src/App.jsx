import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Collections from "./components/Collections";
import Shop from "./components/Shop";
import About from "./components/About";
import ContactSection from "./components/ContactSection";
import Footer from "./components/Footer";
import AdminPage from "./components/AdminPage";

function MainSite() {
  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors">
      <Navbar />
      <Hero />
      <Collections />
      <Shop />
      <About />
      <ContactSection />
      <Footer />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainSite />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
