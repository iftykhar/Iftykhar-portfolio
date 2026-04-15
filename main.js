// Interactive Particle & Custom Cursor Logic
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
const cursor = document.getElementById('custom-cursor');
let particles = [];
let mouse = { x: null, y: null, targetX: null, targetY: null };

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
const particleCount = isMobile ? 40 : 250; 
for(let i=0;i<particleCount;i++) particles.push(new Particle());

let animationFrameId;
const canvasObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      if (isMobile) {
        // Delay particle start on mobile to prioritize image paint
        setTimeout(() => {
          if (!animationFrameId) animateParticles();
        }, 1000);
      } else {
        animateParticles();
      }
    } else {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  });
}, { threshold: 0.1 });
canvasObserver.observe(canvas.parentElement);

function updateCursor() {
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
updateCursor();

function animateParticles() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  particles.forEach(p=>{p.update();p.draw();});
  particles.forEach((a,i)=>{ 
    particles.slice(i+1).forEach(b=>{ 
      const dx = a.x - b.x;
      if (Math.abs(dx) > 100) return; // Performance Optimization: Skip distance calc if x is too far
      const dy = a.y - b.y;
      if (Math.abs(dy) > 100) return; // Performance Optimization: Skip distance calc if y is too far
      const d=Math.hypot(dx,dy); 
      if(d<100){
        ctx.beginPath();
        ctx.moveTo(a.x,a.y);
        ctx.lineTo(b.x,b.y);
        const isDark = document.documentElement.classList.contains('dark');
        const color = isDark ? `99,102,241` : `150,150,150`;
        ctx.strokeStyle=`rgba(${color},${0.12*(1-d/100)})`;
        ctx.stroke();
      }
    });
  });
  animationFrameId = requestAnimationFrame(animateParticles);
}
// Note: Initial call removed to let IntersectionObserver start animation

