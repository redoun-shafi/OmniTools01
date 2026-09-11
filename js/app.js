const tools = [
  { name: 'Canva Bulk Recipe Interior Converter', description: 'Convert recipe chapters into separate Excel interiors and match food images automatically.', category: 'Converters', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>', color: '#57B9FF', status: 'Ready', href: 'tools/docx-to-xlsx/' },
  { name: 'Recipe Index Studio', description: 'Paste spreadsheet rows, preview a polished recipe index, and export it as a DOC file.', category: 'Converters', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M8 7h8M8 11h8M8 15h5"/></svg>', color: '#77B1D4', status: 'Ready', href: 'tools/recipe-generator/' },
  { name: 'Auto Flow', description: 'Queue prompts and automate bulk image generation with the Chrome extension. — v3.1.0', category: 'Extensions', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>', color: '#517891', status: 'Extension', href: 'tools/autoflow/', badge: 'NEW VERSION', updated: 'Last updated: September 5, 2026', version: 'v3.1.0' },
  { name: 'CSV Cleaner', description: 'Prepare messy spreadsheet data for your next workflow in a few clicks.', category: 'Converters', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5h16M4 12h16M4 19h16M8 3v4M16 10v4M10 17v4"/></svg>', color: '#90D5FF', status: 'Coming soon', href: '#' },
  { name: 'Prompt Builder', description: 'Shape clear, reusable prompts for the way you work and create.', category: 'AI Tools', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 4h14v12H8l-3 3z"/><path d="m9 9 2 2 4-4"/></svg>', color: '#57B9FF', status: 'Coming soon', href: '#' },
  { name: 'OCR Extractor', description: 'Pull useful text from images and scanned documents without the busywork.', category: 'AI Tools', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2"/><path d="M8 9h8v6H8z"/></svg>', color: '#77B1D4', status: 'Coming soon', href: '#' }
];

const grid = document.querySelector('#toolGrid');
const search = document.querySelector('#toolSearch');
const count = document.querySelector('#toolCount');
const emptyState = document.querySelector('#emptyState');
let activeCategory = 'All';

function renderTools() {
  const query = search.value.trim().toLowerCase();
  const visible = tools.filter(tool => {
    const matchesCategory = activeCategory === 'All' || tool.category === activeCategory;
    const searchable = `${tool.name} ${tool.description} ${tool.category}`.toLowerCase();
    return matchesCategory && searchable.includes(query);
  });

  grid.innerHTML = visible.map(tool => `
    <article class="tool-card" style="--tool-accent:${tool.color}">
      <div class="card-top">
        <div class="tool-icon" aria-hidden="true">${tool.icon}</div>
        <div class="card-badges">
          ${tool.badge ? `<span class="card-new-badge">${tool.badge}</span>` : ''}
          <span class="tool-status ${tool.status === 'Coming soon' ? 'coming-soon' : ''}">${tool.status}</span>
        </div>
      </div>
      <h3>${tool.name}${tool.version ? ` <span class="card-version">${tool.version}</span>` : ''}</h3>
      <p>${tool.description}</p>
      ${tool.updated ? `<div class="card-updated"><span class="updated-dot"></span> ${tool.updated}</div>` : ''}
      <div class="tool-card-footer">
        <span class="tool-category">${tool.category}</span>
        ${tool.status === 'Coming soon' ? '<span class="tool-coming">Coming soon</span>' : `<a class="tool-open" href="${tool.href}" data-tool-name="${escapeAttr(tool.name)}">Open tool &rarr;</a>`}
      </div>
    </article>
  `).join('');

  count.textContent = `${visible.length} ${visible.length === 1 ? 'tool' : 'tools'}`;
  emptyState.hidden = visible.length !== 0;

  // Intercept tool link clicks to require sign in / sign up
  grid.querySelectorAll('.tool-open').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      const toolName = link.dataset.toolName || 'this tool';
      if (!href || href === '#') return;

      if (window.OmniSupabase && window.OmniAuthUI) {
        e.preventDefault();
        window.OmniSupabase.getUser().then(user => {
          if (user) {
            window.location.href = href;
          } else {
            window.OmniAuthUI.openModal('signin', `Please sign in or create an account to access ${toolName}`, href);
          }
        });
      }
    });
  });
}

function escapeAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g, '&quot;');
}

document.querySelectorAll('.category-button').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.category-button').forEach(item => item.classList.remove('active'));
    button.classList.add('active');
    activeCategory = button.dataset.category;
    renderTools();
  });
});

search.addEventListener('input', renderTools);
document.addEventListener('keydown', event => {
  if (event.key === '/' && document.activeElement !== search) {
    event.preventDefault();
    search.focus();
  }
});

const menuToggle = document.querySelector('#menuToggle');
const mobileMenu = document.querySelector('#mobileMenu');
if (menuToggle && mobileMenu) {
  menuToggle.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });
  mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }));
}

const progress = document.querySelector('#scrollProgress');
const header = document.querySelector('.site-header');
function onScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
  if (progress) progress.style.width = pct + '%';
  if (header) header.classList.toggle('scrolled', window.scrollY > 12);
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

renderTools();
