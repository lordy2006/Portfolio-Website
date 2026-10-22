'use strict';

// ==========================================
// CONFIG — change your email in ONE place
// ==========================================
const EMAIL = 'mlordwenson@gmail.com';

const prefersReducedMotion = () =>
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ==========================================
// 1. NAVIGATION: smooth scroll, mobile menu, active link
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const nav = document.getElementById('site-nav');
    const navLinks = document.querySelectorAll('#site-nav a[href^="#"]');
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const scrollBehavior = () => (prefersReducedMotion() ? 'auto' : 'smooth');

    function setMenu(open) {
        if (!menuToggle || !mobileMenu) return;
        mobileMenu.classList.toggle('hidden', !open);
        menuToggle.setAttribute('aria-expanded', String(open));
        menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            setMenu(mobileMenu.classList.contains('hidden'));
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') setMenu(false);
    });

    document.addEventListener('click', (e) => {
        if (nav && !nav.contains(e.target)) setMenu(false);
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth >= 1024) setMenu(false);
    });

    navLinks.forEach((link) => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');

            // Close the mobile menu first so the navbar height is measured correctly
            setMenu(false);

            // Home / logo: scroll to the very top
            if (targetId === '#' || targetId === '#home' || targetId === '#hero') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: scrollBehavior() });
                try { history.replaceState(null, '', window.location.pathname + window.location.search); } catch (_) {}
                return;
            }

            const target = document.querySelector(targetId);
            if (!target) return;

            e.preventDefault();
            const offset = (nav ? nav.offsetHeight : 64) + 8;
            const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({ top: Math.max(top, 0), behavior: scrollBehavior() });
            try { history.replaceState(null, '', targetId); } catch (_) {}
        });
    });

    // ---- Active link highlight ----
    const sections = Array.from(document.querySelectorAll('section[id]'));
    const highlightLinks = document.querySelectorAll('.nav-link, .mobile-link');
    let ticking = false;

    function updateActiveLink() {
        ticking = false;
        if (!sections.length) return;

        const probe = (nav ? nav.offsetHeight : 64) + 80;
        let currentId = sections[0].id;

        sections.forEach((section) => {
            if (section.getBoundingClientRect().top <= probe) currentId = section.id;
        });

        // At the very bottom, always highlight the last section (Contact)
        const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
        if (atBottom) currentId = sections[sections.length - 1].id;

        highlightLinks.forEach((link) => {
            const active = link.getAttribute('href') === `#${currentId}`;
            link.classList.toggle('active', active);
            if (active) link.setAttribute('aria-current', 'true');
            else link.removeAttribute('aria-current');
        });
    }

    function onScroll() {
        if (!ticking) {
            ticking = true;
            window.requestAnimationFrame(updateActiveLink);
        }
        toggleBackToTop();
    }

    // ---- Back to top ----
    const backToTopBtn = document.getElementById('back-to-top');

    function toggleBackToTop() {
        if (!backToTopBtn) return;
        const show = window.scrollY > 600;
        backToTopBtn.classList.toggle('hidden', !show);
        backToTopBtn.classList.toggle('flex', show);
    }

    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: scrollBehavior() });
        });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    updateActiveLink();
    toggleBackToTop();
});

