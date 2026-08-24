// Interactive Particle & Custom Cursor Logic
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
const cursor = document.getElementById('custom-cursor');
let particles = [];
let mouse = { x: null, y: null, targetX: null, targetY: null };
// Touch devices: no mouse, so skip the custom-cursor animation loop entirely
const isCoarsePointer = window.matchMedia ? window.matchMedia('(pointer: coarse)').matches : false;
// Respect users who prefer reduced motion: skip cursor/particles/tilt animation and use instant scrolling
const prefersReducedMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;

function resizeCanvas() { 
  canvas.width = canvas.parentElement.offsetWidth; 
  canvas.height = canvas.parentElement.offsetHeight; 
}
resizeCanvas(); 
globalThis.addEventListener('resize', resizeCanvas);

globalThis.addEventListener('mousemove', (e) => {
  mouse.targetX = e.clientX;
  mouse.targetY = e.clientY;
  if (mouse.x === null) { mouse.x = e.clientX; mouse.y = e.clientY; }
});

class Particle {
  constructor() { this.reset(); }
  reset() { 
    this.x = Math.random()*canvas.width; 
    this.y = Math.random()*canvas.height; 
    this.vx = (Math.random()-0.5)*0.4; 
    this.vy = (Math.random()-0.5)*0.4; 
    this.radius = Math.random()*1.5+0.5; 
    this.opacity = Math.random()*0.5+0.2;
    // Theme-aware coloring
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
        this.color = Math.random() > 0.5 ? '99, 102, 241' : '168, 85, 247'; // Indigo/Purple
    } else {
        this.color = '100, 100, 100'; // Subtle Grey
    }
  }
  update() { 
    if (mouse.x !== null) {
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 120) {
        const angle = Math.atan2(dy, dx);
        const force = (120 - dist) / 120;
        this.x -= Math.cos(angle) * force * 2;
        this.y -= Math.sin(angle) * force * 2;
      }
    }
    this.x+=this.vx; 
    this.y+=this.vy; 
    if(this.x<0||this.x>canvas.width||this.y<0||this.y>canvas.height) this.reset(); 
  }
  draw() { 
    ctx.beginPath(); 
    ctx.arc(this.x,this.y,this.radius,0,Math.PI*2); 
    ctx.fillStyle=`rgba(${this.color},${this.opacity})`; 
    ctx.fill(); 
  }
}

// Particle Configuration & Throttling
const isMobile = window.innerWidth < 768;
const particleCount = isMobile ? 25 : 80; 
for(let i=0;i<particleCount;i++) particles.push(new Particle());

let animationFrameId;
const canvasObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      if (prefersReducedMotion) return; // Reduced motion: keep the particle canvas static
      // Defer particle start on all devices to prioritize first paint & reduce TBT
      if (!animationFrameId) {
        const startParticles = () => { if (!animationFrameId) animateParticles(); };
        if (typeof requestIdleCallback !== 'undefined') {
          requestIdleCallback(startParticles, { timeout: 2000 });
        } else {
          setTimeout(startParticles, 500);
        }
      }
    } else {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  });
}, { threshold: 0.1 });
canvasObserver.observe(canvas.parentElement);

function updateCursor() {
  if (isCoarsePointer || prefersReducedMotion) return; // No custom cursor on touch / reduced-motion; avoids a forever-running rAF loop
  if (mouse.targetX !== null) {
    // Slower tracking for a more deliberate "lag" effect (0.08 instead of 0.15)
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;
    cursor.style.display = 'block';
    cursor.style.left = `${mouse.x}px`;
    cursor.style.top = `${mouse.y}px`;
  }
  requestAnimationFrame(updateCursor);
}
// Defer cursor animation start to reduce initial main-thread blocking
if (typeof requestIdleCallback !== 'undefined') {
  requestIdleCallback(updateCursor, { timeout: 1500 });
} else {
  setTimeout(updateCursor, 300);
}

function animateParticles() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  particles.forEach(p=>{p.update();p.draw();});
  // Optimized: skip connection drawing on 40% of frames to reduce TBT
  const frameSkip = animationFrameId % 3 !== 0;
  if (!frameSkip) {
    const isDark = document.documentElement.classList.contains('dark');
    const connColor = isDark ? `99,102,241` : `150,150,150`;
    particles.forEach((a,i)=>{ 
      for (let j=i+1;j<particles.length;j++) {
        const b = particles[j];
        const dx = a.x - b.x;
        if (Math.abs(dx) > 100) continue;
        const dy = a.y - b.y;
        if (Math.abs(dy) > 100) continue;
        const d=Math.hypot(dx,dy); 
        if(d<100){
          ctx.beginPath();
          ctx.moveTo(a.x,a.y);
          ctx.lineTo(b.x,b.y);
          ctx.strokeStyle=`rgba(${connColor},${0.12*(1-d/100)})`;
          ctx.stroke();
        }
      }
    });
  }
  animationFrameId = requestAnimationFrame(animateParticles);
}
// Note: Initial call removed to let IntersectionObserver start animation

