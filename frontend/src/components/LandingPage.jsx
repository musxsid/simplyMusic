import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, ArrowRight, Play, Sun, Moon, Home as HomeIcon, Compass, DollarSign, Info, Shield, Zap, Cloud, Check } from 'lucide-react';

const LandingPage = () => {
  const [animationState, setAnimationState] = useState('idle'); // idle, animating, completed, transitioning
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const getCookie = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
      return null;
    };
    const savedTheme = getCookie('theme') || localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      document.cookie = "theme=dark; path=/; max-age=31536000";
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      document.cookie = "theme=light; path=/; max-age=31536000";
    }
  };

  const handleStart = () => {
    if (animationState === 'idle') {
      setAnimationState('animating');
    }
  };

  const scrollToSection = (id, index) => {
    setActiveTab(index);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Listen to scroll to update active tab naturally (optional enhancement)
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['hero', 'explore', 'pricing', 'about'];
      let current = 0;
      for (let i = 0; i < sections.length; i++) {
        const el = document.getElementById(sections[i]);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= window.innerHeight / 3 && rect.bottom >= window.innerHeight / 3) {
            current = i;
          }
        }
      }
      setActiveTab(current);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const translateClasses = [
    'translate-x-0',
    'translate-x-[100%]',
    'translate-x-[200%]',
    'translate-x-[300%]'
  ];

  return (
    <div className="bg-slate-50 dark:bg-slate-950 flex flex-col items-center relative overflow-x-hidden font-sans text-slate-800 dark:text-slate-100 transition-colors duration-1000">
      
      {/* Full Screen Cinematic Wipe Transition */}
      <AnimatePresence>
        {animationState === 'transitioning' && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
          >
            <motion.div 
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: 150, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeIn" }}
              onAnimationComplete={() => {
                window.location.href = 'http://localhost:8080/oauth2/authorization/keycloak';
              }}
              className="w-10 h-10 bg-gradient-to-br from-primary-500 to-rose-600 rounded-full shadow-[0_0_100px_rgba(244,63,94,0.8)]"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-20 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl" />
      </div>

      {/* Sticky Navbar */}
      <nav className="fixed top-0 left-0 w-full bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 px-4 lg:px-8 py-4 flex items-center justify-between z-50 transition-all">
        {/* Left: Logo */}
        <div className="flex items-center gap-3 w-auto lg:w-1/4 group cursor-pointer" onClick={() => scrollToSection('hero', 0)}>
          <div className="bg-gradient-to-br from-primary-400 to-primary-600 p-2.5 rounded-2xl text-white shadow-lg shadow-primary-500/30 hidden sm:flex items-center justify-center transform transition-all duration-300 group-hover:scale-105 group-hover:rotate-3 group-hover:shadow-primary-500/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/20 w-full h-full -skew-x-12 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            <Music className="w-5 h-5 relative z-10" strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-extrabold tracking-tighter hidden lg:block transition-transform duration-300 group-hover:scale-[1.02]">
            <span className="text-slate-800 dark:text-white">simply</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary-500 to-rose-500">Music</span>
          </span>
        </div>
        
        {/* Center: Sliding Tab Bar */}
        <div className="flex justify-center flex-1 px-2">
          <div className="relative flex items-center p-1 bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur-md rounded-full shadow-inner border border-slate-200 dark:border-slate-700 w-full max-w-[500px]">
            <div 
              className={`absolute top-1 bottom-1 w-[calc(25%-2px)] bg-white dark:bg-slate-700 rounded-full shadow-sm border border-slate-100 dark:border-slate-600 transition-transform duration-300 ease-in-out ${translateClasses[activeTab]}`}
            />
            <button
              onClick={() => scrollToSection('hero', 0)}
              className={`relative flex-1 py-2 text-xs sm:text-sm font-bold z-10 transition-colors duration-300 flex items-center justify-center gap-1 sm:gap-2 ${activeTab === 0 ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              <HomeIcon className="w-4 h-4 hidden sm:block" /> Home
            </button>
            <button
              onClick={() => scrollToSection('explore', 1)}
              className={`relative flex-1 py-2 text-xs sm:text-sm font-bold z-10 transition-colors duration-300 flex items-center justify-center gap-1 sm:gap-2 ${activeTab === 1 ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              <Compass className="w-4 h-4 hidden sm:block" /> Explore
            </button>
            <button
              onClick={() => scrollToSection('pricing', 2)}
              className={`relative flex-1 py-2 text-xs sm:text-sm font-bold z-10 transition-colors duration-300 flex items-center justify-center gap-1 sm:gap-2 ${activeTab === 2 ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              <DollarSign className="w-4 h-4 hidden sm:block" /> Pricing
            </button>
            <button
              onClick={() => scrollToSection('about', 3)}
              className={`relative flex-1 py-2 text-xs sm:text-sm font-bold z-10 transition-colors duration-300 flex items-center justify-center gap-1 sm:gap-2 ${activeTab === 3 ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              <Info className="w-4 h-4 hidden sm:block" /> About
            </button>
          </div>
        </div>

        {/* Right: Theme Toggle */}
        <div className="flex items-center justify-end gap-4 w-auto lg:w-1/4">
          <button
            onClick={toggleDarkMode}
            className="w-10 h-10 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full flex items-center justify-center hover:shadow-md transition-all active:scale-95 border border-slate-200/50 dark:border-slate-700/50"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="relative z-10 flex flex-col items-center justify-center w-full min-h-screen max-w-5xl px-6 text-center pt-20">
        {/* Animated Figure Area */}
        <div 
          onClick={handleStart}
          className="relative w-64 h-64 sm:w-80 sm:h-80 mb-12 flex items-center justify-center mt-12 cursor-pointer group"
        >
          {/* Abstract Head */}
          <motion.div 
            className="absolute w-32 h-40 sm:w-40 sm:h-48 bg-slate-200 dark:bg-slate-800 rounded-[3rem] shadow-inner flex flex-col items-center justify-end pb-8 z-10 transition-transform group-hover:scale-105"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Simple face elements (eyes) */}
            <div className="flex gap-4 sm:gap-6 opacity-30">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-slate-600 dark:bg-slate-400 rounded-full" />
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-slate-600 dark:bg-slate-400 rounded-full" />
            </div>
            {/* Smile appears when headphones are on */}
            <motion.div 
              className="mt-6 w-8 sm:w-10 h-2 sm:h-3 border-b-4 border-slate-600 dark:border-slate-400 rounded-full opacity-30"
              initial={{ scaleX: 0.2, opacity: 0 }}
              animate={['completed', 'transitioning'].includes(animationState) ? { scaleX: 1, opacity: 0.5 } : { scaleX: 0.2, opacity: 0 }}
              transition={{ duration: 0.5 }}
            />
          </motion.div>

          {/* Headphones */}
          <motion.div
            className="absolute z-20 w-44 sm:w-52 h-44 sm:h-52 flex items-center justify-between px-1"
            initial={{ y: -150, opacity: 0 }}
            animate={
              animationState === 'idle' ? { y: -80, opacity: 1 } : 
              { y: 10, opacity: 1 }
            }
            transition={{ 
              y: { type: "spring", stiffness: 50, damping: 12, duration: 1.5 },
              opacity: { duration: 0.5 }
            }}
            onAnimationComplete={(definition) => {
              if (animationState === 'animating' && definition.y === 10) {
                setAnimationState('completed');
                // Trigger the full screen wipe a moment after the music notes pop out
                setTimeout(() => setAnimationState('transitioning'), 800);
              }
            }}
          >
            {/* Headband */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 sm:w-48 h-24 sm:h-28 border-[12px] sm:border-[16px] border-primary-500 rounded-t-[5rem] sm:rounded-t-[6rem] border-b-0" />
            {/* Left Earcup */}
            <div className="w-8 sm:w-10 h-16 sm:h-20 bg-slate-800 dark:bg-slate-100 rounded-l-2xl shadow-lg relative -left-1 sm:-left-2 z-10" />
            {/* Right Earcup */}
            <div className="w-8 sm:w-10 h-16 sm:h-20 bg-slate-800 dark:bg-slate-100 rounded-r-2xl shadow-lg relative -right-1 sm:-right-2 z-10" />
            
            {/* Music Waves when completed */}
            <AnimatePresence>
              {['completed', 'transitioning'].includes(animationState) && (
                <>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1, type: "spring" }}
                    className="absolute -left-10 top-0 text-primary-500"
                  >
                    <Music className="w-6 h-6 animate-bounce" />
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="absolute -right-8 -top-6 text-rose-500"
                  >
                    <Music className="w-8 h-8 animate-pulse" />
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-2xl"
        >
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-br from-slate-800 to-slate-500 dark:from-white dark:to-slate-400">
            Experience Music <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-rose-500">Like Never Before.</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 mb-10 font-medium leading-relaxed">
            A distributed, enterprise-grade music streaming and cataloging platform built for audiophiles and power users.
          </p>

          <AnimatePresence mode="wait">
            {animationState === 'idle' && (
              <motion.button
                key="start-btn"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStart}
                className="group inline-flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-lg shadow-xl shadow-slate-900/20 dark:shadow-white/10 transition-all hover:shadow-2xl"
              >
                Wear Headphones to Start
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            )}
            
            {animationState !== 'idle' && (
              <motion.div 
                key="loading-text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-primary-500 font-bold text-lg animate-pulse h-[60px] flex items-center justify-center"
              >
                Connecting to Identity Provider...
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* Explore Section */}
      <section id="explore" className="relative z-10 w-full min-h-screen py-24 px-6 flex flex-col items-center justify-center">
        <div className="max-w-6xl w-full">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-800 dark:text-white mb-4">Enterprise Features</h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">Built on a highly scalable microservice architecture to deliver uncompromising audio quality.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 transition-transform duration-300"
            >
              <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center mb-6">
                <Cloud className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">Distributed Storage</h3>
              <p className="text-slate-500 dark:text-slate-400">Powered by MinIO for lightning-fast S3-compatible object storage, ensuring your high-res audio loads instantly.</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
              className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 transition-transform duration-300"
            >
              <div className="w-14 h-14 bg-rose-100 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">Real-time Analytics</h3>
              <p className="text-slate-500 dark:text-slate-400">Track your listening habits with RabbitMQ-driven asynchronous event processing and Redis caching.</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.05 }}
              className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 transition-transform duration-300"
            >
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">Secure Authentication</h3>
              <p className="text-slate-500 dark:text-slate-400">Fully integrated with Keycloak Identity and Access Management for secure OAuth2/OpenID Connect authentication.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 w-full py-24 px-6 flex flex-col items-center justify-center bg-slate-100/50 dark:bg-slate-900/50 border-y border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-6xl w-full">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-800 dark:text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">Start listening for free, upgrade when you need more power.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Tier */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-lg border border-slate-200 dark:border-slate-800 relative transition-transform duration-300"
            >
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Listener</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-5xl font-black text-slate-800 dark:text-white">$0</span>
                <span className="text-slate-500 dark:text-slate-400">/ forever</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300"><Check className="w-5 h-5 text-primary-500" /> Web playback up to 320kbps</li>
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300"><Check className="w-5 h-5 text-primary-500" /> Basic playlist management</li>
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300"><Check className="w-5 h-5 text-primary-500" /> Ad-supported streaming</li>
              </ul>
              <button onClick={() => scrollToSection('hero', 0)} className="w-full py-4 rounded-2xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                Get Started
              </button>
            </motion.div>
            
            {/* Pro Tier */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-primary-900 to-rose-900 p-10 rounded-[2.5rem] shadow-2xl shadow-primary-900/30 border border-primary-500/30 relative transform md:-translate-y-4 transition-transform duration-300"
            >
              <div className="absolute top-0 right-8 -translate-y-1/2 bg-gradient-to-r from-primary-500 to-rose-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Audiophile</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-5xl font-black text-white">$9.99</span>
                <span className="text-rose-200/70">/ month</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-white"><Check className="w-5 h-5 text-rose-400" /> Lossless FLAC & ALAC streaming</li>
                <li className="flex items-center gap-3 text-white"><Check className="w-5 h-5 text-rose-400" /> Advanced analytics dashboard</li>
                <li className="flex items-center gap-3 text-white"><Check className="w-5 h-5 text-rose-400" /> Unlimited track uploads</li>
                <li className="flex items-center gap-3 text-white"><Check className="w-5 h-5 text-rose-400" /> Zero advertisements</li>
              </ul>
              <button onClick={() => scrollToSection('hero', 0)} className="w-full py-4 rounded-2xl font-bold bg-gradient-to-r from-primary-500 to-rose-500 text-white hover:from-primary-400 hover:to-rose-400 transition-colors shadow-lg">
                Upgrade to Audiophile
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="relative z-10 w-full py-24 px-6 flex flex-col items-center justify-center">
        <div className="max-w-3xl w-full text-center">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="w-20 h-20 bg-slate-200 dark:bg-slate-800 rounded-3xl mx-auto flex items-center justify-center mb-8 rotate-12 shadow-lg">
            <Music className="w-10 h-10 text-primary-500 -rotate-12" />
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-4xl font-black text-slate-800 dark:text-white mb-6">About simplyMusic</motion.h2>
          <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed mb-10">
            simplyMusic was built with a singular vision: to create a music platform that respects both the art of sound and the science of software engineering. By leveraging a modern microservice architecture, we provide a robust, resilient, and blazing-fast experience.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="flex gap-4 justify-center">
            <a href="mailto:contact@simplymusic.app" className="px-8 py-3 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-bold hover:bg-primary-200 dark:hover:bg-primary-800/50 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary-500/10">
              Contact Support
            </a>
          </motion.div>
        </div>
      </section>
      
      <footer className="w-full py-8 text-center text-slate-400 dark:text-slate-600 text-sm border-t border-slate-200/50 dark:border-slate-800/50 z-10 relative">
        &copy; 2026 simplyMusic Enterprise. All rights reserved.
      </footer>

    </div>
  );
};

export default LandingPage;
