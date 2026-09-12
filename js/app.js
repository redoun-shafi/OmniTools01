/**
 * OmniTools — Central Tool Registry and Application Controller
 * Version: 2.1.0
 */

// 1. Centralized Data-Driven Tool Registry
const tools = [
  {
    id: 'docx-to-xlsx',
    name: 'Canva Bulk Recipe Interior Converter',
    description: 'Convert recipe chapters into separate Excel interiors and match food images automatically.',
    category: 'Converters',
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>',
    color: '#202940',
    status: 'Ready',
    href: 'tools/docx-to-xlsx/',
    tags: ['docx', 'xlsx', 'excel', 'word', 'converter', 'canva', 'bulk', 'recipes', 'interiors', 'images'],
    badge: null,
    version: 'v2.0.0',
    updated: 'Last updated: August 28, 2026',
    dateAdded: '2026-08-10',
    priority: 100
  },
  {
    id: 'recipe-generator',
    name: 'Recipe Index Studio',
    description: 'Paste spreadsheet rows, preview a polished recipe index, and export it as a DOC file.',
    category: 'Converters',
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M8 7h8M8 11h8M8 15h5"/></svg>',
    color: '#4B4038',
    status: 'Ready',
    href: 'tools/recipe-generator/',
    tags: ['recipe', 'index', 'studio', 'doc', 'word', 'spreadsheet', 'table', 'generator', 'alphabetical'],
    badge: null,
    version: 'v1.4.0',
    updated: 'Last updated: August 20, 2026',
    dateAdded: '2026-08-12',
    priority: 90
  },
  {
    id: 'autoflow',
    name: 'Auto Flow',
    description: 'Queue prompts and automate bulk image generation with the Chrome extension. — v3.1.0',
    category: 'Extensions',
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>',
    color: '#202940',
    status: 'Extension',
    href: 'tools/autoflow/',
    tags: ['autoflow', 'chrome', 'extension', 'automation', 'bulk', 'prompts', 'ai', 'images', 'workflow'],
    badge: 'NEW VERSION',
    version: 'v3.1.0',
    updated: 'Last updated: September 5, 2026',
    dateAdded: '2026-09-05',
    priority: 95
  },
  {
    id: 'csv-cleaner',
    name: 'CSV Cleaner',
    description: 'Prepare messy spreadsheet data for your next workflow in a few clicks.',
    category: 'Converters',
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5h16M4 12h16M4 19h16M8 3v4M16 10v4M10 17v4"/></svg>',
    color: '#9A8678',
    status: 'Coming soon',
    href: '#',
    tags: ['csv', 'data', 'cleaner', 'formatting', 'table', 'rows', 'columns'],
    badge: null,
    version: null,
    updated: null,
    dateAdded: '2026-08-01',
    priority: 40
  },
  {
    id: 'prompt-builder',
    name: 'Prompt Builder',
    description: 'Shape clear, reusable prompts for the way you work and create.',
    category: 'AI Tools',
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 4h14v12H8l-3 3z"/><path d="m9 9 2 2 4-4"/></svg>',
    color: '#CAAA98',
    status: 'Coming soon',
    href: '#',
    tags: ['prompt', 'ai', 'builder', 'generator', 'templates', 'llm', 'chatgpt', 'claude'],
    badge: null,
    version: null,
    updated: null,
    dateAdded: '2026-08-02',
    priority: 50
  },
  {
    id: 'ocr-extractor',
    name: 'OCR Extractor',
    description: 'Pull useful text from images and scanned documents without the busywork.',
    category: 'AI Tools',
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2"/><path d="M8 9h8v6H8z"/></svg>',
    color: '#4B4038',
    status: 'Coming soon',
    href: '#',
    tags: ['ocr', 'text', 'extractor', 'scan', 'pdf', 'image', 'recognition', 'ai'],
    badge: null,
    version: null,
    updated: null,
    dateAdded: '2026-08-03',
    priority: 45
  }
];

// DOM references
const grid = document.querySelector('#toolGrid');
const search = document.querySelector('#toolSearch');
const count = document.querySelector('#toolCount');
const sortSelect = document.querySelector('#toolSort');
const emptyState = document.querySelector('#emptyState');
const resetFiltersBtn = document.querySelector('#resetFiltersBtn');
let activeCategory = 'All';