// ==========================================
// 2. SKILLS: level dots + category filter
// ==========================================
function renderSkillLevels() {
    document.querySelectorAll('.skill-card').forEach((card) => {
        const level = parseInt(card.getAttribute('data-level'), 10) || 0;
        const dotsContainer = card.querySelector('.skill-dots');
        if (!dotsContainer) return;

        dotsContainer.innerHTML = '';
        dotsContainer.classList.remove('dots-lit');
        dotsContainer.setAttribute('role', 'img');
        dotsContainer.setAttribute('aria-label', `Proficiency ${level} out of 5`);

        for (let i = 1; i <= 5; i++) {
            const dot = document.createElement('div');
            dot.className = 'w-2 h-2 rounded-full transition-all duration-300 bg-slate-700';
            if (i <= level) {
                dot.setAttribute('data-lit', 'true');
                dot.style.transitionDelay = `${(i - 1) * 120}ms`;
            }
            dotsContainer.appendChild(dot);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    renderSkillLevels();

    const filterButtons = document.querySelectorAll('.filter-btn');
    const skillCards = document.querySelectorAll('.skill-card');

    filterButtons.forEach((button) => {
        button.addEventListener('click', () => {
            filterButtons.forEach((btn) => {
                btn.classList.remove('bg-cyan-500/20', 'border-cyan-500', 'text-cyan-400');
                btn.classList.add('bg-slate-900/60', 'border-slate-800', 'text-slate-400');
                btn.setAttribute('aria-pressed', 'false');
            });

            button.classList.remove('bg-slate-900/60', 'border-slate-800', 'text-slate-400');
            button.classList.add('bg-cyan-500/20', 'border-cyan-500', 'text-cyan-400');
            button.setAttribute('aria-pressed', 'true');

            const filter = button.getAttribute('data-filter');

            skillCards.forEach((card) => {
                const show = filter === 'all' || card.getAttribute('data-category') === filter;
                card.classList.toggle('hidden', !show);
                card.style.display = show ? 'flex' : 'none';
            });
        });
    });
});

// ==========================================
// 3. PROJECT PREVIEW MODAL
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('project-modal');
    if (!modal) return;

    const closeModalBtn = document.getElementById('close-modal');
    const modalImg = document.getElementById('modal-img');
    const modalTitle = document.getElementById('modal-title');
    const modalTech = document.getElementById('modal-tech');
    const modalDesc = document.getElementById('modal-desc');
    const modalTags = document.getElementById('modal-tags');
    let lastFocused = null;

    const isOpen = () => !modal.classList.contains('hidden');

    function openModalFor(card, opener) {

        const accents = {
        cyan: '6, 182, 212',
        emerald: '16, 185, 129',
        purple: '168, 85, 247',
        blue: '59, 130, 246',
        indigo: '99, 102, 241'
    };
    const colorMatch = card.className.match(/hover:border-([a-z]+)-500\/50/);
    modal.style.setProperty('--c', (colorMatch && accents[colorMatch[1]]) || accents.cyan);

        const img = card.querySelector('img');
        if (img && modalImg) {
            modalImg.src = img.getAttribute('src');
            modalImg.alt = img.alt || 'Project Preview';
        }

        const title = card.querySelector('h3');
        if (title && modalTitle) modalTitle.textContent = title.textContent.trim();

        const tech = card.querySelector('.p-6 span');
        if (tech && modalTech) modalTech.textContent = tech.textContent.trim();

        const desc = card.querySelector('p');
        if (desc && modalDesc) modalDesc.textContent = desc.textContent.trim();

        const detailsBox = document.getElementById('modal-details');
        if (detailsBox) {
            detailsBox.innerHTML = '';
            [['Project Name', 'name'], ['Course', 'course'], ['My Role', 'role'], ['Tools', 'tools']].forEach(([label, key]) => {
                const value = card.dataset[key];
                if (!value) return;
                const box = document.createElement('div');
                box.className = 'p-3 rounded-xl bg-slate-950/60 border border-slate-800';
                const l = document.createElement('p');
                l.className = 'text-cyan-400 font-mono text-[11px] uppercase tracking-wider mb-1';
                l.textContent = label;
                const v = document.createElement('p');
                v.className = 'text-slate-300 text-sm';
                v.textContent = value;
                box.append(l, v);
                detailsBox.appendChild(box);
            });
        }

        const modalVideo = document.getElementById('modal-video');
        const media = card.dataset.media || '';
        const isVideo = /\.(mp4|webm)$/i.test(media);
        if (media && !isVideo && modalImg) modalImg.src = media;
        if (modalVideo) {
            if (isVideo) {
                modalVideo.src = media;
                modalVideo.classList.remove('hidden');
                if (modalImg) modalImg.classList.add('hidden');
                modalVideo.play().catch(() => {});
            } else {
                modalVideo.pause();
                modalVideo.removeAttribute('src');
                modalVideo.load();
                modalVideo.classList.add('hidden');
                if (modalImg) modalImg.classList.remove('hidden');
            }
        }

        if (modalTags) {
            modalTags.innerHTML = '';
            card.querySelectorAll('.px-6.pb-6 .flex span').forEach((tag) => {
                const text = tag.textContent.trim();
                if (!text) return;
                const chip = document.createElement('span');
                chip.className = 'px-2.5 py-1 bg-slate-800 text-cyan-400 font-mono text-xs rounded-md border border-slate-700';
                chip.textContent = text;
                modalTags.appendChild(chip);
            });
        }

        lastFocused = opener;
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        if (closeModalBtn) closeModalBtn.focus();
    }

    function closeModal() {
        modal.classList.add('hidden');
        const videoEl = document.getElementById('modal-video');
        if (videoEl) { videoEl.pause(); videoEl.removeAttribute('src'); videoEl.load(); }
        document.body.style.overflow = '';
        if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
        lastFocused = null;
    }

    document.querySelectorAll('#projects .group').forEach((card) => {
        const btn = card.querySelector('button');
        if (!btn) return;
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openModalFor(card, btn);
        });
    });

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (!isOpen()) return;
        if (e.key === 'Escape') {
            closeModal();
        } else if (e.key === 'Tab') {
            // Only one focusable control in the dialog: keep focus inside it
            e.preventDefault();
            if (closeModalBtn) closeModalBtn.focus();
        }
    });
});

