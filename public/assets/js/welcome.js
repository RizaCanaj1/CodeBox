// Landing page (welcome.blade.php) only — mobile nav toggle, a "the nav
// has a shadow now" state once you've scrolled past the top, and a
// scroll-triggered fade-in-and-rise for the sections/cards. No forced
// intro, no page-scraping "code" animation; just tasteful entrance
// animations and hover feedback.

const cbMenuToggle = document.getElementById('cbMenuToggle');
const cbNavLinks = document.getElementById('cbNavLinks');
if (cbMenuToggle && cbNavLinks) {
    cbMenuToggle.addEventListener('click', () => {
        cbNavLinks.classList.toggle('cb-open');
    });
    cbNavLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => cbNavLinks.classList.remove('cb-open'));
    });
}

// Nav picks up a border/shadow once the page has scrolled a little, so it
// reads as "elevated" over content instead of always having a hard edge.
const cbNav = document.querySelector('.cb-nav');
if (cbNav) {
    let cbNavFrame = null;
    const updateNavElevation = () => {
        cbNavFrame = null;
        cbNav.classList.toggle('cb-scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', () => {
        if (cbNavFrame) return;
        cbNavFrame = requestAnimationFrame(updateNavElevation);
    });
    updateNavElevation();
}

// Scroll-reveal: every .cb-reveal element (section headers, cards, the
// CTA panel) plus .cb-code-card (which uses its own keyframe — see
// welcome.css — because it settles into a rotated tilt rather than a
// plain translateY) fades/rises in the first time it enters the viewport.
// Cards that sit in the same grid get a small staggered delay so they
// don't all pop in in lockstep.
const cbRevealTargets = document.querySelectorAll('.cb-reveal, .cb-code-card');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (cbRevealTargets.length) {
    if ('IntersectionObserver' in window && !prefersReducedMotion) {
        const staggerIndex = new WeakMap();
        cbRevealTargets.forEach(el => {
            const siblings = Array.from(el.parentElement.children).filter(c => c.matches('.cb-reveal, .cb-code-card'));
            staggerIndex.set(el, siblings.indexOf(el));
        });

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                const explicitDelay = el.getAttribute('data-reveal-delay');
                const delay = explicitDelay !== null
                    ? Number(explicitDelay)
                    : Math.min(staggerIndex.get(el) || 0, 4) * 70;
                el.style.setProperty('--cb-reveal-delay', `${delay}ms`);
                el.classList.add('cb-in-view');
                observer.unobserve(el);
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

        cbRevealTargets.forEach(el => observer.observe(el));
    } else {
        cbRevealTargets.forEach(el => el.classList.add('cb-in-view'));
    }
}
