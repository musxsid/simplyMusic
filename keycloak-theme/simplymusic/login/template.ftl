<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true displayRequiredFields=false>
<!DOCTYPE html>
<html lang="${lang}" id="kc-html">

<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${msg("loginTitle",(realm.displayName!''))}</title>
    <link rel="icon" href="${url.resourcesPath}/img/favicon.ico" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Inter', 'system-ui', 'sans-serif'],
                    },
                    colors: {
                        primary: {
                            100: '#e0e7ff',
                            200: '#c7d2fe',
                            300: '#a5b4fc',
                            400: '#818cf8',
                            500: '#6366f1',
                            600: '#4f46e5',
                            700: '#4338ca',
                            800: '#3730a3',
                            900: '#312e81',
                        },
                        rose: {
                            400: '#fb7185',
                            500: '#f43f5e',
                            600: '#e11d48',
                        }
                    }
                }
            }
        }
    </script>
    <script>
        // Sync theme with cookies/localStorage from the main app
        function getCookie(name) {
            const value = '; ' + document.cookie;
            const parts = value.split('; ' + name + '=');
            if (parts.length === 2) return parts.pop().split(';').shift();
            return null;
        }

        const savedTheme = getCookie('theme') || localStorage.getItem('theme');
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }

        function toggleTheme() {
            if (document.documentElement.classList.contains('dark')) {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
                document.cookie = "theme=light; path=/; max-age=31536000";
            } else {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
                document.cookie = "theme=dark; path=/; max-age=31536000";
            }
        }
    </script>
    <style>
        @keyframes shimmer {
            100% { transform: translateX(100%); }
        }
        body {
            background-color: transparent;
        }
        #particle-canvas {
            position: fixed;
            top: 0; left: 0; width: 100vw; height: 100vh;
            z-index: -1;
            background-color: #f8fafc;
            transition: background-color 0.3s ease;
        }
        html.dark #particle-canvas {
            background-color: #020617;
        }
        /* 3D Tilt Container */
        #login-card-container {
            perspective: 1000px;
        }
        #login-card {
            transition: transform 0.1s ease-out, box-shadow 0.1s ease-out;
            transform-style: preserve-3d;
        }
    </style>
</head>

<body class="text-slate-800 dark:text-slate-100 min-h-screen flex flex-col font-sans transition-colors duration-300">
    
    <canvas id="particle-canvas"></canvas>

    <!-- Navbar / Header area -->
    <nav class="w-full px-4 lg:px-8 py-6 flex items-center justify-between">
        <!-- Logo & Back Button -->
        <div class="flex items-center gap-4">
            <button type="button" onclick="window.location.href='http://localhost:5173/'" class="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm" aria-label="Back to Home">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div class="flex items-center gap-3 w-auto group cursor-pointer" onclick="window.location.href='http://localhost:5173/'">
                <div class="bg-gradient-to-br from-primary-400 to-primary-600 p-2.5 rounded-2xl text-white shadow-lg shadow-primary-500/30 flex items-center justify-center transform transition-all duration-300 group-hover:scale-105 group-hover:rotate-3 group-hover:shadow-primary-500/50 relative overflow-hidden">
                    <div class="absolute inset-0 bg-white/20 w-full h-full -skew-x-12 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" style="animation: shimmer 1.5s infinite;"></div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="relative z-10"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                </div>
                <span class="text-2xl font-extrabold tracking-tighter transition-transform duration-300 group-hover:scale-[1.02] hidden sm:block">
                    <span class="text-slate-800 dark:text-white">simply</span>
                    <span class="text-transparent bg-clip-text bg-gradient-to-br from-primary-500 to-rose-500">Music</span>
                </span>
            </div>
        </div>

        <!-- Theme Toggle -->
        <button type="button" onclick="toggleTheme()" class="w-10 h-10 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full flex items-center justify-center hover:shadow-md transition-all active:scale-95 border border-slate-200/50 dark:border-slate-700/50">
            <svg class="w-5 h-5 hidden dark:block" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            <svg class="w-5 h-5 block dark:hidden" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
        </button>
    </nav>

    <!-- Main Content -->
    <div id="login-card-container" class="flex-1 flex items-center justify-center p-4">
        <div id="login-card" class="w-full max-w-md bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/60 dark:border-slate-700/50 rounded-3xl shadow-2xl p-8 relative overflow-hidden">
            
            <#if displayMessage && message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
                <div class="mb-6 p-4 rounded-xl text-sm font-medium border ${((message.type == 'error')?then('bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50', 'bg-primary-50 text-primary-600 border-primary-200 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-800/50'))}">
                    ${kcSanitize(message.summary)?no_esc}
                </div>
            </#if>

            <#nested "form">
        </div>
    </div>
    <script>
        // 3D Tilt Effect
        const cardContainer = document.getElementById('login-card-container');
        const card = document.getElementById('login-card');
        let mouseX = -1000;
        let mouseY = -1000;
        
        if (cardContainer && card) {
            cardContainer.addEventListener('mousemove', function(e) {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = ((y - centerY) / centerY) * -5; // max 5 deg
                const rotateY = ((x - centerX) / centerX) * 5;  // max 5 deg
                
                card.style.transform = 'perspective(1000px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) scale3d(1.02, 1.02, 1.02)';
                card.style.boxShadow = (-rotateY * 2) + 'px ' + (rotateX * 2 + 20) + 'px 30px rgba(0,0,0,0.1)';
            });
            
            cardContainer.addEventListener('mouseleave', function() {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
                card.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
            });
        }

        // Particle Network Effect
        const canvas = document.getElementById('particle-canvas');
        const ctx = canvas.getContext('2d');
        let width, height;
        let particles = [];
        
        function resize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resize);
        resize();

        window.addEventListener('mousemove', function(e) {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 1;
                this.vy = (Math.random() - 0.5) * 1;
                this.radius = Math.random() * 2 + 1;
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                if (this.x < 0 || this.x > width) this.vx = -this.vx;
                if (this.y < 0 || this.y > height) this.vy = -this.vy;
            }
            draw() {
                const isDark = document.documentElement.classList.contains('dark');
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = isDark ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.6)';
                ctx.fill();
            }
        }

        for (let i = 0; i < 80; i++) particles.push(new Particle());

        function animate() {
            ctx.clearRect(0, 0, width, height);
            const isDark = document.documentElement.classList.contains('dark');
            
            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();
                
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < 150) {
                        ctx.beginPath();
                        ctx.strokeStyle = isDark ? 'rgba(99, 102, 241, ' + (1 - dist/150) * 0.2 + ')' : 'rgba(99, 102, 241, ' + (1 - dist/150) * 0.3 + ')';
                        ctx.lineWidth = 1;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
                
                const mx = particles[i].x - mouseX;
                const my = particles[i].y - mouseY;
                const mDist = Math.sqrt(mx * mx + my * my);
                if (mDist < 200) {
                    ctx.beginPath();
                    ctx.strokeStyle = isDark ? 'rgba(244, 63, 94, ' + (1 - mDist/200) * 0.5 + ')' : 'rgba(244, 63, 94, ' + (1 - mDist/200) * 0.5 + ')';
                    ctx.lineWidth = 1.5;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(mouseX, mouseY);
                    ctx.stroke();
                }
            }
            requestAnimationFrame(animate);
        }
        animate();
    </script>
</body>
</html>
</#macro>