// Hover effect listeners
function setupCursorHovers() {
  if (isCoarsePointer || prefersReducedMotion) return;
  document.querySelectorAll('a, button, .project-card-click').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
  });
}
setupCursorHovers();

// Re-setup on project filters (since elements are dynamic)
const originalRenderProjects = renderProjects;
window.renderProjects = function(filter) {
  originalRenderProjects(filter);
  setTimeout(setupCursorHovers, 500); // Wait for DOM render
};

// Auto-update Footer Year
const yearSpan = document.getElementById('current-year');
if (yearSpan) yearSpan.textContent = new Date().getFullYear();

// Scroll Reveal
const observer = new IntersectionObserver((entries)=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target);}});},{threshold:0.1,rootMargin:'0px 0px -50px 0px'});
document.querySelectorAll('.fade-up').forEach(el=>observer.observe(el));

// Mobile Menu
const menuToggle=document.getElementById('menu-toggle'), mobileMenu=document.getElementById('mobile-menu'), menuOverlay=document.getElementById('menu-overlay'), menuClose=document.getElementById('menu-close');
function openMobileMenu(){mobileMenu.classList.add('open');menuOverlay.classList.remove('hidden');}
function closeMobileMenu(){mobileMenu.classList.remove('open');menuOverlay.classList.add('hidden');}
menuToggle.addEventListener('click',openMobileMenu);
menuClose.addEventListener('click',closeMobileMenu);

// Close mobile menu on Escape key (accessibility)
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && mobileMenu.classList.contains('open')) closeMobileMenu();
});

// Smooth Scroll
// Smooth Scroll (honors prefers-reduced-motion)
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
}
document.querySelectorAll('a[href^="#"]:not(.skip-link)').forEach(a=>{a.addEventListener('click',function(e){e.preventDefault();const href=this.getAttribute('href');if(href==='#'){scrollToTop();return;}const t=document.querySelector(href);if(t)t.scrollIntoView({behavior: prefersReducedMotion ? 'auto' : 'smooth', block:'start'});});});

// Skip-to-content: scroll AND move sequential focus to the target for screen readers
const skipLink = document.querySelector('.skip-link');
if (skipLink) {
  skipLink.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
      target.focus({ preventScroll: true });
    }
  });
}

// Active Nav & Go To Top Logic
const sections=document.querySelectorAll('section[id]');
const navLinks=document.querySelectorAll('.nav-link');
const goTopBtn=document.getElementById('go-to-top');
const scrollProgress=document.getElementById('scroll-progress');
const floatingCta=document.getElementById('floating-cta');
const navbar=document.getElementById('navbar');
window.addEventListener('scroll',()=>{
  // Compact navbar after scrolling past the hero (~80vh)
  if (navbar) {
    if (window.scrollY > window.innerHeight * 0.8) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  }
  let cur='';
  sections.forEach(s=>{if(window.scrollY>=s.offsetTop-200)cur=s.id;});
  navLinks.forEach(l=>{l.classList.remove('active');if(l.getAttribute('href')==='#'+cur)l.classList.add('active');});
  
  // Go to top button visibility (shows after 400px of scrolling)
  if(window.scrollY > 400) {
    goTopBtn.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-4');
  } else {
    goTopBtn.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4');
  }

  // Scroll progress bar (top of viewport)
  if (scrollProgress) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    scrollProgress.style.transform = `scaleX(${progress})`;
  }

  // Floating "Let's talk" pill after ~1.5 viewport heights
  if (floatingCta) {
    if (window.scrollY > window.innerHeight * 1.5) {
      floatingCta.classList.remove('translate-y-24', 'opacity-0', 'pointer-events-none');
    } else {
      floatingCta.classList.add('translate-y-24', 'opacity-0', 'pointer-events-none');
    }
  }
});

// --- Theme Management ---
function updateThemeIcons() {
    const isDark = document.documentElement.classList.contains('dark');
    // Update all theme toggle icons to show the opposite mode (the target mode)
    document.querySelectorAll('.theme-toggle-icon').forEach(el => {
        el.innerText = isDark ? 'light_mode' : 'dark_mode';
    });
}

function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeIcons();
    applyThemeToIcons();
    particles.forEach(p => p.reset());
}

