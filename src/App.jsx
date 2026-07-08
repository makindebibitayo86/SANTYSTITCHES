import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Collections from "./components/Collections";
import Shop from "./components/Shop";
import About from "./components/About";
import ContactSection from "./components/ContactSection";
import Footer from "./components/Footer";
import AdminPage from "./components/AdminPage";
import { CartProvider } from "./context/CartContext";
import { SiteDataProvider } from "./context/SiteDataContext";

// Only the public site shares the cached bootstrap fetch — the admin panel
// reads live, uncached data directly (it needs the true current sheet
// state, not a shared snapshot that might be a few minutes old).
function MainSite() {
  return (
    <SiteDataProvider>
      <div className="min-h-screen bg-white dark:bg-black transition-colors">
        <Navbar />
        <Hero />
        <Collections />
        <Shop />
        <About />
        <ContactSection />
        <Footer />
      </div>
    </SiteDataProvider>
  );
}

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainSite />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
