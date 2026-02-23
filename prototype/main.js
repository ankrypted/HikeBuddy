// HikeBuddy Landing Page — main.js

const searchBtn     = document.querySelector('.search-btn');
const searchOverlay = document.getElementById('searchOverlay');
const searchClose   = document.getElementById('searchClose');
const searchInput   = document.getElementById('searchInput');
const menuBtn       = document.getElementById('menuBtn');
const navLinks      = document.querySelector('.nav-links');

// ── Search overlay ──────────────────────────────────────────
function openSearch() {
  searchOverlay.classList.add('active');
  setTimeout(() => searchInput.focus(), 50);
}
function closeSearch() {
  searchOverlay.classList.remove('active');
  searchInput.value = '';
}

searchBtn.addEventListener('click', openSearch);
searchClose.addEventListener('click', closeSearch);
searchOverlay.addEventListener('click', (e) => {
  if (e.target === searchOverlay) closeSearch();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeSearch();
});

// ── Mobile menu ─────────────────────────────────────────────
menuBtn.addEventListener('click', () => {
  navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
  navLinks.style.flexDirection = 'column';
  navLinks.style.position = 'absolute';
  navLinks.style.top = '72px';
  navLinks.style.left = '0';
  navLinks.style.right = '0';
  navLinks.style.background = 'rgba(10,20,30,0.95)';
  navLinks.style.padding = '1rem 1.5rem 1.5rem';
  navLinks.style.backdropFilter = 'blur(12px)';
  navLinks.style.zIndex = '50';
});

// Close mobile menu on link click
navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    navLinks.style.display = 'none';
  });
});

// ── Trail card click ────────────────────────────────────────
document.querySelectorAll('.trail-card').forEach(card => {
  card.addEventListener('click', () => {
    const name = card.querySelector('.trail-name').textContent;
    console.log(`Navigate to trail: ${name}`);
    // Wire up routing here when backend is ready
  });
});