// --- Theme-aware skill logos ---
// Skill logos are stored theme-neutral (no hardcoded dark/light variant).
// themedIconUrl() resolves the correct variant for the active theme; it is used
// both at render time and for hot-swapping <img> srcs on theme toggle.
// simpleicons glyphs use the official brand color in light mode (via `brand`)
// and flip to white in dark mode so they stay visible on dark surfaces.
function themedIconUrl(base, dark, brand) {
    if (base.includes('skillicons.dev')) {
        // skillicons: theme=light = light tile + dark glyph, theme=dark = dark tile + light glyph
        return `${base}${base.includes('?') ? '&' : '?'}theme=${dark ? 'dark' : 'light'}`;
    }
    if (base.includes('cdn.simpleicons.org')) {
        // simpleicons: single-color glyph — official brand color on light, white on dark
        return `${base}/${dark ? 'ffffff' : (brand || '000000')}`;
    }
    return base;
}

function skillIconUrl(skill, dark = document.documentElement.classList.contains('dark')) {
    return themedIconUrl((skill && skill.icon) || '', dark, skill && skill.brand);
}

function isExternalIcon(skill) {
    return /^https?:\/\//.test((skill && skill.icon) || '');
}

// Swap every rendered external logo to the active theme's variant.
// Runs before first paint (to avoid a wrong-theme flash) and on theme toggle.
function applyThemeToIcons() {
    const dark = document.documentElement.classList.contains('dark');
    document.querySelectorAll('img[data-icon-base]').forEach(img => {
        img.src = themedIconUrl(
            img.getAttribute('data-icon-base'),
            dark,
            img.getAttribute('data-icon-color')
        );
    });
}

// Initialize Theme - saved preference wins, otherwise follow the OS preference
// (an inline head script already applies this before first paint to avoid a flash)
let savedTheme = null;
try { savedTheme = localStorage.getItem('theme'); } catch (e) {}
const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
const initialDark = savedTheme ? savedTheme === 'dark' : prefersDarkScheme;
if (initialDark) {
    document.documentElement.classList.add('dark');
} else {
    document.documentElement.classList.remove('dark');
}
updateThemeIcons();
// Fix external logo variants before first paint (deferred script runs post-parse,
// pre-paint) so dark-mode visitors never see a light-theme icon flash.
applyThemeToIcons();

document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
document.getElementById('mobile-theme-toggle').addEventListener('click', toggleTheme);

// Notification Toast Engine
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' ? 'check_circle' : 'error';
  toast.innerHTML = `
    <span class="material-symbols-outlined text-${type === 'success' ? 'green-400' : 'red-400'}">${icon}</span>
    <span>${message}</span>
  `;
  
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('visible'));
  
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

// Contact Form Refined Logic
const form = document.getElementById('contact-form');
const submitBtn = form.querySelector('button[type="submit"]');

if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Disable UI
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span> Sending...';
      
      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      }).then(r => {
        if (r.ok) {
          showToast('Thanks! Your message has been sent.', 'success');
          form.reset();
        } else {
          showToast('Oops! There was a problem submitting.', 'error');
        }
      }).catch(() => {
        showToast('Oops! Something went wrong. Check your connection.', 'error');
      }).finally(() => {
        // Re-enable UI
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Send Message <span class="material-symbols-outlined">send</span>';
      });
    });
}

/* ==========================================================================
   DYNAMIC PROJECTS & FILTERING LOGIC
   ========================================================================== */

// DOM Elements
const projectsContainer = document.getElementById('projects-container');
const filterBtns = document.querySelectorAll('.filter-btn');
const filterIndicator = document.querySelector('.filter-indicator');
const projectModal = document.getElementById('project-modal');
const projectModalContent = document.getElementById('project-modal-content');
const projectModalBackdrop = document.getElementById('project-modal-backdrop');

// --- Accessibility helpers for the project modal ---
let lastFocusedElement = null;
let closeModalTimer = null;

// Mark everything behind the modal as inert so keyboard & screen-reader users can't reach it
function setPageInert(inert) {
  document.querySelectorAll('body > *').forEach(el => {
    if (el === projectModal || el.id === 'toast-container' || el.id === 'custom-cursor' || el.id === 'go-to-top') return;
    if (inert) el.setAttribute('inert', '');
    else el.removeAttribute('inert');
  });
}

// Keep Tab / Shift+Tab cycling inside the open modal
function trapModalFocus(e) {
  if (e.key !== 'Tab' || projectModal.classList.contains('hidden')) return;
  const focusables = projectModalContent.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
  if (focusables.length === 0) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}
projectModal.addEventListener('keydown', trapModalFocus);

// Initialize Filter Indicator Position
function updateFilterIndicator(activeBtn) {
  if (!activeBtn || window.innerWidth < 768) return; // Don't animate on mobile (indicator is hidden)
  filterIndicator.style.width = activeBtn.offsetWidth + 'px';
  filterIndicator.style.left = activeBtn.offsetLeft + 'px';
}