// 2. Render Skeletons
function renderSkeletons(countNum = 6) {
  if (!grid) return;
  const skeletonCardHTML = `
    <div class="skeleton-card" aria-hidden="true">
      <div class="skeleton-shimmer skeleton-icon"></div>
      <div class="skeleton-shimmer skeleton-title"></div>
      <div class="skeleton-shimmer skeleton-text"></div>
      <div class="skeleton-shimmer skeleton-text short"></div>
      <div class="skeleton-footer">
        <div class="skeleton-shimmer skeleton-btn"></div>
        <div class="skeleton-shimmer skeleton-btn"></div>
      </div>
    </div>
  `;
  grid.innerHTML = Array(countNum).fill(skeletonCardHTML).join('');
}

// 3. Update Category Badges & Counts
function updateCategoryCounts() {
  const categories = ['All', 'Converters', 'AI Tools', 'Extensions'];
  categories.forEach(cat => {
    const btn = document.querySelector(`.category-button[data-category="${cat}"]`);
    if (btn) {
      const toolCount = cat === 'All'
        ? tools.length
        : tools.filter(t => t.category === cat).length;
      btn.textContent = `${cat === 'All' ? 'All tools' : cat} (${toolCount})`;
    }
  });
}

// 4. Render Tools with Search, Category Filter, and Sorting
function renderTools() {
  if (!grid) return;
  const query = (search ? search.value.trim().toLowerCase() : '');
  const sortMode = sortSelect ? sortSelect.value : 'recommended';

  // Multi-field search
  let visible = tools.filter(tool => {
    const matchesCategory = activeCategory === 'All' || tool.category === activeCategory;
    if (!matchesCategory) return false;
    if (!query) return true;

    const nameMatch = tool.name.toLowerCase().includes(query);
    const descMatch = tool.description.toLowerCase().includes(query);
    const catMatch = tool.category.toLowerCase().includes(query);
    const tagMatch = Array.isArray(tool.tags) && tool.tags.some(t => t.toLowerCase().includes(query));

    return nameMatch || descMatch || catMatch || tagMatch;
  });

  // Sorting
  visible.sort((a, b) => {
    if (sortMode === 'recent') {
      return new Date(b.dateAdded || '1970-01-01') - new Date(a.dateAdded || '1970-01-01');
    }
    if (sortMode === 'alphabetical') {
      return a.name.localeCompare(b.name);
    }
    // Default: 'recommended' by priority
    return (b.priority || 0) - (a.priority || 0);
  });

  // Render Grid
  grid.innerHTML = visible.map(tool => `
    <article class="tool-card" id="card-${tool.id}" style="--tool-accent:${tool.color}">
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
        ${tool.status === 'Coming soon'
          ? '<span class="tool-coming">Coming soon</span>'
          : `<a class="tool-open" href="${tool.href}" data-tool-name="${escapeAttr(tool.name)}">Open tool &rarr;</a>`}
      </div>
    </article>
  `).join('');

  if (count) {
    count.textContent = `${visible.length} ${visible.length === 1 ? 'tool' : 'tools'}`;
  }

  if (emptyState) {
    emptyState.hidden = visible.length !== 0;
  }
}

function escapeAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g, '&quot;');
}

// 5. Reset Filters Action
function resetFilters() {
  if (search) search.value = '';
  activeCategory = 'All';
  document.querySelectorAll('.category-button').forEach(item => {
    item.classList.toggle('active', item.dataset.category === 'All');
  });
  if (sortSelect) sortSelect.value = 'recommended';
  renderTools();
  if (search) search.focus();
}

// 6. Event Listeners
if (resetFiltersBtn) {
  resetFiltersBtn.addEventListener('click', resetFilters);
}

document.querySelectorAll('.category-button').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.category-button').forEach(item => item.classList.remove('active'));
    button.classList.add('active');
    activeCategory = button.dataset.category;
    renderTools();
  });
});

if (search) {
  search.addEventListener('input', renderTools);
}

if (sortSelect) {
  sortSelect.addEventListener('change', renderTools);
}

// Keyboard shortcuts: "/" to focus search, "Escape" to clear and reset
document.addEventListener('keydown', event => {
  if (event.key === '/' && document.activeElement !== search && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
    event.preventDefault();
    if (search) search.focus();
  } else if (event.key === 'Escape' || event.key === 'Esc') {
    if (search && (document.activeElement === search || search.value !== '')) {
      search.value = '';
      search.blur();
      renderTools();
    }
  }
});

// Mobile menu toggle
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
  });
}

// Scroll progress bar
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

// Initialize App
updateCategoryCounts();
renderTools();
