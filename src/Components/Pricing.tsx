import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck, faArrowRight, faXmark, faBolt, faInfinity,
  faChartSimple, faBell, faCalendar, faFolderOpen, faShieldHalved, faListCheck
} from '@fortawesome/free-solid-svg-icons';

const shimmerStyle = `
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up { animation: fade-in-up 0.6s ease forwards; }
.animate-fade-in-up-delay { animation: fade-in-up 0.6s ease 0.15s forwards; opacity: 0; }
`;

const FREE_PERKS = [
  { icon: faListCheck, text: 'Up to 10 active tasks' },
  { icon: faFolderOpen, text: '1 project workspace' },
  { icon: faBell, text: 'Basic notifications' },
  { icon: faCalendar, text: 'Calendar view' },
  { icon: faShieldHalved, text: 'Secure cloud sync' },
];

const FREE_MISSING = [
  'AI task summaries',
  'Cross-project AI insights',
  'Analytics dashboard',
  'Priority support',
];

const PRO_PERKS = [
  { icon: faInfinity, text: 'Unlimited tasks across all projects' },
  { icon: faBolt, text: 'AI summary for every task — instantly' },
  { icon: faChartSimple, text: 'AI insights across all projects' },
  { icon: faFolderOpen, text: 'Unlimited project workspaces' },
  { icon: faCalendar, text: 'Advanced calendar & scheduling' },
  { icon: faBell, text: 'Smart priority notifications' },
  { icon: faChartSimple, text: 'Full analytics dashboard' },
  { icon: faShieldHalved, text: 'Priority support & early access' },
];