// Attach filter listeners
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => {
      b.classList.remove('active', 'text-white');
      b.classList.add('text-on-surface-variant');
    });
    btn.classList.add('active', 'text-white');
    btn.classList.remove('text-on-surface-variant');
    updateFilterIndicator(btn);
    
    // Trigger filter
    const filter = btn.getAttribute('data-filter');
    renderProjects(filter);
  });
});

// Window resize indicator updates
window.addEventListener('resize', () => {
  const activeBtn = document.querySelector('.filter-btn.active');
  updateFilterIndicator(activeBtn);
});

// Render Projects Logic
function renderProjects(filter = 'all') {
  const container = document.getElementById('projects-container');
  if (!container) return;
  
  // Fade out before re-render
  container.style.opacity = '0';
  container.style.transform = 'translateY(10px)';
  
  setTimeout(() => {
    container.innerHTML = '';
    
    // Safety check for data
    const data = window.projectData || [];
    if (data.length === 0) {
      container.innerHTML = '<div class="text-center py-20 text-on-surface-variant font-medium">Data loading or no projects found...</div>';
      container.style.opacity = '1';
      return;
    }

    // Filter logic
    const filtered = filter === 'all' ? data
      : filter === 'featured' ? data.filter(p => p.featured)
      : data.filter(p => p.type === filter);
    
    // UI Layout Strategy: 
    // Case studies use a stylized Bento Grid.
    // Personal/Mini projects use a clean, modern card grid.
    
    const caseStudies = filtered.filter(p => p.type === 'case-study');
    const personal = filtered.filter(p => p.type === 'personal');
    const mini = filtered.filter(p => p.type === 'mini-project');

    // 1. RENDER CASE STUDIES (High-End Bento)
    if (caseStudies.length > 0) {
      const bento = document.createElement('div');
      bento.className = 'grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 mb-12';
      
      caseStudies.forEach((p, i) => {
        // Deterministic but dynamic layout pattern
        const colSpan = i === 0 ? 'md:col-span-8' : (i % 3 === 0 ? 'md:col-span-6' : 'md:col-span-4');
        const height = i === 0 ? 'h-[400px] sm:h-[480px] md:h-[580px]' : 'h-[300px] sm:h-[340px] md:h-[420px]';
        const stagger = `stagger-${(i % 5) + 1}`;

        // Engineering-precision: surface headline metrics from the case-study data
        const met = p.sections && p.sections.find(s => s.type === 'metrics');
        const metricChips = met && met.stats ? met.stats.slice(0, 2).map(s => {
          const v = s.post ? `${s.pre} → ${s.post}` : (s.value ?? '—');
          return `<span class="spec-chip spec-chip--invert spec-chip--metric" title="${v}">${v}</span>`;
        }).join('') : '';
        
        const card = `
          <div class="${colSpan} group relative ${height} overflow-hidden rounded-2xl bg-surface-container-high fade-up ${stagger} cursor-pointer project-card-click" data-id="${p.id}">
             <!-- Premium Shimmer & Initials Fallback -->
             <div class="absolute inset-0 bg-surface-container-lowest overflow-hidden">
                <div class="absolute inset-0 flex items-center justify-center text-[12rem] font-black text-white/[0.03] uppercase select-none">${p.title.charAt(0)}</div>
                <img src="${p.heroImage}" class="absolute inset-0 w-full h-full object-cover opacity-40 transition-all duration-700 group-hover:scale-105 group-hover:opacity-60" 
                     alt="${p.title} Case Study | S M Iftykhar Ul Alam"
                     loading="lazy"
                     onerror="console.warn('Image failed to load:', '${p.heroImage}'); this.style.display='none'; this.parentElement.classList.add('shimmer-bg')">
             </div>
             
             <!-- Glass Overlays -->
             <div class="absolute inset-0 bg-gradient-to-t from-[#131313] via-[#131313]/60 to-transparent transition-opacity duration-500 group-hover:opacity-80"></div>
             
             <!-- Content -->
             <div class="absolute inset-x-0 bottom-0 p-6 md:p-10 card-tilt">
                <div class="card-tilt-inner">
                   <div class="flex flex-wrap gap-2 mb-4">
                      <span class="px-3 py-1 bg-primary text-on-primary backdrop-blur-md border border-primary/40 rounded-md text-[9px] font-mono font-bold tracking-widest uppercase">CASE STUDY</span>
                      ${p.categories.slice(0,2).map(c => `<span class="px-3 py-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-md text-[9px] font-mono font-bold tracking-widest uppercase text-white/80">${c}</span>`).join('')}
                   </div>
                   <h3 class="text-2xl md:text-3xl lg:text-4xl font-headline font-extrabold mb-3 leading-tight text-white group-hover:text-primary transition-colors">${p.title}</h3>
                   <p class="text-white/70 text-sm md:text-base line-clamp-2 max-w-xl mb-6 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">${p.description || (p.sections && p.sections[0] ? p.sections[0].shortSummary : 'Detailed Case Study')}</p>
                   ${metricChips ? `<div class="hidden md:flex flex-wrap gap-2 mb-5">${metricChips}</div>` : ''}
                   <div class="flex items-center gap-3 font-headline font-bold text-[#4CD7F6] transition-transform group-hover:translate-x-2">
                      <span class="text-xs uppercase tracking-widest">Explore Discovery</span>
                      <span class="material-symbols-outlined text-[20px]">north_east</span>
                   </div>
                </div>
             </div>
             
             <!-- Visual Soul (Corner Glow) -->
             <div class="absolute -right-20 -top-20 w-64 h-64 bg-primary/20 rounded-full blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          </div>
        `;
        bento.insertAdjacentHTML('beforeend', card);
      });
      container.appendChild(bento);
    }

    // 2. RENDER PERSONAL + MINI (Sleek Clean Grid)
    const otherProjects = [...personal, ...mini];
    if (otherProjects.length > 0) {
      const grid = document.createElement('div');
      grid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-12 border-t border-outline-variant dark:border-white/5';
      
      otherProjects.forEach((p, i) => {
        const stagger = `stagger-${(i % 4) + 1}`;
        const item = `
          <div class="group flex flex-col rounded-2xl bg-surface-container-low hover:bg-surface-bright transition-all duration-500 overflow-hidden fade-up ${stagger} border border-outline-variant dark:border-white/5 hover:border-primary/20 dark:hover:border-white/10 hover:shadow-2xl hover:shadow-primary/5">
            <div class="relative w-full h-48 overflow-hidden bg-surface-container-high">
              <img src="${p.heroImage}" class="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110" 
                   alt="${p.title} Project UI | Iftykhar Alam"
                   loading="lazy"
                   onerror="console.warn('Image failed to load:', '${p.heroImage}'); this.parentElement.classList.add('shimmer-bg'); this.style.display='none'">
              <div class="absolute top-4 left-4">
                 <span class="px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[9px] font-label font-bold tracking-tighter uppercase text-white/50">${p.type === 'mini-project' ? 'Exploration' : 'Personal Build'}</span>
              </div>
            </div>
            <div class="p-6 flex flex-col flex-grow">
              <h3 class="font-headline font-bold text-lg mb-2 text-on-surface group-hover:text-primary transition-colors">${p.title}</h3>
              <p class="text-on-surface-variant text-sm mb-6 flex-grow line-clamp-3 leading-relaxed">${p.description || 'Modern frontend architectural implementation.'}</p>
              <div class="flex items-center justify-between mt-auto">
                 <div class="flex gap-2">
                    ${p.categories.slice(0,1).map(c => `<span class="text-[10px] font-label font-bold text-on-surface-variant/60 uppercase tracking-widest">${c}</span>`)}
                 </div>
                 <a href="${p.websiteUrl}" target="_blank" class="text-tertiary hover:text-primary transition-colors">
                    <span class="material-symbols-outlined text-[20px]">open_in_new</span>
                 </a>
              </div>
            </div>
          </div>
        `;
        grid.insertAdjacentHTML('beforeend', item);
      });
      container.appendChild(grid);
    }
    
    // Fade in
    requestAnimationFrame(() => {
       container.style.opacity = '1';
       container.style.transform = 'translateY(0)';
       
       // Re-observe new elements
       document.querySelectorAll('#projects-container .fade-up').forEach(el => {
          el.classList.remove('visible'); // reset for new observer trigger
          observer.observe(el);
       });
       
       // Init effects
       initCardEffects();
    });
  }, 300);
}