// ==========================================
// 4. COPY EMAIL
// ==========================================
function showToast() {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.classList.remove('hidden');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.add('hidden'), 2500);
}

function showCopiedOnButton() {
    const btnText = document.getElementById('copy-btn-text');
    if (!btnText) return;
    btnText.textContent = 'Copied to Clipboard! ✓';
    clearTimeout(showCopiedOnButton._t);
    showCopiedOnButton._t = setTimeout(() => {
        btnText.textContent = 'Copy Email Address';
    }, 2000);
}

function fallbackCopy(text) {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (_) { ok = false; }
    document.body.removeChild(area);
    return ok;
}

function copyEmail() {
    const done = () => { showToast(); showCopiedOnButton(); };
    const fail = () => {
        if (fallbackCopy(EMAIL)) done();
        else window.prompt('Copy this email address:', EMAIL);
    };

    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(EMAIL).then(done).catch(fail);
    } else {
        fail();
    }
}

// ==========================================
// 5. SCROLL REVEAL (animates once, then cleans up)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            el.classList.add('is-visible');
            obs.unobserve(el);
            // Remove helper classes afterwards so hover effects on cards keep working
            setTimeout(() => el.classList.remove('reveal-element', 'is-visible'), 1000);
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -20px 0px' });

    // The hero is excluded so the first thing a visitor sees appears instantly
    document.querySelectorAll('section:not(#hero), #projects .group').forEach((el) => {
        el.classList.add('reveal-element');
        observer.observe(el);
    });
});

// ==========================================
// 6. HERO TYPEWRITER LINE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const textEl = document.getElementById('typewriter-text');
    if (!textEl) return;

    const phrases = [
        'IT Student',
        'Programmer',
        'Gamer',
        "Rubik's Cube Solver"
    ];

    // Reduced motion: keep the first phrase as plain static text
    if (prefersReducedMotion()) {
        textEl.textContent = phrases[0];
        return;
    }

    const TYPE_MS = 70;      // speed while typing
    const DELETE_MS = 35;    // speed while deleting
    const HOLD_MS = 1600;    // pause once a phrase is complete
    const GAP_MS = 350;      // pause before typing the next phrase

    let phraseIndex = 0;
    let charCount = 0;
    let deleting = false;

    function tick() {
        const phrase = phrases[phraseIndex];
        let delay;

        if (!deleting) {
            charCount++;
            textEl.textContent = phrase.slice(0, charCount);
            if (charCount === phrase.length) {
                deleting = true;
                delay = HOLD_MS;
            } else {
                delay = TYPE_MS;
            }
        } else {
            charCount--;
            textEl.textContent = phrase.slice(0, charCount);
            if (charCount === 0) {
                deleting = false;
                phraseIndex = (phraseIndex + 1) % phrases.length;
                delay = GAP_MS;
            } else {
                delay = DELETE_MS;
            }
        }
        setTimeout(tick, delay);
    }

    textEl.textContent = '';
    setTimeout(tick, 400);
});

