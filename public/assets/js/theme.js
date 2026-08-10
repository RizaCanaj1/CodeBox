// Shared light/dark toggle for welcome.blade.php and the dashboard.
// The actual "apply before paint" step lives in a tiny inline <script> in
// each page's <head> (see theme-init snippet) — this file only wires up
// click handling on however many `.t-toggle` buttons exist on the page
// (there can be more than one — e.g. desktop + mobile nav) and keeps them
// all in sync.

function cbApplyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('cb-theme', theme); } catch (e) { /* storage unavailable — theme just won't persist */ }
    document.querySelectorAll('.t-toggle').forEach(btn => {
        btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    });
}

// Delegated on `document` rather than attached directly to each .t-toggle
// button — on the dashboard, the toggle lives inside navigation-menu's
// Livewire component, which re-renders its DOM shortly after the initial
// page load. A listener attached straight to the button gets orphaned
// when Livewire swaps in a fresh (visually identical) node; `document`
// itself is never replaced, so delegation survives that swap.
document.addEventListener('click', e => {
    const btn = e.target.closest('.t-toggle');
    if (!btn) return;
    const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    cbApplyTheme(current === 'dark' ? 'light' : 'dark');
});
