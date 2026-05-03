import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { getUrl } from "./Request";
import { Spinner } from "./Spinner";
import toast, { Toaster } from "react-hot-toast";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faArrowRight, faCheck, faPlay, faShieldHalved, faDatabase, faBolt, faMobileScreen, faFolderOpen, faCalendar, faKeyboard, faMoon, faCloud, faChartSimple, faBell, faLock, faHouse, faListCheck, faUserPlus, faChevronLeft, faChevronRight, faCircleDot, faInfinity, faEnvelope, faUser, faPlus } from '@fortawesome/free-solid-svg-icons'
import { faGithub, faTwitter, faDiscord, faLinkedin, faGoogle, faTrello } from '@fortawesome/free-brands-svg-icons'

 
// Add shimmer animation styles
const shimmerStyle = `
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-10px) rotate(2deg); }
}
@keyframes float-reverse {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(10px) rotate(-2deg); }
}
@keyframes pulse-slow {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

   type Status = 'idle' | 'loading' | 'success' | 'error' | 'blocked';
   type Login = 'login' | 'register' | 'forgotPassword';

   type loginResponse = {
    token: string,
    refreshToken: string
   }

  type HttpStatus = 200 | 201 | 400 | 401 | 403 | 404 | 429 | 500;
export const MessagePage = () => {

 
  const [loginPage, setloginPage] =useState<Login>('login');

  const navigate = useNavigate();
  const [firstname, setFirstname] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [openLogin, setopenLogin] = useState(false);
  const [blur, setBlur] = useState(false);

  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  //Reset password endpoint goes here
  const resetPassword = async()=>{
    if(newPassword !== confirmPassword){
      toast.error("Passwords do not match");
      return;
    }
    try {
        const res = await fetch(getUrl('resetPassword'),{
          method: "POST",
          headers: {"Content-Type" : "application/json"},
          body: JSON.stringify({
            email: resetEmail,
            password: newPassword
          })
        })
        if(res.ok){
          toast.success("Password Successfully Changed!");
          setTimeout(()=>{setloginPage("login")}, 1000);
        }
    } catch (error) {
      return;
    }
  }

 

  //Reusable function for generating inputs using Props
  //create a reusable component 


  //Get count of tasks

  //Register SECTION --------------------------------------------------------------
  const [filled, setFilled] = useState(false);
  const registerUser = async () => {
    if (
      firstname.length === 0 ||
      last.length === 0 ||
      email.length === 0 ||
      password.length === 0
    ) {
      toast.error("Please fill in the required fields");
      setFilled(true);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(email)){
       toast.error("Please enter a valid email address");
       return;
    }

    if (password.length < 8) {
    toast.error("Password must be at least 8 characters");
    return;
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if(!hasLetter || !hasNumber){
       toast.error("Password must contain at least one letter and one number");
    return;
    }


    try {
      const res = await fetch(getUrl("register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first: firstname,
          last: last,
          email: email,
          password: password,
        }),
      });

      const Stat: HttpStatus = res.status as HttpStatus;
      const data = await res.json();
      switch (Stat){
        case 200:
          case 201:
          toast.success('Account registered Successfully');
          setloginPage('login');
          setFirstname("");
          setLast("");
          setEmail("");
          setPassword("");
          break;
        case 401:
          toast.error('Email Already exists, please login');
          break;
        case 400:
          toast.error('Invalid Input');
          break;
        case 429:
          setStatus('blocked');
          if(data.message === 'Too many requests, create account in 15 minutes'){
             toast.error('Too many requests, register again in 15 mins');
          }
          break;
        default:
          toast.error('Something went wrong');
          break;
      }
    } catch (error) {
      return;
    }
  };
  //Login Section --------------------------------------------------------------------------------
  const [loginEmail, setloginEmail] = useState("");
  const [loginPass, setloginPass] = useState("");
   useEffect(()=>{
    setFirstname("");
    setLast("");
    setEmail("");
    setPassword("");
    setloginEmail("");
    setloginPass("");
  }, [openLogin])

  

   const [status, setStatus] = useState<Status>('idle');


  const login = async () => {
    if (loginEmail.length === 0 || loginPass.length === 0) {
      toast.error("Please fill in the required fields");
      return;
    }
    try {
      setStatus("loading");
      const res = await fetch(getUrl("login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPass,
        }),
      });

      const loginStat = res.status as HttpStatus;
      switch(loginStat){
        case 200:
        case 201:
          const data: loginResponse = await res.json();
          setStatus('success');
          toast.success('Validated Successfully');
          setTimeout(() => {
          navigate("/SecondPage");
        }, 1500);
        Cookies.set("token", data.token, { expires: 1 / 24 });
        Cookies.set('refreshToken', data.refreshToken); 
        break;

        case 401:
          setStatus('idle');
          toast.error('Invalid Credentials. Try again');
          break;

        case 404:
          setStatus('idle');
          toast.error('Email not found, please register');
          break;
        case 429:
          const datas = await res.json();
          setStatus('blocked');
          toast.error(`Blocked for too many attempts, try again in ${datas.ttl} minutes`);
          break;
        default:
          toast.error('Something went wrong');
          break;
      }
    } catch (error) {
      setStatus("error");
      navigate("/");
      Cookies.remove("token");
      return;
    }
  };





  //date part ---------------
  const [currDate, setcurrDate] = useState(new Date());
  const year = currDate.getFullYear();
  const month = currDate.getMonth();
  const getMonth = currDate.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const nextMonth = () => {
    setcurrDate(new Date(year, month + 1, 1));
  };
  const prevMonth = () => {
    setcurrDate(new Date(year, month - 1, 1));
  };

  const navig = () => {
    if (filled) {
      setTimeout(() => {
        setloginPage("login");
      }, 2000);
    }
  };
  useEffect(() => {
    if (openLogin) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [openLogin]);


  //FAQ section
  const [exp, setExp] = useState<number | null>(null);

  // Header scroll state
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [secondScroll, setSecondScroll] = useState(false);
  const [featuresInView, setFeaturesInView] = useState(false);
  
  useEffect(()=>{
    const handle = ()=>{
      if(window.scrollY > 700 && !secondScroll){
        setSecondScroll(true);
      }
    }
    window.addEventListener('scroll', handle);
    return()=> window.removeEventListener('scroll', handle);
  },[secondScroll]);

  // IntersectionObserver for Features section



const getMonday = (date: Date) => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()); // strip time
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Sunday = 0, Monday = 1
  d.setDate(d.getDate() + diff);
  return d;
};
const weekStart = getMonday(new Date());


  return (
    <div className=" w-full overflow-x-hidden">
      <style>{shimmerStyle}</style>
      <Toaster position="top-center"></Toaster>



       





      <div
        className={` min-h-screen bg-gradient-to-r from-[#F8C7C8] via-[#E8D4DA] to-[#C3EFFE] ${blur ? "blur-lg pointer-events-none" : "blur-none"}`}
      >
        {/* Premium background */}
         <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {/* Noise texture overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")'}}></div>
          {/* Grid pattern - using dark lines for light background */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:72px_72px]"></div>
          {/* Gradient orbs - using darker colors for light background */}
          <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-gradient-to-br from-black/[0.02] to-transparent rounded-full "></div>
          <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-gradient-to-t from-black/[0.02] to-transparent rounded-full "></div>
          <div className="absolute top-[40%] right-[30%] w-[300px] h-[300px] bg-gradient-to-br from-black/[0.015] to-transparent rounded-full "></div>
        </div>



        {/* Header */}
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-black/[0.08] shadow-sm w-10/12 ml-auto mr-auto rounded-xl mt-3' : 'bg-transparent'}`}>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
              {/* Left - Logo */}
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${scrolled ? 'bg-black' : 'bg-white'}`}>
                  <span className={`text-sm font-black ${scrolled ? 'text-white' : 'text-black'}`}>T</span>
                </div>
                <span className="text-base font-bold tracking-tight text-black">
                  BrightLine
                </span>
              </div>

              {/* Center - Navigation (Desktop) */}
              <nav className="hidden md:flex items-center gap-1">
                <button
                  onClick={() => document.getElementById("features-anchor")?.scrollIntoView({ behavior: "smooth" })}
                  className="px-4 py-2 text-sm text-neutral-600 hover:text-black hover:bg-black/[0.04] rounded-lg transition-all"
                >
                  Features
                </button>
                <button
                  onClick={() => document.getElementById("preview-anchor")?.scrollIntoView({ behavior: "smooth" })}
                  className="px-4 py-2 text-sm text-neutral-600 hover:text-black hover:bg-black/[0.04] rounded-lg transition-all"
                >
                  Preview
                </button>
                <button
                  onClick={() => document.getElementById("about-anchor")?.scrollIntoView({ behavior: "smooth" })}
                  className="px-4 py-2 text-sm text-neutral-600 hover:text-black hover:bg-black/[0.04] rounded-lg transition-all"
                >
                  About
                </button>
                <button
                  className="px-4 py-2 text-sm text-neutral-600 hover:text-black hover:bg-black/[0.04] rounded-lg transition-all"
                >
                  Pricing
                </button>
              </nav>

              {/* Right - Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setopenLogin(true);
                    setBlur(true);
                    setloginPage("register");
                  }}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-neutral-800 active:scale-[0.98] transition-all"
                >
                  Get Started
                  <FontAwesomeIcon icon={faArrowRight} className="text-xs"></FontAwesomeIcon>
                </button>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-black/[0.05] transition-colors"
                >
                  <FontAwesomeIcon icon={faXmark} className={`fa-solid ${mobileMenuOpen ? 'fa-xmark' : 'fa-bars'} text-black`}></FontAwesomeIcon>
                </button>
              </div>
            </div>

            {/* Mobile Menu */}
            <div className={`md:hidden overflow-hidden transition-all duration-300 ${mobileMenuOpen ? 'max-h-80 border-t border-black/[0.08]' : 'max-h-0'}`}>
              <div className="px-4 py-4 space-y-1 bg-white/80 backdrop-blur-xl">
                <button
                  onClick={() => { document.getElementById("features-anchor")?.scrollIntoView({ behavior: "smooth" }); setMobileMenuOpen(false); }}
                  className="w-full text-left px-4 py-3 text-sm text-neutral-700 hover:bg-black/[0.04] rounded-lg transition-all"
                >
                  Features
                </button>
                <button
                  onClick={() => { document.getElementById("preview-anchor")?.scrollIntoView({ behavior: "smooth" }); setMobileMenuOpen(false); }}
                  className="w-full text-left px-4 py-3 text-sm text-neutral-700 hover:bg-black/[0.04] rounded-lg transition-all"
                >
                  Preview
                </button>
                <button
                  onClick={() => { document.getElementById("about-anchor")?.scrollIntoView({ behavior: "smooth" }); setMobileMenuOpen(false); }}
                  className="w-full text-left px-4 py-3 text-sm text-neutral-700 hover:bg-black/[0.04] rounded-lg transition-all"
                >
                  About
                </button>
                <button
                  className="w-full text-left px-4 py-3 text-sm text-neutral-700 hover:bg-black/[0.04] rounded-lg transition-all"
                >
                  Pricing
                </button>
                <div className="pt-3 mt-3 border-t border-black/[0.08] space-y-2">
                  <button
                    onClick={() => { setopenLogin(true); setBlur(true); setloginPage("login"); setMobileMenuOpen(false); }}
                    className="w-full px-4 py-3 text-sm text-neutral-700 hover:bg-black/[0.04] rounded-lg transition-all text-left"
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => { setopenLogin(true); setBlur(true); setloginPage("register"); setMobileMenuOpen(false); }}
                    className="w-full px-4 py-3 bg-black text-white text-sm font-semibold rounded-lg hover:bg-neutral-800 transition-all flex items-center justify-center gap-2"
                  >
                    Get Started Free
                    <FontAwesomeIcon icon={faArrowRight} className="fa-solid fa-arrow-right text-xs"></FontAwesomeIcon>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 pt-32 pb-20 overflow-hidden">
          {/* Floating task cards - decorative */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Floating card 1 */}
            <div 
              className="absolute top-[20%] left-[8%] w-48 bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-xl shadow-black/5 border border-black/5 hidden lg:block"
              style={{ animation: 'float 6s ease-in-out infinite' }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                  <FontAwesomeIcon icon={faCheck} className="fa-solid fa-check text-white text-[8px]"></FontAwesomeIcon>
                </div>
                <span className="text-sm text-black/60 line-through">Design system</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                  <FontAwesomeIcon icon={faCheck} className="fa-solid fa-check text-white text-[8px]"></FontAwesomeIcon>
                </div>
                <span className="text-sm text-black/60 line-through">API integration</span>
              </div>
            </div>
            
            {/* Floating card 2 */}
            <div 
              className="absolute top-[35%] right-[5%] w-56 bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-xl shadow-black/5 border border-black/5 hidden lg:block"
              style={{ animation: 'float-reverse 7s ease-in-out infinite' }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-black">This week</span>
                <span className="text-xs text-emerald-600 font-medium">+24%</span>
              </div>
              <div className="flex items-end gap-1 h-12">
                {[40, 65, 45, 80, 60, 90, 55].map((h, i) => (
                  <div key={i} className="flex-1 bg-black/10 rounded-sm" style={{ height: `${h}%` }}></div>
                ))}
              </div>
            </div>
            
            {/* Floating card 3 */}
            <div 
              className=" absolute bottom-[25%] left-[10%] w-44 bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-xl shadow-black/5 border border-black/5 hidden lg:block"
              style={{ animation: 'float 8s ease-in-out infinite 1s' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white text-xs font-bold">W</div>
                <div>
                  <p className="text-xs font-medium text-black">Website</p>
                  <p className="text-[10px] text-neutral-500">4 tasks</p>
                </div>
              </div>
              <div className="h-1.5 bg-black/10 rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-black rounded-full"></div>
              </div>
            </div>

            {/* Floating card 4 - Calendar */}
            <div 
              className="absolute bottom-[30%] right-[8%] bg-white/80 backdrop-blur-sm rounded-2xl p-3 shadow-xl shadow-black/5 border border-black/5 hidden lg:block"
              style={{ animation: 'float-reverse 6s ease-in-out infinite 0.5s' }}
            >
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-[#F58634] flex flex-col items-center justify-center">
                  <span className="text-[8px] text-white/80 font-medium uppercase">Jan</span>
                  <span className="text-sm text-white font-bold leading-none">24</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-black">Deadline</p>
                  <p className="text-[10px] text-neutral-500">Launch day</p>
                </div>
              </div>
            </div>
          </div>

          {/* Badge */}
          <div 
            className="relative inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/60 backdrop-blur-md border border-black/5 shadow-lg shadow-black/5 mb-8 group cursor-default"
            style={{ animation: 'fade-in-up 0.6s ease-out' }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs sm:text-sm text-black/70 font-medium">
              Now in Beta — Free Forever
            </span>
          </div>

          {/* Main heading */}
          <h1 
            className=" text-center max-w-4xl mb-6"
            style={{ animation: 'fade-in-up 0.6s ease-out 0.1s both' }}
          >
            <span className="block text-6xl sm:text-7xl md:text-8xl lg:text-[7rem] font-black text-black tracking-[-0.04em] leading-[0.85]">
              Ship faster
            </span>
            <span 
              className="block text-6xl sm:text-7xl md:text-8xl lg:text-[7rem] font-black tracking-[-0.04em] leading-[0.85] mt-1 bg-[length:200%_auto] bg-clip-text text-transparent"
              style={{ 
                backgroundImage: 'linear-gradient(90deg, #F58634, #e85d04, #dc2f02, #F58634)',
                animation: 'gradient-shift 4s linear infinite'
              }}
            >
              Ship better
            </span>
          </h1>

          {/* Subheading */}
          <p 
            className="text-neutral-600 text-lg sm:text-xl md:text-2xl text-center max-w-xl mb-12 leading-relaxed font-light"
            style={{ animation: 'fade-in-up 0.6s ease-out 0.2s both' }}
          >
            The task manager that gets out of your way.
            <span className="block text-neutral-400 text-base mt-1">Built for devs who ship.</span>
          </p>

          {/* CTA Buttons */}
          <div 
            className={`flex flex-col sm:flex-row items-center gap-4`}
            style={{ animation: 'fade-in-up 0.6s ease-out 0.3s both' }}
          >
            <button
              onClick={() => {
                setopenLogin(true);
                setBlur(true);
              }}
              className="group relative px-8 py-4 rounded-full bg-black text-white font-semibold text-lg transition-all hover:scale-105 active:scale-[0.98] shadow-xl shadow-black/20 hover:shadow-2xl hover:shadow-black/30"
            >
              <span className="relative flex items-center gap-3">
                Start for free
                <FontAwesomeIcon icon={faArrowRight} className=" text-sm group-hover:translate-x-1.5 transition-transform"></FontAwesomeIcon>
              </span>
            </button>
            <button
              onClick={() =>
                document
                  .getElementById("preview-anchor")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="group px-8 py-4 rounded-full text-neutral-600 font-medium text-base hover:text-black transition-all flex items-center gap-2"
            >
              <div className="w-10 h-10 rounded-full bg-white border border-black/10 flex items-center justify-center group-hover:border-black/20 group-hover:scale-105 transition-all shadow-lg">
                <FontAwesomeIcon icon={faPlay} className="text-xs text-black ml-0.5"></FontAwesomeIcon>
              </div>
              <span>See how it works</span>
            </button>
          </div>

          {/* Stats row */}
          <div 
            className="flex items-center gap-8 sm:gap-12 mt-16 pt-8 border-t border-black/5"
            style={{ animation: 'fade-in-up 0.6s ease-out 0.4s both' }}
          >
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-black">10K+</p>
              <p className="text-xs text-neutral-500">Tasks completed</p>
            </div>
            <div className="w-px h-8 bg-black/10"></div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-black">500+</p>
              <p className="text-xs text-neutral-500">Active users</p>
            </div>
            <div className="w-px h-8 bg-black/10"></div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-black">99%</p>
              <p className="text-xs text-neutral-500">Satisfaction</p>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
            <div className="w-6 h-10 rounded-full border-2 border-black/20 flex justify-center pt-2">
              <div className="w-1 h-2 rounded-full bg-black/40 animate-bounce"></div>
            </div>
          </div>
        </section>

        {/* Brands/Trust Section */}
        <section className="py-12 border-y border-white/5">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-neutral-500">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faShieldHalved} className="text-lg" />
                <span className="text-sm font-medium">Secure Auth</span>
              </div>
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faDatabase} className="text-lg" />
                <span className="text-sm font-medium">PostgreSQL</span>
              </div>
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faBolt} className="text-lg" />
                <span className="text-sm font-medium">Real-time Updates</span>
              </div>
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faMobileScreen} className="text-lg" />
                <span className="text-sm font-medium">Fully Responsive</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          id="features-anchor"
          className="py-24 sm:py-32 px-4 sm:px-6 relative"
        >
          {/* Floating container - similar to header effect */}
          <div className={`transition-all duration-700 ease-out ${
            secondScroll 
              ? 'max-w-5xl mx-auto bg-white/60 backdrop-blur-xl rounded-[2.5rem] border border-black/[0.08] shadow-2xl shadow-black/[0.08] p-8 sm:p-12 lg:p-16' 
              : 'max-w-6xl mx-auto'
          }`}>
            <div className={`transition-all duration-700 ease-out ${secondScroll ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
              {/* Section header */}
              <div className={`text-center mb-12 lg:mb-16 transition-all duration-700 delay-100 ${secondScroll ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/[0.03] border border-black/[0.06] mb-6 transition-all duration-500 ${secondScroll ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-medium text-neutral-500">Core Features</span>
                </div>
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-black tracking-tight mb-6">
                  Less noise.<br />More done.
                </h2>
                <p className="text-neutral-500 text-lg max-w-md mx-auto">
                  Every feature designed with one goal: help you ship.
                </p>
              </div>

              {/* Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* Feature 1 - Projects (Large) */}
                <div className={`lg:col-span-2 group relative bg-white rounded-2xl border border-black/[0.06] p-6 lg:p-8 overflow-hidden hover:border-black/[0.12] hover:shadow-xl hover:shadow-black/[0.03] hover:-translate-y-1 transition-all duration-500 ${secondScroll ? 'opacity-100 translate-y-0 delay-150' : 'opacity-0 translate-y-10'}`}>
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center mb-5">
                    <FontAwesomeIcon icon={faFolderOpen} className="text-white text-lg" />
                  </div>
                  <h3 className="text-xl font-semibold text-black mb-2">Organize by project</h3>
                  <p className="text-neutral-500 text-sm leading-relaxed max-w-sm">
                    Group related tasks into focused workspaces. Each project gets its own deadlines and priorities.
                  </p>
                </div>
                {/* Visual */}
                <div className="mt-6 flex gap-3">
                  <div className="flex-1 bg-white rounded-xl border border-black/[0.06] p-3 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold">W</div>
                      <span className="text-xs font-medium text-black">Website</span>
                    </div>
                    <div className="h-1 bg-black/[0.06] rounded-full"><div className="h-full w-3/4 bg-violet-500 rounded-full"></div></div>
                  </div>
                  <div className="flex-1 bg-white rounded-xl border border-black/[0.06] p-3 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-[10px] font-bold">A</div>
                      <span className="text-xs font-medium text-black">API</span>
                    </div>
                    <div className="h-1 bg-black/[0.06] rounded-full"><div className="h-full w-1/2 bg-blue-500 rounded-full"></div></div>
                  </div>
                  <div className="hidden sm:block flex-1 bg-white rounded-xl border border-black/[0.06] p-3 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-[10px] font-bold">M</div>
                      <span className="text-xs font-medium text-black">Mobile</span>
                    </div>
                    <div className="h-1 bg-black/[0.06] rounded-full"><div className="h-full w-full bg-emerald-500 rounded-full"></div></div>
                  </div>
                </div>
              </div>

              {/* Feature 2 - Tasks */}
              <div className={`group relative bg-gradient-to-br from-emerald-50/50 to-white rounded-2xl border border-black/[0.06] p-6 lg:p-8 overflow-hidden hover:border-black/[0.12] hover:shadow-lg hover:-translate-y-1 transition-all duration-500 ${secondScroll ? 'opacity-100 translate-y-0 delay-200' : 'opacity-0 translate-y-10'}`}>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center mb-5">
                  <FontAwesomeIcon icon={faCheck} className="text-white text-lg" />
                </div>
                <h3 className="text-xl font-semibold text-black mb-2">Smart tasks</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">
                  Create, prioritize, complete. Simple as that.
                </p>
                {/* Visual */}
                <div className="mt-5 space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-black/[0.04]">
                    <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                      <FontAwesomeIcon icon={faCheck} className="text-white text-[7px]" />
                    </div>
                    <span className="text-xs text-neutral-400 line-through">Setup auth</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-black/[0.04]">
                    <div className="w-4 h-4 rounded-full border-2 border-black/20"></div>
                    <span className="text-xs text-black">Build API</span>
                  </div>
                </div>
              </div>

              {/* Feature 3 - Calendar */}
              <div className={`group relative bg-gradient-to-br from-blue-50/50 to-white rounded-2xl border border-black/[0.06] p-6 lg:p-8 overflow-hidden hover:border-black/[0.12] hover:shadow-lg hover:-translate-y-1 transition-all duration-500 ${secondScroll ? 'opacity-100 translate-y-0 delay-300' : 'opacity-0 translate-y-10'}`}>
                <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center mb-5">
                  <FontAwesomeIcon icon={faCalendar} className="text-white text-lg" />
                </div>
                <h3 className="text-xl font-semibold text-black mb-2">Calendar view</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">
                  See your week at a glance. Never miss a deadline.
                </p>
                {/* Mini calendar visual */}
                <div className="mt-5 grid grid-cols-7 gap-1">
                  {['M','T','W','T','F','S','S'].map((d, i) => (
                    <div key={i} className="text-[8px] text-neutral-400 text-center">{d}</div>
                  ))}
                  {[1,2,3,4,5,6,7].map((d, i) => (
                    <div key={i} className={`aspect-square rounded text-[9px] flex items-center justify-center ${d === 4 ? 'bg-blue-500 text-white font-medium' : 'text-neutral-500'}`}>{d}</div>
                  ))}
                </div>
              </div>

              {/* Feature 4 - Keyboard (Wide + Dark) */}
              <div className={`lg:col-span-2 group relative bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-3xl p-6 lg:p-8 overflow-hidden hover:from-neutral-800 hover:to-neutral-700 transition-all duration-500 ${secondScroll ? 'opacity-100 translate-y-0 delay-[400ms]' : 'opacity-0 translate-y-10'}`}>
                <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                  <div className="flex-1">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-5">
                      <FontAwesomeIcon icon={faKeyboard} className="text-white text-lg" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Keyboard-first</h3>
                    <p className="text-neutral-400 text-sm leading-relaxed">
                      Navigate, create, and complete without touching your mouse.
                    </p>
                  </div>
                  {/* Keyboard shortcuts visual */}
                  <div className="flex flex-wrap gap-2 sm:pt-4">
                    <div className="flex items-center gap-1 px-2 py-1.5 bg-white/[0.08] rounded-lg border border-white/[0.1]">
                      <kbd className="text-white/60 text-[10px] font-mono">⌘K</kbd>
                      <span className="text-white/40 text-[10px] ml-1">Search</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1.5 bg-white/[0.08] rounded-lg border border-white/[0.1]">
                      <kbd className="text-white/60 text-[10px] font-mono">⌘N</kbd>
                      <span className="text-white/40 text-[10px] ml-1">New</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1.5 bg-white/[0.08] rounded-lg border border-white/[0.1]">
                      <kbd className="text-white/60 text-[10px] font-mono">⌘↵</kbd>
                      <span className="text-white/40 text-[10px] ml-1">Done</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom tags */}
            <div className={`mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-neutral-400 transition-all duration-700 ${secondScroll ? 'opacity-100 translate-y-0 delay-500' : 'opacity-0 translate-y-6'}`}>
              <span className="flex items-center gap-2">
                <FontAwesomeIcon icon={faMoon} className="text-xs" />
                Dark mode
              </span>
              <span className="flex items-center gap-2">
                <FontAwesomeIcon icon={faBolt} className="text-xs" />
                Lightning fast
              </span>
              <span className="flex items-center gap-2">
                <FontAwesomeIcon icon={faShieldHalved} className="text-xs" />
                Secure
              </span>
              <span className="flex items-center gap-2">
                <FontAwesomeIcon icon={faCloud} className="text-xs" />
                Synced
              </span>
            </div>
          </div>
        </div>
        </section>


        {/* Preview Section */}
        <section
          id="preview-anchor"
          className="py-24 sm:py-32 px-4 sm:px-6 bg-neutral-950 relative overflow-hidden"
        >
          {/* Background accents */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-violet-600/[0.04] to-transparent rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[300px] bg-gradient-to-tr from-blue-600/[0.03] to-transparent blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-gradient-to-tl from-emerald-600/[0.03] to-transparent blur-3xl pointer-events-none"></div>

          <div className="max-w-5xl mx-auto relative z-10">

            {/* Header */}
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-neutral-400 text-xs font-medium mb-5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                Live product preview
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
                Everything you need,<br />
                <span className="text-neutral-500">nothing you don't</span>
              </h2>
              <p className="text-neutral-500 text-sm max-w-sm mx-auto">
                A focused workspace built around how teams actually work.
              </p>
            </div>

            {/* Feature highlight pills */}
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {['Real-time collaboration', 'Deadline tracking', 'AI suggestions', 'Project analytics'].map((f) => (
                <span key={f} className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-neutral-400 text-xs">
                  {f}
                </span>
              ))}
            </div>

            {/* App Preview */}
            <div className="relative">

              {/* Floating stat — top left */}
              <div className="hidden sm:flex absolute -top-4 -left-4 lg:-left-10 z-20 items-center gap-2.5 px-3 py-2.5 bg-neutral-900 border border-white/[0.08] rounded-xl shadow-xl">
                <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <FontAwesomeIcon icon={faChartSimple} className="text-violet-400 text-[10px]" />
                </div>
                <div>
                  <p className="text-[9px] text-neutral-500 leading-none mb-0.5">Completed this week</p>
                  <p className="text-white text-sm font-bold leading-none">12 tasks</p>
                </div>
              </div>

              {/* Floating stat — top right */}
              <div className="hidden sm:flex absolute -top-4 -right-4 lg:-right-10 z-20 items-center gap-2.5 px-3 py-2.5 bg-neutral-900 border border-white/[0.08] rounded-xl shadow-xl">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <FontAwesomeIcon icon={faBell} className="text-amber-400 text-[10px]" />
                </div>
                <div>
                  <p className="text-[9px] text-neutral-500 leading-none mb-0.5">Due today</p>
                  <p className="text-white text-sm font-bold leading-none">3 tasks</p>
                </div>
              </div>

              {/* Browser Chrome */}
              <div className="bg-[#111113] rounded-2xl border border-white/[0.07] overflow-hidden shadow-2xl shadow-black/70">
                {/* Window Controls */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.05] bg-[#0d0d0f]">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/70"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500/70"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500/70"></div>
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-white/[0.04] rounded-md text-neutral-500 text-[10px] font-mono">
                      <FontAwesomeIcon icon={faLock} className="text-[8px] text-neutral-600" />
                      taskflow.app/dashboard
                    </div>
                  </div>
                  <div className="w-12"></div>
                </div>

                {/* App Content */}
                <div className="flex min-h-[320px]">
                  {/* Sidebar */}
                  <div className="w-44 border-r border-white/[0.05] p-3 hidden sm:flex flex-col">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow-md shadow-white/10">
                        <span className="text-black text-[10px] font-black">T</span>
                      </div>
                      <span className="text-white text-xs font-semibold">BrightLine</span>
                    </div>

                    <p className="text-neutral-600 text-[9px] uppercase tracking-wider mb-1.5 px-2">Workspace</p>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.06]">
                        <FontAwesomeIcon icon={faHouse} className="text-white text-[10px]" />
                        <span className="text-white text-[11px] font-medium">Dashboard</span>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-neutral-500">
                        <FontAwesomeIcon icon={faListCheck} className="text-[10px]" />
                        <span className="text-[11px]">Tasks</span>
                        <span className="ml-auto text-[9px] bg-white/[0.06] text-neutral-400 px-1.5 py-0.5 rounded-full">5</span>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-neutral-500">
                        <FontAwesomeIcon icon={faCalendar} className="text-[10px]" />
                        <span className="text-[11px]">Calendar</span>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-neutral-500">
                        <FontAwesomeIcon icon={faChartSimple} className="text-[10px]" />
                        <span className="text-[11px]">Analytics</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/[0.05]">
                      <p className="text-neutral-600 text-[9px] uppercase tracking-wider mb-1.5 px-2">Projects</p>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 px-2 py-1.5 text-neutral-400">
                          <div className="w-2 h-2 rounded-sm bg-violet-500"></div>
                          <span className="text-[11px]">Website Redesign</span>
                        </div>
                        <div className="flex items-center gap-2 px-2 py-1.5 text-neutral-400">
                          <div className="w-2 h-2 rounded-sm bg-blue-500"></div>
                          <span className="text-[11px]">Mobile App</span>
                        </div>
                        <div className="flex items-center gap-2 px-2 py-1.5 text-neutral-400">
                          <div className="w-2 h-2 rounded-sm bg-emerald-500"></div>
                          <span className="text-[11px]">API v2</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 p-4 sm:p-5 overflow-hidden">
                    {/* Top stats */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="bg-white/[0.03] rounded-lg p-2.5 border border-white/[0.04]">
                        <p className="text-neutral-500 text-[9px] mb-1">Total Tasks</p>
                        <p className="text-white text-base font-bold">24</p>
                        <p className="text-emerald-400 text-[9px] mt-0.5">↑ 3 this week</p>
                      </div>
                      <div className="bg-white/[0.03] rounded-lg p-2.5 border border-white/[0.04]">
                        <p className="text-neutral-500 text-[9px] mb-1">In Progress</p>
                        <p className="text-white text-base font-bold">7</p>
                        <p className="text-amber-400 text-[9px] mt-0.5">3 due soon</p>
                      </div>
                      <div className="bg-white/[0.03] rounded-lg p-2.5 border border-white/[0.04]">
                        <p className="text-neutral-500 text-[9px] mb-1">Done</p>
                        <p className="text-white text-base font-bold">17</p>
                        <p className="text-neutral-500 text-[9px] mt-0.5">71% rate</p>
                      </div>
                    </div>

                    {/* Section header */}
                    <div className="flex items-center justify-between mb-2.5">
                      <p className="text-white text-xs font-semibold">Active Tasks</p>
                      <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-neutral-500 text-[9px] font-mono">⌘K</kbd>
                    </div>

                    {/* Task List */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-violet-500/[0.06] border border-violet-500/20">
                        <div className="w-4 h-4 rounded-full border-2 border-violet-500 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-[11px] font-medium truncate">Finalize landing page design</p>
                          <p className="text-neutral-500 text-[9px]">Website Redesign · Due today</p>
                        </div>
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[9px] flex-shrink-0">High</span>
                      </div>

                      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                        <div className="w-4 h-4 rounded-full border-2 border-blue-500 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-neutral-300 text-[11px] truncate">Set up CI/CD pipeline</p>
                          <p className="text-neutral-600 text-[9px]">Mobile App · Tomorrow</p>
                        </div>
                        <span className="px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[9px] flex-shrink-0">Med</span>
                      </div>

                      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                        <div className="w-4 h-4 rounded-full border-2 border-neutral-600 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-neutral-400 text-[11px] truncate">Write OpenAPI spec for v2 endpoints</p>
                          <p className="text-neutral-600 text-[9px]">API v2 · Mar 30</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-2.5 rounded-lg opacity-60">
                        <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                          <FontAwesomeIcon icon={faCheck} className="text-white text-[7px]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-neutral-500 text-[11px] line-through truncate">Write API documentation</p>
                        </div>
                        <span className="text-emerald-500 text-[9px] flex-shrink-0">Done</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badge — bottom right */}
              <div className="absolute -bottom-4 -right-2 sm:-right-8 z-20 flex items-center gap-2.5 px-3 py-2.5 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/30">
                <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                  <FontAwesomeIcon icon={faCheck} className="text-white text-[10px]" />
                </div>
                <div>
                  <p className="text-emerald-100 text-[9px] leading-none mb-0.5">Just now</p>
                  <p className="text-white text-xs font-semibold leading-none">Task completed!</p>
                </div>
              </div>

              {/* Floating badge — bottom left */}
              <div className="hidden sm:flex absolute -bottom-4 -left-2 sm:-left-8 z-20 items-center gap-2.5 px-3 py-2.5 bg-neutral-900 border border-white/[0.08] rounded-xl shadow-xl">
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <FontAwesomeIcon icon={faUserPlus} className="text-blue-400 text-[10px]" />
                </div>
                <div>
                  <p className="text-neutral-500 text-[9px] leading-none mb-0.5">Team invite</p>
                  <p className="text-white text-xs font-semibold leading-none">Alex joined!</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-16 text-center">
              <button
                onClick={() => {
                  setopenLogin(true);
                  setBlur(true);
                }}
                className="group inline-flex items-center gap-2.5 px-7 py-3.5 bg-white text-black rounded-full font-semibold text-sm hover:bg-neutral-100 transition-all shadow-lg shadow-white/10"
              >
                Start for free
                <FontAwesomeIcon icon={faArrowRight} className="text-xs group-hover:translate-x-1 transition-transform" />
              </button>
              <p className="text-neutral-600 text-xs mt-3">No credit card required · Takes 30 seconds</p>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-24 sm:py-36 px-4 sm:px-6 relative overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-50/80 via-white to-white pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-radial from-black/[0.03] to-transparent rounded-full pointer-events-none" />

          <div className="max-w-6xl mx-auto relative z-10">

            {/* Header */}
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-black/[0.05] rounded-full mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-medium text-neutral-500 tracking-wide uppercase">How it works</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold text-black tracking-tight leading-[1.1] mb-4">
                From zero to productive
              </h2>
              <p className="text-neutral-400 text-lg font-medium">in three simple steps.</p>
            </div>

            {/* Steps */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">

              {/* Connector line (desktop only) */}
              <div className="hidden lg:block absolute top-[3.25rem] left-[calc(33.33%+1.5rem)] right-[calc(33.33%+1.5rem)] h-px bg-gradient-to-r from-black/10 via-black/20 to-black/10 z-0" />

              {/* Step 1 */}
              <div className="group relative bg-white rounded-2xl border border-black/[0.07] p-7 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shadow-md shadow-black/20">
                    <FontAwesomeIcon icon={faUserPlus} className="text-white text-sm" />
                  </div>
                  <span className="text-4xl font-black text-black/[0.06] group-hover:text-black/[0.1] transition-colors leading-none">01</span>
                </div>
                <h3 className="text-lg font-bold text-black mb-2">Create an account</h3>
                <p className="text-neutral-500 text-sm leading-relaxed mb-6">
                  Sign up with just your email. No credit card, no wait. You're in within seconds.
                </p>
                {/* Mini preview */}
                <div className="bg-neutral-50 rounded-xl p-4 border border-black/[0.05] space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1 h-8 rounded-lg bg-white border border-black/[0.08] flex items-center px-3">
                      <div className="h-2 w-28 bg-black/[0.07] rounded" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 h-8 rounded-lg bg-white border border-black/[0.08] flex items-center px-3">
                      <div className="h-2 w-20 bg-black/[0.07] rounded" />
                    </div>
                  </div>
                  <div className="w-full h-8 rounded-lg bg-black flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">Continue with email</span>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="group relative bg-white rounded-2xl border border-black/[0.07] p-7 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/30">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="text-4xl font-black text-black/[0.06] group-hover:text-black/[0.1] transition-colors leading-none">02</span>
                </div>
                <h3 className="text-lg font-bold text-black mb-2">Create your project</h3>
                <p className="text-neutral-500 text-sm leading-relaxed mb-6">
                  Name it and go. Your workspace is ready instantly. Keep everything organized and focused.
                </p>
                {/* Mini preview */}
                <div className="bg-neutral-50 rounded-xl p-4 border border-black/[0.05] space-y-2.5">
                  {[
                    { letter: "W", name: "Website Redesign", tag: "Active", color: "from-violet-500 to-indigo-600" },
                    { letter: "M", name: "Mobile App v2", tag: "4 tasks", color: "from-emerald-400 to-teal-500" },
                  ].map((proj) => (
                    <div key={proj.name} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2.5 border border-black/[0.05]">
                      <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${proj.color} flex items-center justify-center text-white text-xs font-bold`}>{proj.letter}</div>
                      <span className="text-sm font-medium text-black flex-1">{proj.name}</span>
                      <span className="text-[10px] text-neutral-400">{proj.tag}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-black/[0.12] cursor-pointer hover:bg-white transition-colors">
                    <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    <span className="text-xs text-neutral-400">New project</span>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="group relative bg-white rounded-2xl border border-black/[0.07] p-7 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-400/30">
                    <FontAwesomeIcon icon={faCheck} className="text-white text-sm" />
                  </div>
                  <span className="text-4xl font-black text-black/[0.06] group-hover:text-black/[0.1] transition-colors leading-none">03</span>
                </div>
                <h3 className="text-lg font-bold text-black mb-2">Add tasks & ship</h3>
                <p className="text-neutral-500 text-sm leading-relaxed mb-6">
                  Break down your work, set priorities, check things off. Watch your progress compound.
                </p>
                {/* Mini preview */}
                <div className="bg-neutral-50 rounded-xl p-4 border border-black/[0.05] space-y-2.5">
                  {[
                    { done: true, label: "Design homepage layout" },
                    { done: true, label: "Build nav component" },
                    { done: false, label: "Implement dark mode", badge: "In Progress", badgeColor: "bg-amber-100 text-amber-600" },
                    { done: false, label: "Write unit tests", badge: "Todo", badgeColor: "bg-neutral-100 text-neutral-400" },
                  ].map((task) => (
                    <div key={task.label} className="flex items-center gap-2.5">
                      <div className={`w-4.5 h-4.5 flex-shrink-0 rounded-full flex items-center justify-center ${task.done ? "bg-emerald-500" : "border-2 border-black/[0.12] bg-white"}`} style={{ width: "18px", height: "18px" }}>
                        {task.done && <FontAwesomeIcon icon={faCheck} className="text-white" style={{ fontSize: "7px" }} />}
                      </div>
                      <span className={`text-xs flex-1 ${task.done ? "line-through text-neutral-400" : "text-neutral-700"}`}>{task.label}</span>
                      {task.badge && <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${task.badgeColor}`}>{task.badge}</span>}
                    </div>
                  ))}
                  {/* Progress bar */}
                  <div className="mt-1 pt-3 border-t border-black/[0.05]">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-neutral-400">Progress</span>
                      <span className="text-[10px] font-semibold text-emerald-600">50%</span>
                    </div>
                    <div className="h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
                      <div className="h-full w-1/2 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-14 text-center">
              <button
                onClick={() => {
                  setopenLogin(true);
                  setBlur(true);
                }}
                className="group inline-flex items-center gap-2.5 px-7 py-3.5 bg-black text-white text-sm font-semibold rounded-full hover:bg-neutral-800 transition-all shadow-xl shadow-black/10"
              >
                Get started — it's free
                <FontAwesomeIcon icon={faArrowRight} className="text-xs group-hover:translate-x-1 transition-transform" />
              </button>
              <p className="text-neutral-400 text-xs mt-3">No credit card required · Takes 30 seconds</p>
            </div>

          </div>
        </section>

        {/* Interactive Demo Section */}
       

        {/* Calendar Feature Section */}
        <section className="py-24 sm:py-32 px-4 sm:px-6 relative overflow-hidden">
          {/* Subtle background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/[0.01] to-transparent pointer-events-none"></div>
          
          <div className="max-w-6xl mx-auto relative z-10">
            {/* Two Column Layout */}
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              
              {/* Left - Content */}
              <div className="order-2 lg:order-1">
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-400 font-medium mb-3">
                  Calendar
                </p>
                <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-black mb-5 tracking-tight leading-[1.1]">
                  Your week,<br />at a glance
                </h2>
                <p className="text-neutral-500 text-base lg:text-lg leading-relaxed mb-8 max-w-md">
                  Stop switching between apps. See every deadline, meeting, and milestone in one clean view.
                </p>

                {/* Feature List - Minimal */}
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                      <FontAwesomeIcon icon={faCheck} className="text-white text-[8px]" />
                    </div>
                    <span className="text-neutral-700 text-sm">Week and month views</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                      <FontAwesomeIcon icon={faCheck} className="text-white text-[8px]" />
                    </div>
                    <span className="text-neutral-700 text-sm">Color-coded by project</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                      <FontAwesomeIcon icon={faCheck} className="text-white text-[8px]" />
                    </div>
                    <span className="text-neutral-700 text-sm">Drag to reschedule tasks</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setopenLogin(true);
                    setBlur(true);
                  }}
                  className="group inline-flex items-center gap-2 text-black font-medium text-sm hover:gap-3 transition-all"
                >
                  Try it free
                  <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                </button>
              </div>

              {/* Right - Calendar Visual */}
              <div className="order-1 lg:order-2">
                <div className="relative">
                  {/* Calendar Card */}
                  <div className="bg-white rounded-2xl border border-black/[0.08] shadow-2xl shadow-black/[0.08] overflow-hidden">
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-black/[0.06]">
                      <div className="flex items-center gap-3">
                        <h3 className="text-black font-semibold text-sm sm:text-base">{getMonth}</h3>
                        <div className="flex items-center gap-0.5">
                          <button 
                            onClick={() => prevMonth()}
                            className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg hover:bg-black/[0.04] flex items-center justify-center text-neutral-400 hover:text-black transition-colors"
                          >
                            <FontAwesomeIcon icon={faChevronLeft} className="text-[9px] sm:text-[10px]" />
                          </button>
                          <button 
                            onClick={() => nextMonth()}
                            className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg hover:bg-black/[0.04] flex items-center justify-center text-neutral-400 hover:text-black transition-colors"
                          >
                            <FontAwesomeIcon icon={faChevronRight} className="text-[9px] sm:text-[10px]" />
                          </button>
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-neutral-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        <span>4 tasks</span>
                      </div>
                    </div>

                    {/* Week Grid */}
                    <div className="grid grid-cols-7">
                      {/* Day Headers */}
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                        <div key={day} className="py-2 sm:py-3 text-center border-b border-black/[0.04]">
                          <span className="text-[10px] sm:text-[11px] text-neutral-400 font-medium uppercase tracking-wider">
                            {window.innerWidth < 640 ? day.charAt(0) : day}
                          </span>
                        </div>
                      ))}
                      
                      {/* Day Cells */}
                      {Array.from({length: 7}).map((_, index) => {
                        const currDay = new Date(weekStart);
                        currDay.setDate(currDay.getDate() + index);
                        const dayNum = currDay.getDate();
                        const isToday = currDay.toDateString() === new Date().toDateString();
                        
                        const tasks: {[key: number]: {text: string, color: string}[]} = {
                          1: [{ text: 'Standup', color: 'bg-blue-500' }],
                          2: [{ text: 'Design', color: 'bg-purple-500' }],
                          4: [
                            { text: 'Review', color: 'bg-amber-500' },
                            { text: 'Ship', color: 'bg-emerald-500' }
                          ],
                        };
                        const dayTasks = tasks[index] || [];
                        
                        return (
                          <div 
                            key={index} 
                            className={`min-h-[80px] sm:min-h-[100px] p-1.5 sm:p-2 border-r border-b border-black/[0.04] last:border-r-0 ${isToday ? 'bg-black/[0.02]' : ''}`}
                          >
                            <span className={`inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full text-[10px] sm:text-xs font-medium mb-1 ${
                              isToday ? 'bg-black text-white' : 'text-neutral-500'
                            }`}>
                              {dayNum}
                            </span>
                            
                            <div className="space-y-1">
                              {dayTasks.slice(0, 2).map((task, i) => (
                                <div key={i} className={`${task.color} rounded px-1.5 py-0.5 sm:py-1`}>
                                  <span className="text-white text-[9px] sm:text-[10px] font-medium truncate block">{task.text}</span>
                                </div>
                              ))}
                              {dayTasks.length > 2 && (
                                <span className="text-[9px] text-neutral-400">+{dayTasks.length - 2} more</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Floating accent - subtle */}
                  <div className="absolute -z-10 top-8 -right-8 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
                  <div className="absolute -z-10 -bottom-4 -left-4 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full blur-2xl"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us - Comparison Table */}
        <section className="py-24 sm:py-32 px-4 sm:px-6 border-y border-black/5">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 rounded-full border border-black/10 text-xs text-neutral-500 uppercase tracking-widest mb-6">
                Why BrightLine
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-black mb-6 tracking-tight">
                Simple beats complicated
              </h2>
              <p className="text-neutral-600 text-lg max-w-xl mx-auto">
                No bloated features. No learning curve. Just get things done.
              </p>
            </div>
            
            {/* Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                {/* Table Header */}
                <thead>
                  <tr className="border-b-2 border-black/10">
                    <th className="text-left p-4 pb-6"></th>
                    <th className="p-4 pb-6 text-center">
                      <div className="inline-flex flex-col items-center gap-2">
                        <div className="flex items-center justify-center font-bold text-[20px] w-12 h-12 bg-black text-white rounded-xl shadow-lg">
                          T
                        </div>
                        <span className="text-black font-bold text-base">BrightLine</span>
                      </div>
                    </th>
                    <th className="p-4 pb-6 text-center">
                      <div className="inline-flex flex-col items-center gap-2">
                        <div className="w-12 h-12 bg-[#0079BF]/20 rounded-xl flex items-center justify-center">
                          <FontAwesomeIcon icon={faTrello} className="text-[#0079BF] text-lg" />
                        </div>
                        <span className="text-neutral-500 font-medium">Trello</span>
                      </div>
                    </th>
                    <th className="p-4 pb-6 text-center">
                      <div className="inline-flex flex-col items-center gap-2">
                        <div className="w-12 h-12 bg-[#F06A6A]/20 rounded-xl flex items-center justify-center">
                          <FontAwesomeIcon icon={faCircleDot} className="text-[#F06A6A] text-lg" />
                        </div>
                        <span className="text-neutral-500 font-medium">Asana</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                
                <tbody>
                  <tr className="border-b border-black/10 bg-black/[0.02]">
                    <td className="p-4 text-black text-sm font-semibold">100% Free Forever</td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20">
                        <FontAwesomeIcon icon={faCheck} className="text-emerald-600 text-sm" />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-neutral-400 text-sm">Freemium</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-neutral-400 text-sm">Freemium</span>
                    </td>
                  </tr>
                  
                  <tr className="border-b border-black/10">
                    <td className="p-4 text-black text-sm font-semibold">Unlimited Projects</td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20">
                        <FontAwesomeIcon icon={faCheck} className="text-emerald-600 text-sm" />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-neutral-400 text-sm">10 boards</span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20">
                        <FontAwesomeIcon icon={faCheck} className="text-emerald-600 text-sm" />
                      </div>
                    </td>
                  </tr>
                  
                  <tr className="border-b border-black/10 bg-black/[0.02]">
                    <td className="p-4 text-black text-sm font-semibold">No Email Verification</td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20">
                        <FontAwesomeIcon icon={faCheck} className="text-emerald-600 text-sm" />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-500/20">
                        <FontAwesomeIcon icon={faXmark} className="text-red-500 text-sm" />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-500/20">
                        <FontAwesomeIcon icon={faXmark} className="text-red-500 text-sm" />
                      </div>
                    </td>
                  </tr>
                  
                  <tr className="border-b border-black/10">
                    <td className="p-4 text-black text-sm font-semibold">Native Dark Mode</td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20">
                        <FontAwesomeIcon icon={faCheck} className="text-emerald-600 text-sm" />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-500/20">
                        <FontAwesomeIcon icon={faXmark} className="text-red-500 text-sm" />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20">
                        <FontAwesomeIcon icon={faCheck} className="text-emerald-600 text-sm" />
                      </div>
                    </td>
                  </tr>
                  
                  <tr className="border-b border-black/10 bg-black/[0.02]">
                    <td className="p-4 text-black text-sm font-semibold">Keyboard Shortcuts</td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20">
                        <FontAwesomeIcon icon={faCheck} className="text-emerald-600 text-sm" />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20">
                        <FontAwesomeIcon icon={faCheck} className="text-emerald-600 text-sm" />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20">
                        <FontAwesomeIcon icon={faCheck} className="text-emerald-600 text-sm" />
                      </div>
                    </td>
                  </tr>
                  
                  <tr className="border-b border-black/10">
                    <td className="p-4 text-black text-sm font-semibold">Calendar View (Free)</td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20">
                        <FontAwesomeIcon icon={faCheck} className="text-emerald-600 text-sm" />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-neutral-400 text-sm">Premium</span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20">
                        <FontAwesomeIcon icon={faCheck} className="text-emerald-600 text-sm" />
                      </div>
                    </td>
                  </tr>
                  
                  <tr className="border-b border-black/10 bg-black/[0.02]">
                    <td className="p-4 text-black text-sm font-semibold">No Ads or Upsells</td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20">
                        <FontAwesomeIcon icon={faCheck} className="text-emerald-600 text-sm" />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-500/20">
                        <FontAwesomeIcon icon={faXmark} className="text-red-500 text-sm" />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-500/20">
                        <FontAwesomeIcon icon={faXmark} className="text-red-500 text-sm" />
                      </div>
                    </td>
                  </tr>
                  
                  <tr className="border-b border-black/10">
                    <td className="p-4 text-black text-sm font-semibold">Minimal, Focused UI</td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20">
                        <FontAwesomeIcon icon={faCheck} className="text-emerald-600 text-sm" />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-500/20">
                        <FontAwesomeIcon icon={faXmark} className="text-red-500 text-sm" />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-500/20">
                        <FontAwesomeIcon icon={faXmark} className="text-red-500 text-sm" />
                      </div>
                    </td>
                  </tr>
                  
                  <tr className="bg-black/[0.02]">
                    <td className="p-4 text-black text-sm font-semibold">Zero Learning Curve</td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20">
                        <FontAwesomeIcon icon={faCheck} className="text-emerald-600 text-sm" />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-neutral-400 text-sm">Moderate</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-neutral-400 text-sm">Steep</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <p className="text-center text-neutral-500 text-xs mt-8">
              * Comparison based on free tiers as of January 2025
            </p>
          </div>
        </section>


      

        {/* FAQ Section */}
         <section className="py-24 sm:py-32 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 rounded-full border border-black/10 text-xs text-neutral-500 uppercase tracking-widest mb-6">
                FAQ
              </span>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-black mb-6 tracking-tight">
                Questions? Answered.
              </h2>
            </div>

            <div className="space-y-4">

             
              <div onClick={()=> setExp(exp === 0 ? null : 0)} className={`p-6 bg-white/70 border ${exp === 0 ? 'border-black/20' : 'border-black/10'} rounded-2xl hover:bg-white/90 transition-all duration-300 cursor-pointer`}>
              <div className="flex justify-between items-start">
                <h3 className="text-black font-semibold pr-4">
                  Is BrightLine really free?
                </h3>
                <div className={`w-6 h-6 rounded-full ${exp === 0 ? 'bg-black' : 'bg-black/10'} flex items-center justify-center transition-all duration-300`}>
                  <FontAwesomeIcon icon={faPlus} className={`text-sm ${exp === 0 ? 'rotate-45 text-white' : 'text-neutral-500'} transition-all duration-200`} />
                </div>
              </div>
              <div 
                className={`overflow-hidden transition-all duration-300 ease-out ${exp === 0 ? 'max-h-40 opacity-100 mt-3' : 'max-h-0 opacity-0'}`}
              >
                <p className="text-neutral-600 text-sm leading-relaxed">
                  Yes, 100% free. This is a personal project built to learn and
                  demonstrate full-stack development. There are no paid plans,
                  no premium features, no hidden costs.
                </p>
              </div>
              </div>
             

              <div onClick={()=> setExp(exp === 1 ? null : 1)} className={`p-6 bg-white/70 border ${exp === 1 ? 'border-black/20' : 'border-black/10'} rounded-2xl hover:bg-white/90 transition-all duration-300 cursor-pointer`}>
              <div className="flex justify-between items-start">
                <h3 className="text-black font-semibold pr-4">
                  Is my data secure?
                </h3>
                <div className={`w-6 h-6 rounded-full ${exp === 1 ? 'bg-black' : 'bg-black/10'} flex items-center justify-center transition-all duration-300`}>
                  <FontAwesomeIcon icon={faPlus} className={`text-sm ${exp === 1 ? 'rotate-45 text-white' : 'text-neutral-500'} transition-all duration-200`} />
                </div>
              </div>
              <div 
                className={`overflow-hidden transition-all duration-300 ease-out ${exp === 1 ? 'max-h-40 opacity-100 mt-3' : 'max-h-0 opacity-0'}`}
              >
                <p className="text-neutral-600 text-sm leading-relaxed">
                  Your data is stored securely in a PostgreSQL database.
                  Passwords are hashed using industry-standard bcrypt
                  encryption. Authentication uses JWT tokens that expire after
                  one hour.
                </p>
              </div>
              </div>



              <div onClick={()=> setExp(exp === 2 ? null : 2)} className={`p-6 bg-white/70 border ${exp === 2 ? 'border-black/20' : 'border-black/10'} rounded-2xl hover:bg-white/90 transition-all duration-300 cursor-pointer`}>
              <div className="flex justify-between items-start">
                <h3 className="text-black font-semibold pr-4">
                   Can I use this for real projects?
                </h3>
                <div className={`w-6 h-6 rounded-full ${exp === 2 ? 'bg-black' : 'bg-black/10'} flex items-center justify-center transition-all duration-300`}>
                  <FontAwesomeIcon icon={faPlus} className={`text-sm ${exp === 2 ? 'rotate-45 text-white' : 'text-neutral-500'} transition-all duration-200`} />
                </div>
              </div>
              <div 
                className={`overflow-hidden transition-all duration-300 ease-out ${exp === 2 ? 'max-h-40 opacity-100 mt-3' : 'max-h-0 opacity-0'}`}
              >
                <p className="text-neutral-600 text-sm leading-relaxed">
                  Absolutely! While this started as a learning project, it's
                  fully functional. Create real projects, track real tasks, and
                  manage your actual work.
                </p>
              </div>
              </div>

              <div onClick={() => setExp(exp === 3 ? null : 3)} className={`p-6 bg-white/70 border ${exp === 3 ? 'border-black/20' : 'border-black/10'} rounded-2xl hover:bg-white/90 transition-all duration-300 cursor-pointer`}>
                <div className="flex justify-between items-start">
                  <h3 className="text-black font-semibold pr-4">
                    What technologies power BrightLine?
                  </h3>
                  <div className={`w-6 h-6 rounded-full ${exp === 3 ? 'bg-black' : 'bg-black/10'} flex items-center justify-center transition-all duration-300`}>
                    <FontAwesomeIcon icon={faPlus} className={`text-sm ${exp === 3 ? 'rotate-45 text-white' : 'text-neutral-500'} transition-all duration-200`} />
                  </div>
                </div>
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-out ${exp === 3 ? 'max-h-40 opacity-100 mt-3' : 'max-h-0 opacity-0'}`}
                >
                  <p className="text-neutral-600 text-sm leading-relaxed">
                    The frontend is built with React and TypeScript, styled with
                    Tailwind CSS. The backend uses Node.js with Express, connected
                    to a PostgreSQL database. Hosted and deployed for reliability.
                  </p>
                </div>
              </div>

              <div onClick={() => setExp(exp === 4 ? null : 4)} className={`p-6 bg-white/70 border ${exp === 4 ? 'border-black/20' : 'border-black/10'} rounded-2xl hover:bg-white/90 transition-all duration-300 cursor-pointer`}>
                <div className="flex justify-between items-start">
                  <h3 className="text-black font-semibold pr-4">
                    Will there be new features?
                  </h3>
                  <div className={`w-6 h-6 rounded-full ${exp === 4 ? 'bg-black' : 'bg-black/10'} flex items-center justify-center transition-all duration-300`}>
                    <FontAwesomeIcon icon={faPlus} className={`text-sm ${exp === 4 ? 'rotate-45 text-white' : 'text-neutral-500'} transition-all duration-200`} />
                  </div>
                </div>
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-out ${exp === 4 ? 'max-h-40 opacity-100 mt-3' : 'max-h-0 opacity-0'}`}
                >
                  <p className="text-neutral-600 text-sm leading-relaxed">
                    This project is actively maintained. New features and
                    improvements are added regularly as part of ongoing learning
                    and development.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Footer */}
        <footer className="bg-black pt-16 pb-8 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            {/* Top Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 pb-12 border-b border-neutral-800">
              {/* Brand Column */}
              <div className="col-span-2 md:col-span-4 lg:col-span-2">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
                    <span className="text-black text-sm font-black">T</span>
                  </div>
                  <span className="text-lg font-bold text-white">BrightLine</span>
                </div>
                <p className="text-neutral-400 text-sm leading-relaxed mb-6 max-w-xs">
                  The task manager built for developers who ship. Simple, fast, and free forever.
                </p>
                {/* Social Links */}
                <div className="flex items-center gap-3">
                  <a href="#" className="w-9 h-9 rounded-lg bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors">
                    <FontAwesomeIcon icon={faGithub} className="text-sm" />
                  </a>
                  <a href="#" className="w-9 h-9 rounded-lg bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors">
                    <FontAwesomeIcon icon={faTwitter} className="text-sm" />
                  </a>
                  <a href="#" className="w-9 h-9 rounded-lg bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors">
                    <FontAwesomeIcon icon={faDiscord} className="text-sm" />
                  </a>
                  <a href="#" className="w-9 h-9 rounded-lg bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors">
                    <FontAwesomeIcon icon={faLinkedin} className="text-sm" />
                  </a>
                </div>
              </div>

              {/* Product Column */}
              <div>
                <h4 className="text-white font-semibold text-sm mb-4">Product</h4>
                <ul className="space-y-3">
                  <li><a href="#" className="text-neutral-400 text-sm hover:text-white transition-colors">Features</a></li>
                  <li><a href="#" className="text-neutral-400 text-sm hover:text-white transition-colors">Pricing</a></li>
                  <li><a href="#" className="text-neutral-400 text-sm hover:text-white transition-colors">Changelog</a></li>
                  <li><a href="#" className="text-neutral-400 text-sm hover:text-white transition-colors">Roadmap</a></li>
                </ul>
              </div>

              {/* Resources Column */}
              <div>
                <h4 className="text-white font-semibold text-sm mb-4">Resources</h4>
                <ul className="space-y-3">
                  <li><a href="#" className="text-neutral-400 text-sm hover:text-white transition-colors">Documentation</a></li>
                  <li><a href="#" className="text-neutral-400 text-sm hover:text-white transition-colors">API Reference</a></li>
                  <li><a href="#" className="text-neutral-400 text-sm hover:text-white transition-colors">Blog</a></li>
                  <li><a href="#" className="text-neutral-400 text-sm hover:text-white transition-colors">Support</a></li>
                </ul>
              </div>

              {/* Company Column */}
              <div>
                <h4 className="text-white font-semibold text-sm mb-4">Company</h4>
                <ul className="space-y-3">
                  <li><a href="#" className="text-neutral-400 text-sm hover:text-white transition-colors">About</a></li>
                  <li><a href="#" className="text-neutral-400 text-sm hover:text-white transition-colors">Contact</a></li>
                  <li><a href="#" className="text-neutral-400 text-sm hover:text-white transition-colors">Brand</a></li>
                </ul>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-2 text-neutral-500 text-xs">
                <span>© 2025 BrightLine</span>
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-white transition-colors">Cookies</a>
              </div>
              
              {/* Status */}
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>All systems operational</span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>

      <div
        className={`${openLogin ? "block" : "hidden"}  fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-xl"
          onClick={() => {
            setopenLogin(false);
            setBlur(false);
          }}
        ></div>

        <div className="relative w-full max-w-4xl ">
          <div className="bg-white relative  border border-black/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/20">
            {/* Ambient glow effects */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#F58634]/[0.05] rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[#C3EFFE]/[0.3] rounded-full blur-[80px] pointer-events-none"></div>
            
            <div className="relative grid lg:grid-cols-5">
              {/* Left Panel - Branding & Features (hidden on mobile) */}
              <div className="hidden lg:flex lg:col-span-2 flex-col justify-between p-8 bg-gradient-to-br from-black/[0.02] to-transparent border-r border-black/[0.06]">
                {/* Top - Logo */}
                <div>
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-11 h-11 bg-black rounded-xl flex items-center justify-center shadow-lg shadow-black/20">
                      <span className="text-white text-lg font-black">T</span>
                    </div>
                    <div>
                      <span className="text-black font-bold text-lg">BrightLine</span>
                      <p className="text-neutral-500 text-[10px]">Task Management</p>
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-black mb-3 leading-tight">
                    Start shipping<br />faster today
                  </h3>
                  <p className="text-neutral-500 text-sm leading-relaxed">
                    Join thousands of developers who've simplified their workflow.
                  </p>
                </div>

                {/* Middle - Features */}
                <div className="space-y-4 my-8">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-black/[0.02] border border-black/[0.06]">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <FontAwesomeIcon icon={faInfinity} className="text-emerald-600 text-sm" />
                    </div>
                    <div>
                      <p className="text-black text-sm font-medium">Limited Projects on free plan</p>
                      <p className="text-neutral-500 text-[11px]">No restrictions on premium plan</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-black/[0.02] border border-black/[0.06]">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <FontAwesomeIcon icon={faBolt} className="text-blue-600 text-sm" />
                    </div>
                    <div>
                      <p className="text-black text-sm font-medium">Instant setup</p>
                      <p className="text-neutral-500 text-[11px]">Ready in seconds</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-black/[0.02] border border-black/[0.06]">
                    <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <FontAwesomeIcon icon={faShieldHalved} className="text-purple-600 text-sm" />
                    </div>
                    <div>
                      <p className="text-black text-sm font-medium">Enterprise security</p>
                      <p className="text-neutral-500 text-[11px]">Your data is safe</p>
                    </div>
                  </div>
                </div>

                {/* Bottom - Social proof */}
                <div className="pt-6 border-t border-black/[0.06]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-400 to-neutral-600 border-2 border-white flex items-center justify-center text-white text-[10px] font-bold">JD</div>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F58634] to-[#e85d04] border-2 border-white flex items-center justify-center text-white text-[10px] font-bold">AK</div>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-black to-neutral-600 border-2 border-white flex items-center justify-center text-white text-[10px] font-bold">MR</div>
                      <div className="w-8 h-8 rounded-full bg-black/10 border-2 border-white flex items-center justify-center text-black text-[10px] font-medium">+2k</div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <i key={i} className="fa-solid fa-star text-amber-400 text-[10px]"></i>
                      ))}
                    </div>
                  </div>
                  <p className="text-neutral-500 text-xs">Soon to be Trusted by people</p>
                </div>
              </div>

              {/* Right Panel - Form */}
              <div className="lg:col-span-3 p-6 sm:p-8">
                {/* Mobile logo (shown only on small screens) */}
                <div className="flex lg:hidden items-center justify-between mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center">
                      <span className="text-white text-sm font-black">T</span>
                    </div>
                    <span className="text-black font-bold">BrightLine</span>
                  </div>
                  <button
                    onClick={() => {
                      setopenLogin(false);
                      setBlur(false);
                    }}
                    className="w-9 h-9 rounded-xl hover:bg-black/[0.05] flex items-center justify-center text-neutral-400 hover:text-black transition-all"
                  >
                    <FontAwesomeIcon icon={faXmark} className="text-sm" />
                  </button>
                </div>

                {/* Desktop close button */}
                <button
                  onClick={() => {
                    setopenLogin(false);
                    setBlur(false);
                  }}
                  className="hidden lg:flex absolute top-4 right-4 w-9 h-9 rounded-xl hover:bg-black/[0.05] items-center justify-center text-neutral-400 hover:text-black transition-all z-10"
                >
                  <FontAwesomeIcon icon={faXmark} className="text-sm" />
                </button>

                {/* Header */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-black mb-1">
                    {loginPage === "login" ? "Welcome back" :  loginPage === "register" ? "Create account" : "Reset Your Password"}
                  </h2>
                  <p className="text-neutral-500 text-sm">
                    {loginPage === "login" 
                      ? "Enter your credentials to access your account" 
                      : loginPage === "register" ? "Get started with your free account today"
                      : "Please type correct credentials"
                      }
                  </p>
                </div>
                
                {/* Toggle tabs */}
                <div className="relative flex items-center p-1 bg-black/[0.03] border border-black/[0.06] rounded-xl mb-6">
                  <div 
                    className="absolute left-1 top-1 bottom-1 w-[calc(33.333%-4px)] bg-black rounded-lg transition-transform duration-300 ease-out will-change-transform"
                    style={{
                      transform: loginPage === "login" 
                        ? "translateX(0%)" 
                        : loginPage === "register" 
                          ? "translateX(calc(100% + 4px))" 
                          : "translateX(calc(200% + 8px))"
                    }}
                  ></div>
                  <button
                    onClick={() => setloginPage("login")}
                    className={`relative flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors duration-300 ${
                      loginPage === "login" ? "text-white" : "text-neutral-500 hover:text-black"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setloginPage("register")}
                    className={`relative flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors duration-300 ${
                      loginPage === "register" ? "text-white" : "text-neutral-500 hover:text-black"
                    }`}
                  >
                    Sign Up
                  </button>
                  <button
                    onClick={() => setloginPage("forgotPassword")}
                    className={`relative flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors duration-300 ${
                      loginPage === "forgotPassword" ? "text-white" : "text-neutral-500 hover:text-black"
                    }`}
                  >
                    Reset
                  </button>
                </div>

                {loginPage === "login" ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      login();
                    }}
                    className="space-y-4 "
                  >
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Email address
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                          <FontAwesomeIcon icon={faEnvelope} className="text-sm" />
                        </div>
                        <input
                          className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-black/[0.02] border border-black/[0.08] text-black placeholder-neutral-400 focus:border-black/20 focus:bg-black/[0.04] outline-none transition-all text-sm"
                          type="email"
                          placeholder="name@company.com"
                          value={loginEmail}
                          onChange={(e) => setloginEmail(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                          <FontAwesomeIcon icon={faLock} className="text-sm" />
                        </div>
                        <input
                          className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-black/[0.02] border border-black/[0.08] text-black placeholder-neutral-400 focus:border-black/20 focus:bg-black/[0.04] outline-none transition-all text-sm"
                          type="password"
                          placeholder="••••••••••"
                          value={loginPass}
                          onChange={(e) => setloginPass(e.target.value)}
                        />
                      </div>
                    </div>

                  {/* Forgot password section  ---------------------------*/}

                       <div>
                        <span onClick={()=> setloginPage('forgotPassword')} className="text-xs text-neutral-500 hover:cursor-pointer cursor:text-underline">Forgot Password</span>
                       </div>





                    <button
                      className={`relative w-full py-4 mt-2 bg-black text-white font-bold rounded-xl hover:bg-neutral-800 active:scale-[0.98] transition-all text-sm shadow-lg shadow-black/20 group
                        ${status === 'blocked' ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                      type="submit"
                      disabled={status === 'loading' || status === 'blocked'}
                    >
                      {status === "loading" ? (
                        <Spinner />
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          Sign In
                          <FontAwesomeIcon icon={faArrowRight} className="text-xs group-hover:translate-x-1 transition-transform" />
                        </span>
                      )}
                    </button>

                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-black/[0.08]"></div>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-3 bg-neutral-400 rounded text-white">or continue with</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        type="button"
                        disabled
                        className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-black/[0.02] border border-black/[0.08] text-neutral-600 text-sm font-medium hover:bg-black/[0.04] hover:border-black/[0.12] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <FontAwesomeIcon icon={faGoogle} className="text-base" />
                        <span>Google</span>
                      </button>
                      <button 
                        type="button"
                        disabled
                        className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-black/[0.02] border border-black/[0.08] text-neutral-600 text-sm font-medium hover:bg-black/[0.04] hover:border-black/[0.12] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <FontAwesomeIcon icon={faGithub} className="text-base" />
                        <span>GitHub</span>
                      </button>
                    </div>

                    <p className="text-center text-neutral-400 text-[11px] mt-4">
                      Social login coming soon
                    </p>
                  </form>
                ) : loginPage === 'register' ?  (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      registerUser();
                      navig();
                    }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          First name
                        </label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                            <FontAwesomeIcon icon={faUser} className="text-sm" />
                          </div>
                          <input
                            className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-black/[0.02] border border-black/[0.08] text-black placeholder-neutral-400 focus:border-black/20 focus:bg-black/[0.04] outline-none transition-all text-sm"
                            type="text"
                            placeholder="John"
                            value={firstname}
                            onChange={(e) => setFirstname(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Last name
                        </label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                            <FontAwesomeIcon icon={faUser} className="text-sm" />
                          </div>
                          <input
                            className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-black/[0.02] border border-black/[0.08] text-black placeholder-neutral-400 focus:border-black/20 focus:bg-black/[0.04] outline-none transition-all text-sm"
                            type="text"
                            placeholder="Doe"
                            value={last}
                            onChange={(e) => setLast(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Email address
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                          <FontAwesomeIcon icon={faEnvelope} className="text-sm" />
                        </div>
                        <input
                          className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-black/[0.02] border border-black/[0.08] text-black placeholder-neutral-400 focus:border-black/20 focus:bg-black/[0.04] outline-none transition-all text-sm"
                          type="email"
                          placeholder="name@company.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                          <FontAwesomeIcon icon={faLock} className="text-sm" />
                        </div>
                        <input
                          className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-black/[0.02] border border-black/[0.08] text-black placeholder-neutral-400 focus:border-black/20 focus:bg-black/[0.04] outline-none transition-all text-sm"
                          type="password"
                          placeholder="••••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <button
                      className={`relative w-full py-4 mt-2 bg-black text-white font-bold rounded-xl hover:bg-neutral-800 active:scale-[0.98] transition-all text-sm shadow-lg shadow-black/20 group
                        ${status === 'blocked' ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                      type="submit"
                      disabled={status === 'loading' || status === 'blocked'}
                    >
                      <span className="flex items-center justify-center gap-2">
                        Create Account
                        <FontAwesomeIcon icon={faArrowRight} className="text-xs group-hover:translate-x-1 transition-transform" />
                      </span>
                    </button>

                    <p className="text-center text-neutral-500 text-xs mt-4">
                      By signing up, you agree to our{" "}
                      <span className="text-black/70 hover:text-black cursor-pointer">Terms</span>
                      {" "}and{" "}
                      <span className="text-black/70 hover:text-black cursor-pointer">Privacy Policy</span>
                    </p>
                  </form>
                ) 
                :
                <div>
                  <form onSubmit={(e)=> {e.preventDefault(), resetPassword()}}>
                     <div className="space-y-1.5">
                      <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Email address
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                          <FontAwesomeIcon icon={faEnvelope} className="text-sm" />
                        </div>
                        <input
                          required
                          className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-black/[0.02] border border-black/[0.08] text-black placeholder-neutral-400 focus:border-black/20 focus:bg-black/[0.04] outline-none transition-all text-sm"
                          type="email"
                          placeholder="name@company.com"
                          
                          onChange={(e) => setResetEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        New Password
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                          <FontAwesomeIcon icon={faLock} className="text-sm" />
                        </div>
                        <input
                          required
                          className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-black/[0.02] border border-black/[0.08] text-black placeholder-neutral-400 focus:border-black/20 focus:bg-black/[0.04] outline-none transition-all text-sm"
                          type="password"
                          placeholder="••••••••••"
                          
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>
                    </div>
                    

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                          <FontAwesomeIcon icon={faLock} className="text-sm" />
                        </div>
                        <input
                          className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-black/[0.02] border border-black/[0.08] text-black placeholder-neutral-400 focus:border-black/20 focus:bg-black/[0.04] outline-none transition-all text-sm"
                          type="password"
                          placeholder="••••••••••"
                         
                          required
                          onChange={(e) => {e.preventDefault(), setConfirmPassword(e.target.value)}}
                        />
                      </div>
                    </div>
                    <button
                      className={`relative w-full py-4 mt-4 bg-black text-white font-bold rounded-xl hover:bg-neutral-800 active:scale-[0.98] transition-all text-sm shadow-lg shadow-black/20 group
                        ${status === 'blocked' ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                      type="submit"
                      disabled={status === 'loading' || status === 'blocked'}
                    >
                      <span className="flex items-center justify-center gap-2">
                        Create Account
                        <FontAwesomeIcon icon={faArrowRight} className="text-xs group-hover:translate-x-1 transition-transform" />
                      </span>
                    </button>
                    
                  </form>
                </div>
              } 
             
               
            

                {/* Bottom trust indicators */}
                <div className="mt-6 pt-6 border-t border-black/[0.06]">
                  <div className="flex items-center justify-center gap-6 text-[11px] text-neutral-500">
                    <div className="flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faLock} className="text-emerald-500 text-[10px]" />
                      <span>256-bit SSL</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faShieldHalved} className="text-blue-500 text-[10px]" />
                      <span>SOC 2</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faCheck} className="text-purple-500 text-[10px]" />
                      <span>GDPR</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagePage;