// ==========================================
// 7. SCROLL PROGRESS BAR
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const bar = document.getElementById('scroll-progress');
    if (!bar) return;

    let ticking = false;

    function update() {
        ticking = false;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const progress = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
        bar.style.transform = `scaleX(${progress})`;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            ticking = true;
            window.requestAnimationFrame(update);
        }
    }, { passive: true });

    window.addEventListener('resize', update);
    update();
});

// ==========================================
// 8. SKILL DOTS FILL IN WHEN VISIBLE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const containers = document.querySelectorAll('.skill-card .skill-dots');
    if (!containers.length) return;

    const lightUp = (el) => el.classList.add('dots-lit');

    // Reduced motion or no IntersectionObserver: show the dots filled immediately
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
        containers.forEach((el) => {
            el.querySelectorAll('[data-lit]').forEach((dot) => { dot.style.transitionDelay = '0ms'; });
            lightUp(el);
        });
        return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            lightUp(entry.target);
            obs.unobserve(entry.target);
        });
    }, { threshold: 0.6 });

    containers.forEach((el) => observer.observe(el));
});

// ==========================================
// 9. CURSOR GLOW
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const glow = document.getElementById('cursor-glow');
    if (!glow || prefersReducedMotion() || !window.matchMedia('(hover: hover)').matches) return;

    let x = 0, y = 0, targetX = 0, targetY = 0, frame = null, first = true;

    function follow() {
        x += (targetX - x) * 0.15;
        y += (targetY - y) * 0.15;
        glow.style.transform = `translate(${x}px, ${y}px)`;
        if (Math.abs(targetX - x) > 0.5 || Math.abs(targetY - y) > 0.5) {
            frame = requestAnimationFrame(follow);
        } else {
            frame = null;
        }
    }

    window.addEventListener('mousemove', (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
        if (first) { x = targetX; y = targetY; first = false; }
        glow.classList.add('is-active');
        if (!frame) frame = requestAnimationFrame(follow);
    }, { passive: true });

    document.documentElement.addEventListener('mouseleave', () => {
        glow.classList.remove('is-active');
    });
});

// ==========================================
// 10. HOBBY FLIP CARDS (tap to flip on touch devices)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.flip-card').forEach((card) => {
        card.addEventListener('click', () => {
            if (window.matchMedia('(hover: hover)').matches) return;
            card.classList.toggle('is-flipped');
        });
    });
});

// ==========================================
// 11. INSTANT PROJECT PREVIEW (HOVER VIDEO)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const projectCards = document.querySelectorAll('#projects .group');

    projectCards.forEach(card => {
        const mediaPath = card.getAttribute('data-media');
        
        // Kung walay video (.mp4) nga naka-link sa data-media, i-skip ra
        if (!mediaPath || !mediaPath.trim().match(/\.(mp4|webm)$/i)) return;

        const imgContainer = card.querySelector('.relative.w-full.h-48');
        const img = imgContainer.querySelector('img');
        if (!imgContainer || !img) return;

        // Buhaton ang <video> tag dynamically luyo sa screen
        const video = document.createElement('video');
        video.src = mediaPath;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        
        // Styling: Itabon sa image, invisible sa sinugdanan, hapsay mo-fade in
        video.className = 'absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 pointer-events-none';
        video.preload = "metadata"; // Dili i-load ang tibuok video para paspas ang website
        
        // Ibutang ang video after sa image para ang Category Badge (e.g. "Web Development") magpabilin sa ibabaw
        img.after(video);

        // Inig hover sa mouse...
        card.addEventListener('mouseenter', () => {
            // Butangan natog gamay nga delay (150ms) aron dili mag-play dayon kung aksidente lang nalabyan sa mouse
            card.hoverTimeout = setTimeout(() => {
                video.play().catch(() => {}); // Catch just in case mo-block ang browser og autoplay
                video.classList.remove('opacity-0');
                video.classList.add('opacity-100');
            }, 150); 
        });

        // Inig hawa sa mouse...
        card.addEventListener('mouseleave', () => {
            clearTimeout(card.hoverTimeout);
            video.pause();
            // Option: I-reset ang video balik sa sugod (Kuhaa ang // sa ubos kung ganahan nimo)
            // video.currentTime = 0; 
            video.classList.remove('opacity-100');
            video.classList.add('opacity-0');
        });
    });
});