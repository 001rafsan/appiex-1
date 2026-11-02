import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';

export function ServicesPage() {
  return (
    <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto text-white">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl font-light tracking-widest uppercase mb-4">Engineering Capabilities</h1>
        <p className="text-slate-300">High-throughput digital architectures built for sub-second speeds and spatial immersion.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
          { title: "Custom Software & SaaS", desc: "Enterprise portals, scalable web apps & microservices", tag: "01 / ARCHITECTURE" },
          { title: "Headless E-Commerce", desc: "Next.js luxury storefronts, sub-0.3s checkout", tag: "02 / STOREFRONTS" },
          { title: "3D Spatial & WebGL", desc: "Interactive Three.js 360° product viewers & custom shaders", tag: "03 / IMMERSION" },
          { title: "Mobile App Engineering", desc: "Cross-platform iOS & Android mobile ecosystems", tag: "04 / ECOSYSTEM" },
          { title: "Programmatic SEO & Speed", desc: "Sub-0.3s LCP, automated Schema & SERP velocity", tag: "05 / DOMINANCE" },
          { title: "Cloud & Resilient DevOps", desc: "Edge deployment, Kubernetes microservices, 99.99% SLA", tag: "06 / RESILIENCE" }
        ].map((s, idx) => (
          <div key={idx} className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl hover:border-red-500/40 transition">
            <span className="text-xs font-mono text-red-500 font-bold block mb-2">{s.tag}</span>
            <h3 className="text-2xl font-bold mb-3">{s.title}</h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">{s.desc}</p>
            <a href="/#contact" className="text-xs font-semibold text-red-400 hover:underline">Deploy &rarr;</a>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReferPage() {
  return (
    <div className="pt-32 pb-20 px-4 max-w-5xl mx-auto text-white">
      <div className="text-center mb-12">
        <span className="inline-block px-4 py-1.5 rounded-full bg-red-600/15 border border-red-500/40 text-red-400 text-xs font-mono font-bold tracking-widest uppercase mb-4">
          PARTNER &amp; EARN PROGRAM
        </span>
        <h1 className="text-3xl md:text-5xl font-extrabold uppercase tracking-tight mb-4">
          STUDENT OR JOB HOLDER? <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-amber-300">
            WANT TO EARN EXTRA MONEY?
          </span>
        </h1>
        <p className="text-slate-300 text-base md:text-lg max-w-2xl mx-auto">
          You don't need any investment or coding knowledge. Just connect clients who need websites, software, or apps to us &amp; earn instant cash commission up to 15%.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
          <div className="text-2xl mb-2">🚫</div>
          <h4 className="font-bold text-white text-sm mb-1 uppercase">Zero Investment</h4>
          <p className="text-xs text-slate-400">0 Taka required. 100% free to join.</p>
        </div>
        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
          <div className="text-2xl mb-2">🤝</div>
          <h4 className="font-bold text-white text-sm mb-1 uppercase">Give Client</h4>
          <p className="text-xs text-slate-400">Introduce a business owner or client.</p>
        </div>
        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
          <div className="text-2xl mb-2">⚡</div>
          <h4 className="font-bold text-white text-sm mb-1 uppercase">We Build It</h4>
          <p className="text-xs text-slate-400">Our engineering collective handles everything.</p>
        </div>
        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
          <div className="text-2xl mb-2">💰</div>
          <h4 className="font-bold text-white text-sm mb-1 uppercase">Earn 10% - 15%</h4>
          <p className="text-xs text-slate-400">Get paid directly via bKash, Nagad, or Bank.</p>
        </div>
      </div>

      <div className="text-center">
        <a
          href="https://wa.me/8801905183861?text=Hi%20Appiex,%20I%20have%20a%20client%20referral"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[#25D366] text-black font-extrabold text-sm uppercase tracking-wider hover:brightness-110 transition shadow-lg shadow-emerald-500/20"
        >
          Refer via WhatsApp &rarr;
        </a>
      </div>
    </div>
  );
}

export function ProjectsPage() {
  const [currentIndex, setCurrentIndex] = React.useState(1);
  const products = [
    {
      title: "SEAM XVR SIGNATURE",
      badge: "MOST POPULAR",
      price: "₹8999",
      img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
      hasPlus: false,
    },
    {
      title: "COVER DRIVE 18",
      badge: "TRENDING",
      price: "₹10074",
      img: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=900&q=80",
      hasPlus: true,
    },
    {
      title: "BOOM RUSH",
      badge: "NEW ARRIVAL",
      price: "₹5490",
      img: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=900&q=80",
      hasPlus: false,
    },
    {
      title: "ECLIPSE GOLD",
      badge: "EXCLUSIVE",
      price: "₹7200",
      img: "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?auto=format&fit=crop&w=900&q=80",
      hasPlus: false,
    },
  ];

  return (
    <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto text-white">
      <div className="flex justify-between items-end mb-12">
        <div>
          <span className="text-xs font-mono text-red-500 font-bold tracking-widest uppercase block mb-1">SUCCESSFUL DEALS MADE BETWEEN BUYERS AND VENDORS</span>
          <h1 className="text-4xl font-light tracking-widest uppercase">OUR PRODUCTS &amp; BUILDS</h1>
        </div>
      </div>

      {/* 4-Card Slider - Exact Pic 4 Clean White Presentation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((p, idx) => (
          <div key={idx} className="bg-white rounded-2xl overflow-hidden p-3.5 shadow-xl transition-transform hover:-translate-y-1">
            <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden bg-[#f4f4f5]">
              <span className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded bg-[#18181b] text-white text-[10px] font-bold uppercase tracking-wider">
                {p.badge}
              </span>
              <img src={p.img} alt={p.title} className="w-full h-full object-cover" />
              {p.hasPlus && (
                <button
                  type="button"
                  aria-label="Add item"
                  className="absolute bottom-3 right-3 z-10 w-9 h-9 rounded-full bg-[#18181b] text-white flex items-center justify-center font-bold text-lg hover:scale-110 transition shadow-md"
                >
                  +
                </button>
              )}
            </div>
            <div className="pt-3.5 pb-1 text-center">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-900 mb-1">
                {p.title}
              </h3>
              <p className="text-xs font-semibold text-zinc-600">
                {p.price}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Slider Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/10 mt-8">
        <div className="flex items-center gap-4">
          <span className="text-sm font-mono text-slate-400 tracking-wider">{currentIndex} / 4</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentIndex(c => Math.max(1, c - 1))} className="w-10 h-10 rounded-full border border-white/15 bg-white/5 hover:bg-white/15 text-white flex items-center justify-center transition-colors">&lt;</button>
            <button onClick={() => setCurrentIndex(c => Math.min(4, c + 1))} className="w-10 h-10 rounded-full border border-white/15 bg-white/5 hover:bg-white/15 text-white flex items-center justify-center transition-colors">&gt;</button>
          </div>
        </div>
        <div className="w-full sm:w-64 h-1.5 bg-white/10 rounded-full relative overflow-visible">
          <div className="absolute top-0 left-0 h-full bg-[#FF2A4D] rounded-full transition-all duration-300" style={{ width: `${(currentIndex / 4) * 100}%` }} />
          <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#FF2A4D] shadow-[0_0_10px_rgba(255,42,77,0.8)] transition-all duration-300" style={{ left: `calc(${(currentIndex / 4) * 100}% - 7px)` }} />
        </div>
      </div>
    </div>
  );
}

export function HomePage() {
  return (
    <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto text-center text-white">
      <h2 className="text-sm font-mono tracking-widest text-red-500 uppercase mb-4">BUILT FOR GROWTH</h2>
      <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">Best Software Agency<br/>For You</h1>
      <p className="text-slate-300 max-w-xl mx-auto mb-8 text-base">Appiex builds custom websites, high-performance web applications, interactive 3D experiences, and AI automation for startups and growing brands.</p>
      <div className="flex justify-center gap-4">
        <Link to="/services" className="px-8 py-3.5 rounded-full bg-red-600 text-white font-semibold text-sm hover:bg-red-500 transition shadow-lg shadow-red-600/30">
          Explore Services
        </Link>
        <Link to="/projects" className="px-8 py-3.5 rounded-full border border-white/20 text-white text-sm hover:bg-white/10 transition">
          View Projects
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#030408] relative overflow-hidden font-sans">
        {/* Background video overlay */}
        <video className="pointer-events-none fixed inset-0 h-screen w-screen object-cover object-center z-0 opacity-40 grayscale contrast-125" autoPlay loop muted playsInline>
          <source src="/assets/static/vde.webm" type="video/webm" />
        </video>
        <div className="pointer-events-none fixed inset-0 h-screen w-screen z-0" style={{ mixBlendMode: 'color', backgroundColor: '#ff0000', opacity: 0.85 }} />

        <Navbar />

        <main className="relative z-10">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/refer" element={<ReferPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/case-studies" element={<ServicesPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