export const Pricing = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="w-full overflow-x-hidden">
      <style>{shimmerStyle}</style>

      <div className="min-h-screen bg-gradient-to-r from-[#F8C7C8] via-[#E8D4DA] to-[#C3EFFE]">
        {/* Background texture */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }}></div>
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:72px_72px]"></div>
          <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-gradient-to-br from-black/[0.02] to-transparent rounded-full"></div>
          <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-gradient-to-t from-black/[0.02] to-transparent rounded-full"></div>
        </div>

        {/* Header */}
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-black/[0.08] shadow-sm w-10/12 ml-auto mr-auto rounded-xl mt-3' : 'bg-transparent'}`}>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
              {/* Logo */}
              <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${scrolled ? 'bg-black' : 'bg-white'}`}>
                  <span className={`text-sm font-black ${scrolled ? 'text-white' : 'text-black'}`}>T</span>
                </div>
                <span className="text-base font-bold tracking-tight text-black">BrightLine</span>
              </div>

              {/* Desktop nav */}
              <nav className="hidden md:flex items-center gap-1">
                <button onClick={() => navigate('/')} className="px-4 py-2 text-sm text-neutral-600 hover:text-black hover:bg-black/[0.04] rounded-lg transition-all">Features</button>
                <button onClick={() => navigate('/')} className="px-4 py-2 text-sm text-neutral-600 hover:text-black hover:bg-black/[0.04] rounded-lg transition-all">Preview</button>
                <button onClick={() => navigate('/')} className="px-4 py-2 text-sm text-neutral-600 hover:text-black hover:bg-black/[0.04] rounded-lg transition-all">About</button>
                <button className="px-4 py-2 text-sm font-semibold text-black bg-black/[0.06] rounded-lg">Pricing</button>
              </nav>

              {/* Right actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/')}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-neutral-800 active:scale-[0.98] transition-all"
                >
                  Get Started
                  <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                </button>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-black/[0.05] transition-colors"
                >
                  <FontAwesomeIcon icon={mobileMenuOpen ? faXmark : faArrowRight} className="text-black" />
                </button>
              </div>
            </div>

            {/* Mobile menu */}
            <div className={`md:hidden overflow-hidden transition-all duration-300 ${mobileMenuOpen ? 'max-h-80 border-t border-black/[0.08]' : 'max-h-0'}`}>
              <div className="px-4 py-4 space-y-1 bg-white/80 backdrop-blur-xl">
                <button onClick={() => { navigate('/'); setMobileMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-neutral-700 hover:bg-black/[0.04] rounded-lg transition-all">Features</button>
                <button onClick={() => { navigate('/'); setMobileMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-neutral-700 hover:bg-black/[0.04] rounded-lg transition-all">Preview</button>
                <button onClick={() => { navigate('/'); setMobileMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-neutral-700 hover:bg-black/[0.04] rounded-lg transition-all">About</button>
                <button className="w-full text-left px-4 py-3 text-sm font-semibold text-black bg-black/[0.06] rounded-lg">Pricing</button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="relative z-10 pt-32 pb-24 px-4">
          {/* Heading */}
          <div className="text-center max-w-2xl mx-auto mb-16 animate-fade-in-up">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-3">Pricing</p>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-black mb-4">
              Simple, honest pricing.
            </h1>
            <p className="text-neutral-500 text-lg">
              Start free. Upgrade when you need the full power of AI.
            </p>
          </div>

          {/* Cards */}
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Free card */}
            <div className="animate-fade-in-up bg-white/60 backdrop-blur-xl border border-black/[0.08] rounded-2xl p-8 flex flex-col">
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-2">Free</p>
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-black text-black">$0</span>
                  <span className="text-neutral-400 mb-2 text-sm">/month</span>
                </div>
                <p className="text-sm text-neutral-500 mt-2">Everything you need to get started.</p>
              </div>

              <div className="space-y-3 mb-8 flex-1">
                {FREE_PERKS.map((p) => (
                  <div key={p.text} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-black/[0.06] flex items-center justify-center flex-shrink-0">
                      <FontAwesomeIcon icon={p.icon} className="text-[10px] text-neutral-600" />
                    </div>
                    <span className="text-sm text-neutral-700">{p.text}</span>
                  </div>
                ))}
                {FREE_MISSING.map((text) => (
                  <div key={text} className="flex items-center gap-3 opacity-40">
                    <div className="w-5 h-5 rounded-full bg-black/[0.04] flex items-center justify-center flex-shrink-0">
                      <FontAwesomeIcon icon={faXmark} className="text-[10px] text-neutral-400" />
                    </div>
                    <span className="text-sm text-neutral-500 line-through">{text}</span>
                  </div>
                ))}
              </div>

              <button
                
                className="w-full py-3 rounded-xl border border-black/[0.12] text-sm font-semibold text-black hover:bg-black/[0.04] active:scale-[0.98] transition-all"
              >
                Get started free
              </button>
            </div>

            {/* Pro card */}
            <div className="animate-fade-in-up-delay relative bg-black rounded-2xl p-8 flex flex-col overflow-hidden">
              {/* Subtle glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-transparent pointer-events-none rounded-2xl"></div>

              <div className="absolute top-5 right-5">
                <span className="px-3 py-1 bg-white/10 text-white text-xs font-semibold rounded-full border border-white/20">
                  Most Popular
                </span>
              </div>

              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-2">Pro</p>
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-black text-white">$7.99</span>
                  <span className="text-neutral-400 mb-2 text-sm">/month</span>
                </div>
                <p className="text-sm text-neutral-400 mt-2">Unlimited AI. Unlimited productivity.</p>
              </div>

              <div className="space-y-3 mb-8 flex-1">
                {PRO_PERKS.map((p) => (
                  <div key={p.text} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                      <FontAwesomeIcon icon={faCheck} className="text-[10px] text-white" />
                    </div>
                    <span className="text-sm text-neutral-200">{p.text}</span>
                  </div>
                ))}
              </div>

              <button
                
                className="w-full py-3 rounded-xl bg-white text-black text-sm font-semibold hover:bg-neutral-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                Upgrade to Pro
                <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
              </button>
            </div>
          </div>

          {/* Bottom note */}
          <p className="text-center text-sm text-neutral-400 mt-10">
            No credit card required for Free plan. Cancel Pro anytime.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