// -----------------------------------------
// Interactive Effects (Tilt & Hover Soul)
// -----------------------------------------
function initCardEffects() {
  const tiltWrappers = document.querySelectorAll('.project-card-click');
  const useTilt = window.innerWidth > 1024 && !prefersReducedMotion; // Desktop only, unless user prefers reduced motion
  
  if (useTilt) {
    tiltWrappers.forEach(wrap => {
      const tilt = wrap.querySelector('.card-tilt');
      
      wrap.addEventListener('mousemove', e => {
        const rect = wrap.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -4;
        const rotateY = ((x - centerX) / centerX) * 4;
        
        if (tilt) {
           tilt.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
           tilt.style.transition = 'none';
        }
      });
      
      wrap.addEventListener('mouseleave', () => {
        if (tilt) {
           tilt.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
           tilt.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
        }
      });
      
      // Click event for Case Study
      wrap.addEventListener('click', () => {
         const id = wrap.getAttribute('data-id');
         const project = window.projectData.find(x => x.id === id);
         if (project) openModal(project);
      });
    });
  } else {
    // Mobile: Just attach click
    tiltWrappers.forEach(wrap => {
       wrap.addEventListener('click', () => {
          const id = wrap.getAttribute('data-id');
          const project = window.projectData.find(x => x.id === id);
          if (project) openModal(project);
       });
    });
  }
}