// Hover effect listeners
function setupCursorHovers() {
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

// Smooth Scroll
document.querySelectorAll('a[href^="#"]').forEach(a=>{a.addEventListener('click',function(e){e.preventDefault();const href=this.getAttribute('href');if(href==='#'){window.scrollTo({top:0,behavior:'smooth'});return;}const t=document.querySelector(href);if(t)t.scrollIntoView({behavior:'smooth',block:'start'});});});

// Active Nav & Go To Top Logic
const sections=document.querySelectorAll('section[id]');
const navLinks=document.querySelectorAll('.nav-link');
const goTopBtn=document.getElementById('go-to-top');
window.addEventListener('scroll',()=>{
  let cur='';
  sections.forEach(s=>{if(window.scrollY>=s.offsetTop-200)cur=s.id;});
  navLinks.forEach(l=>{l.classList.remove('active');if(l.getAttribute('href')==='#'+cur)l.classList.add('active');});
  
  // Go to top button visibility (shows after 400px of scrolling)
  if(window.scrollY > 400) {
    goTopBtn.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-4');
  } else {
    goTopBtn.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4');
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
    particles.forEach(p => p.reset());
}

// Initialize Theme - Force Dark Default
const savedTheme = localStorage.getItem('theme') || 'dark';
if (savedTheme === 'light') {
    document.documentElement.classList.remove('dark');
} else {
    document.documentElement.classList.add('dark');
}
updateThemeIcons();

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
  updateFilterIndicator(activeFilter);
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
    const filtered = filter === 'all' ? data : data.filter(p => p.type === filter);
    
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
                      ${p.categories.slice(0,2).map(c => `<span class="px-3 py-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-label font-bold tracking-widest uppercase text-on-surface/80">${c}</span>`).join('')}
                   </div>
                   <h3 class="text-2xl md:text-3xl lg:text-4xl font-headline font-extrabold mb-3 leading-tight text-white group-hover:text-primary transition-colors">${p.title}</h3>
                   <p class="text-on-surface-variant text-sm md:text-base line-clamp-2 max-w-xl mb-6 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">${p.description || (p.sections && p.sections[0] ? p.sections[0].shortSummary : 'Detailed Case Study')}</p>
                   <div class="flex items-center gap-3 font-headline font-bold text-tertiary transition-transform group-hover:translate-x-2">
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
      grid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-12 border-t border-white/5';
      
      otherProjects.forEach((p, i) => {
        const stagger = `stagger-${(i % 4) + 1}`;
        const item = `
          <div class="group flex flex-col rounded-2xl bg-surface-container-low hover:bg-surface-bright transition-all duration-500 overflow-hidden fade-up ${stagger} border border-white/5 hover:border-white/10 hover:shadow-2xl hover:shadow-primary/5">
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
                 <a href="${p.websiteUrl}" target="_blank" class="text-tertiary hover:text-white transition-colors">
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
  
  if (window.innerWidth > 1024) { // Desktop only
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
  // Lock body scroll
  document.body.style.overflow = 'hidden';
  
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
                <h4 class="text-sm font-label uppercase tracking-widest text-primary mb-3">The Vision</h4>
                <p class="text-lg md:text-xl leading-relaxed text-on-surface/90 mb-6">${vis.fullDescription}</p>
                ${vis.servicesProvided ? `
                  <div class="flex flex-wrap gap-2">
                     ${vis.servicesProvided.map(s => `<span class="px-3 py-1.5 bg-surface-container-high rounded-full text-xs font-label uppercase tracking-widest">${s}</span>`).join('')}
                  </div>
                `: ''}
            </div>
         `;
     }

     if (sol) {
         solutionSec = `
            <div class="mb-12 p-6 md:p-8 bg-surface-container rounded-xl border border-white/5 relative overflow-hidden">
                <div class="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-[80px]"></div>
                <h4 class="text-sm font-label uppercase tracking-widest text-tertiary mb-6 relative z-10">${sol.header}</h4>
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
            <div class="border-t border-white/5 pt-10 mt-10">
                <h4 class="text-sm font-label uppercase tracking-widest text-on-surface-variant mb-8 text-center">${met.header}</h4>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                   ${(met.stats||[]).map(s => `
                       <div class="p-4 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
                           <div class="text-2xl md:text-3xl font-headline font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-1">${s.value}</div>
                           <div class="text-[10px] md:text-xs font-label uppercase tracking-widest text-on-surface-variant">${s.label}</div>
                       </div>
                   `).join('')}
                </div>
            </div>
         `;
     }
  } else {
      headerSec = `<p class="text-lg text-on-surface-variant">${project.description || 'Detailed case study coming soon.'}</p>`;
  }

  projectModalContent.innerHTML = `
    <!-- Top Nav / Close -->
    <div class="sticky top-0 z-50 flex justify-between items-center p-4 md:p-6 bg-surface-container-lowest/80 backdrop-blur-md border-b border-white/5">
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
               <h2 class="text-3xl md:text-5xl font-headline font-extrabold tracking-tight mb-2">${project.title}</h2>
               <div class="text-on-surface-variant flex items-center gap-2 text-sm"><span class="material-symbols-outlined text-[16px]">domain</span> ${project.client || 'Personal'} &nbsp;|&nbsp; <span class="material-symbols-outlined text-[16px]">location_on</span> ${project.location || 'Global'}</div>
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

  // Show Modal
  projectModal.classList.remove('hidden');
  
  // Trigger animations
  requestAnimationFrame(() => {
     projectModalBackdrop.classList.remove('opacity-0');
     projectModalContent.classList.remove('opacity-0', 'scale-95');
     projectModalContent.classList.add('scale-100');
  });

  // Attach Close Events
  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
}

function closeModal() {
  projectModalBackdrop.classList.add('opacity-0');
  projectModalContent.classList.add('opacity-0', 'scale-95');
  projectModalContent.classList.remove('scale-100');
  
  setTimeout(() => {
      projectModal.classList.add('hidden');
      document.body.style.overflow = '';
      projectModalContent.innerHTML = ''; // reset
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

// RENDER SKILLS
function renderSkills() {
    const skillsGrid = document.getElementById('skills-grid');
    if (!skillsGrid || !window.skillsData) return;

    skillsGrid.innerHTML = window.skillsData.map(skill => {
        const iconSection = skill.isMaterialIcon 
            ? `<span class="material-symbols-outlined text-tertiary text-3xl md:text-4xl mb-3 block group-hover:scale-110 transition-transform">${skill.icon}</span>`
            : `<img src="${skill.icon}" alt="${skill.name}" class="h-10 md:h-12 w-auto mb-3 block group-hover:scale-110 transition-transform" />`;

        return `
            <div class="group p-6 md:p-8 rounded-xl bg-gray-300 hover:bg-gray-200 dark:bg-surface-container-low dark:hover:bg-surface-bright hover:scale-[1.02] transition-all duration-500 fade-up stagger-${skill.stagger}">
                ${iconSection}
                <h3 class="font-headline font-bold text-lg mb-0.5">${skill.name}</h3>
                <p class="text-on-surface-variant text-xs">${skill.category}</p>
            </div>
        `;
    }).join('');

    // Re-observe dynamic skills for the scroll animation to trigger
    document.querySelectorAll('#skills-grid .fade-up').forEach(el => {
        observer.observe(el);
    });
}

// INITIALIZE ON LOAD
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure filter indicator DOM sizing is correct
    setTimeout(() => {
        const activeFilter = document.querySelector('.filter-btn.active');
        if(activeFilter) updateFilterIndicator(activeFilter);
        
        renderSkills(); // Render skills first
        renderProjects('all'); 
    }, 100);
});