// -----------------------------------------
// Modal Logic
// -----------------------------------------
function openModal(project) {
  // Cancel any pending close transition so a quick reopen isn't hidden by the previous close
  if (closeModalTimer) { clearTimeout(closeModalTimer); closeModalTimer = null; }
  
  // Lock body scroll
  document.body.style.overflow = 'hidden';
  
  // Accessibility: remember the trigger, label the dialog, and hide the background page
  lastFocusedElement = document.activeElement;
  projectModal.setAttribute('aria-label', `${project.title} — case study`);
  setPageInert(true);
  
  // Build Modal Content
  let headerSec = '';
  let solutionSec = '';
  let metricsSec = '';

  if(project.sections && project.sections.length > 0) {
     const vis = project.sections.find(s=>s.type === 'vision');
     const sol = project.sections.find(s=>s.type === 'solution');
     const met = project.sections.find(s=>s.type === 'metrics');

     if (vis) {
         headerSec = `
            <div class="mb-12">
                <h4 class="text-sm font-label uppercase tracking-widest text-primary mb-3">// The Vision</h4>
                <p class="text-lg md:text-xl leading-relaxed text-on-surface/90 mb-6">${vis.fullDescription}</p>
                ${vis.servicesProvided ? `
                  <div class="flex flex-wrap gap-2">
                     ${vis.servicesProvided.map(s => `<span class="spec-chip">${s}</span>`).join('')}
                  </div>
                `: ''}
            </div>
         `;
     }

     if (sol) {
         solutionSec = `
            <div class="mb-12 p-6 md:p-8 bg-surface-container rounded-xl border border-outline-variant dark:border-white/5 relative overflow-hidden">
                <div class="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-[80px]"></div>
                <h4 class="text-sm font-label uppercase tracking-widest text-tertiary mb-6 relative z-10">// ${sol.header}</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    ${(sol.features||[]).map(f => `
                        <div>
                           <h5 class="font-headline font-bold text-white mb-2">${f.title}</h5>
                           <p class="text-sm text-on-surface-variant">${f.desc}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
         `;
     }

     if (met) {
         metricsSec = `
            <div class="border-t border-outline-variant dark:border-white/5 pt-10 mt-10">
                <h4 class="text-sm font-label uppercase tracking-widest text-on-surface-variant mb-8 text-center">// ${met.header}</h4>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                   ${(met.stats||[]).map(s => {
                       // Support both plain {label, value} stats and before/after {label, pre, post, impact} stats
                       const statValue = s.post ? `${s.pre} → ${s.post}` : (s.value ?? '—');
                       const statImpact = s.impact ? `<div class="text-[10px] font-label text-on-surface-variant/80 mt-2">${s.impact}</div>` : '';
                       return `
                       <div class="p-5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors border border-outline-variant dark:border-white/5">
                           <div class="text-xl md:text-2xl metric-value text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-1.5">${statValue}</div>
                           <div class="text-[10px] md:text-xs font-label uppercase tracking-widest text-on-surface-variant">${s.label}</div>
                           ${statImpact}
                       </div>
                   `;
                   }).join('')}
                </div>
            </div>
         `;
     }
  } else {
      headerSec = `<p class="text-lg text-on-surface-variant">${project.description || 'Detailed case study coming soon.'}</p>`;
  }

  projectModalContent.innerHTML = `
    <!-- Top Nav / Close -->
    <div class="sticky top-0 z-50 flex justify-between items-center p-4 md:p-6 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant dark:border-white/5">
        <div class="flex gap-2 items-center">
            ${project.categories.slice(0,2).map(c=>`<span class="text-xs font-label uppercase tracking-widest text-on-surface-variant">${c}</span>`).join('<span class="text-white/20">•</span>')}
        </div>
        <button id="modal-close-btn" class="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors">
            <span class="material-symbols-outlined text-white">close</span>
        </button>
    </div>

    <!-- Hero Image Area -->
    <div class="relative w-full h-64 md:h-80 bg-surface-container-high overflow-hidden shrink-0">
        <img src="${project.heroImage}" class="w-full h-full object-cover opacity-60" alt="${project.title}" loading="lazy" onerror="console.warn('Modal image failed:', '${project.heroImage}'); this.onerror=null; this.src=''; this.parentElement.classList.add('shimmer-bg');"/>
        <div class="absolute inset-0 bg-gradient-to-t from-surface-container-lowest to-transparent"></div>
        <div class="absolute bottom-6 px-6 md:px-10 w-full flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
               <h2 class="text-3xl md:text-5xl font-headline font-extrabold tracking-tight mb-3">${project.title}</h2>
               <div class="flex flex-wrap gap-2">
                  <span class="spec-chip spec-chip--invert"><span class="material-symbols-outlined text-[13px]">domain</span> ${project.client || 'Personal'}</span>
                  <span class="spec-chip spec-chip--invert"><span class="material-symbols-outlined text-[13px]">location_on</span> ${project.location || 'Global'}</span>
                  <span class="spec-chip spec-chip--invert"><span class="material-symbols-outlined text-[13px]">calendar_month</span> ${project.date ? project.date.split('-').reverse().join('/') : '—'}</span>
               </div>
            </div>
            <a href="${project.websiteUrl}" target="_blank" class="px-6 py-3 rounded-full bg-white text-[#131313] font-label font-bold tracking-widest uppercase text-xs hover:bg-white/90 transition-colors shrink-0 text-center">Visit Live Site</a>
        </div>
    </div>

    <!-- Content Body -->
    <div class="p-6 md:p-10 lg:p-14">
        ${headerSec}
        ${solutionSec}
        ${metricsSec}
    </div>
    <br />
  `;

  // Show Modal (flex is required so the flex items-center/justify-center classes center the panel)
  projectModal.classList.remove('hidden');
  projectModal.classList.add('flex');
  
  // Trigger animations
  requestAnimationFrame(() => {
     projectModalBackdrop.classList.remove('opacity-0');
     projectModalContent.classList.remove('opacity-0', 'scale-95');
     projectModalContent.classList.add('scale-100');
     // Move keyboard focus into the dialog (close button) for keyboard & screen-reader users
     const closeBtn = document.getElementById('modal-close-btn');
     if (closeBtn) closeBtn.focus();
  });

  // Attach Close Events
  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
}

function closeModal() {
  projectModalBackdrop.classList.add('opacity-0');
  projectModalContent.classList.add('opacity-0', 'scale-95');
  projectModalContent.classList.remove('scale-100');
  
  closeModalTimer = setTimeout(() => {
      closeModalTimer = null;
      projectModal.classList.add('hidden');
      projectModal.classList.remove('flex');
      document.body.style.overflow = '';
      projectModalContent.innerHTML = ''; // reset
      setPageInert(false);
      // Return focus to the element that opened the modal
      if (lastFocusedElement && lastFocusedElement.focus) lastFocusedElement.focus();
  }, 400); // match duration-400
}

// Close on Backdrop Click
projectModalBackdrop.addEventListener('click', closeModal);

// Close on Escape Key
window.addEventListener('keydown', (e) => {
   if(e.key === 'Escape' && !projectModal.classList.contains('hidden')) {
       closeModal();
   }
});

// RENDER SKILLS (tiered: Core Expertise + Also In My Toolbox)
function renderSkills() {
    const skillsGrid = document.getElementById('skills-grid');
    if (!skillsGrid || !window.skillsData) return;

    const core = window.skillsData.filter(s => s.tier !== 'familiar');
    const familiar = window.skillsData.filter(s => s.tier === 'familiar');

    const skillCard = (skill) => {
        const iconSection = skill.isMaterialIcon 
            ? `<span class="material-symbols-outlined text-tertiary text-3xl md:text-4xl mb-3 block group-hover:scale-110 transition-transform">${skill.icon}</span>`
            : `<img src="${skillIconUrl(skill)}" alt="${skill.name}" loading="lazy" class="skill-icon h-10 md:h-12 w-auto mb-3 block group-hover:scale-110 transition-transform"${isExternalIcon(skill) ? ` data-icon-base="${skill.icon}"${skill.brand ? ` data-icon-color="${skill.brand}"` : ''}` : ''} />`;
        return `
            <div class="group p-6 md:p-8 rounded-xl bg-surface-container-low hover:bg-surface-container hover:scale-[1.02] transition-all duration-500 fade-up stagger-${skill.stagger}">
                ${iconSection}
                <h3 class="font-headline font-bold text-lg mb-0.5">${skill.name}</h3>
                <p class="text-on-surface-variant text-xs">${skill.category}</p>
            </div>
        `;
    };

    const groupMarkup = (title, subtitle, skills) => skills.length > 0 ? `
        <div class="col-span-full mt-4 first:mt-0 fade-up">
            <h3 class="font-headline font-bold text-sm uppercase tracking-widest text-primary mb-1">${title}</h3>
            <p class="text-on-surface-variant text-xs mb-6">${subtitle}</p>
        </div>
        ${skills.map(skillCard).join('')}
    ` : '';

    skillsGrid.innerHTML =
        groupMarkup('Core Expertise', 'What I reach for on every project', core) +
        groupMarkup('Also In My Toolbox', 'Familiar and production-ready when needed', familiar);

    // Re-observe dynamic skills for the scroll animation to trigger
    document.querySelectorAll('#skills-grid .fade-up').forEach(el => {
        observer.observe(el);
    });
}

// RENDER TECH MARQUEE (duplicated track for a seamless loop)
function renderMarquee() {
    const track = document.getElementById('marquee-track');
    if (!track || !window.skillsData) return;
    const chips = window.skillsData.filter(s => !s.isMaterialIcon).map(s => `
        <span class="marquee-item inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-surface-container-low border border-outline-variant dark:border-white/5 mr-6 whitespace-nowrap">
            <img src="${skillIconUrl(s)}" alt="" class="skill-icon h-6 w-auto" loading="lazy"${isExternalIcon(s) ? ` data-icon-base="${s.icon}"${s.brand ? ` data-icon-color="${s.brand}"` : ''}` : ''} />
            <span class="font-label font-bold text-sm text-on-surface-variant">${s.name}</span>
        </span>
    `).join('');
    track.innerHTML = chips + chips; // duplicate for seamless -50% loop
}

// LIVE COUNTS on project filter pills
function renderFilterCounts() {
    const data = window.projectData || [];
    document.querySelectorAll('.filter-btn').forEach(btn => {
        const f = btn.getAttribute('data-filter');
        const count = f === 'all' ? data.length
          : f === 'featured' ? data.filter(p => p.featured).length
          : data.filter(p => p.type === f).length;
        const span = btn.querySelector('.filter-count');
        if (span) span.textContent = count;
    });
}

// Rotating hero roles (skipped for reduced-motion users)
const roleRotator = document.getElementById('role-rotator');
if (roleRotator && !prefersReducedMotion) {
  const roles = ['Full-Stack Developer', 'React Engineer', 'Next.js Specialist', 'Laravel Developer', 'Performance Engineer', 'Software Engineer'];
  let roleIdx = 0;
  setInterval(() => {
    roleRotator.classList.add('role-fade');
    setTimeout(() => {
      roleIdx = (roleIdx + 1) % roles.length;
      roleRotator.textContent = roles[roleIdx];
      roleRotator.classList.remove('role-fade');
    }, 260);
  }, 2800);
}

// Magnetic primary CTA (desktop mouse only)
const magneticCta = document.getElementById('magnetic-cta');
if (magneticCta && !isCoarsePointer && !prefersReducedMotion) {
  magneticCta.addEventListener('mousemove', (e) => {
    const rect = magneticCta.getBoundingClientRect();
    const dx = (e.clientX - rect.left - rect.width / 2) * 0.25;
    const dy = (e.clientY - rect.top - rect.height / 2) * 0.35;
    magneticCta.style.transform = `translate(${dx}px, ${dy}px)`;
  });
  magneticCta.addEventListener('mouseleave', () => {
    magneticCta.style.transform = ''; // let CSS hover/active transforms work again
  });
}

// INITIALIZE ON LOAD — chunked to reduce TBT
document.addEventListener('DOMContentLoaded', () => {
    // Priority 1: render filter counts + marquee + projects (critical above-fold content)
    requestAnimationFrame(() => {
        renderFilterCounts();  // Live pill counts (before indicator is measured)
        renderProjects('featured'); // Projects (default to featured)
        renderMarquee();       // Tech logo strip
        applyThemeToIcons();   // Sync external logos (hero chips) to the active theme

        // Measure the filter indicator AFTER counts are populated
        const activeFilter = document.querySelector('.filter-btn.active');
        if(activeFilter) updateFilterIndicator(activeFilter);

        // Priority 2: render skills grid (below the fold, defer to idle)
        const renderSkillsDeferred = () => {
            renderSkills();
            // Re-observe dynamic skills for scroll animation
            document.querySelectorAll('#skills-grid .fade-up').forEach(el => {
                observer.observe(el);
            });
        };
        if (typeof requestIdleCallback !== 'undefined') {
            requestIdleCallback(renderSkillsDeferred, { timeout: 3000 });
        } else {
            setTimeout(renderSkillsDeferred, 200);
        }
    });
});


