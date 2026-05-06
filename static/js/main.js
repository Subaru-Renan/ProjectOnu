/* ═══════════════════════════════════════════════════════════
   ONU — Árvore Interativa  |  main.js
   Operações: Traversal, Busca (DFS/BFS), Inserção, Exclusão,
              Métricas (Altura, Grau)
   ═══════════════════════════════════════════════════════════ */

const CONTINENT_EMOJI = { Africa:'🌍', Americas:'🌎', Asia:'🌏', Europe:'🏰', Oceania:'🌊', Antarctic:'🧊' };

/* ── In-memory tree (pure JS objects) ──────────────────────── */
// Structure: { continent: { region: [ {name, flag, capital, population, area, cca3} ] } }
let TREE = {};

/* ── Helpers ────────────────────────────────────────────────── */
function fmt(n) {
  if (!n) return 'N/A';
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
  return '' + n;
}

function el(tag, cls) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  return e;
}

function vLine(size) {
  const v = el('div', 'v-line ' + size);
  return v;
}

/* ── Tree metrics ───────────────────────────────────────────── */
// Height = levels below this node (country = 0, region = 1, continent = 2, root = 3)
// Degree  = number of direct children
function getTreeMetrics() {
  const continents = Object.keys(TREE);
  let totalCountries = 0;
  let totalRegions   = 0;
  continents.forEach(c => {
    const regions = Object.keys(TREE[c]);
    totalRegions += regions.length;
    regions.forEach(r => { totalCountries += TREE[c][r].length; });
  });
  return {
    rootHeight:   3,
    rootDegree:   continents.length,
    totalCountries, totalRegions,
    continents:   continents.length,
  };
}

function continentMetrics(continent) {
  const regions = Object.keys(TREE[continent] || {});
  const degree  = regions.length;
  const height  = 2; // continent → region → country
  return { height, degree };
}

function regionMetrics(continent, region) {
  const countries = (TREE[continent] || {})[region] || [];
  return { height: 1, degree: countries.length };
}

function countryMetrics(continent, region, countryName) {
  const countries = ((TREE[continent] || {})[region] || []);
  const idx       = countries.findIndex(c => c.name === countryName);
  // Depth from root = 3 (root→continent→region→country)
  // Country is a leaf: height=0, degree=0
  return { height: 0, degree: 0, depth: 3, index: idx };
}

/* ── Traversals ─────────────────────────────────────────────── */
// Returns flat array of country names in given order
function traversePreOrder() {
  const result = [];
  Object.keys(TREE).sort().forEach(continent => {
    Object.keys(TREE[continent]).sort().forEach(region => {
      TREE[continent][region].forEach(country => result.push(country.name));
    });
  });
  return result;
}

// In-order: alphabetically within each region, sort regions, sort continents
function traverseInOrder() {
  const result = [];
  const continents = Object.keys(TREE).sort();
  continents.forEach(continent => {
    const regions = Object.keys(TREE[continent]).sort();
    const mid = Math.floor(regions.length / 2);
    // Visit left regions, then continent "node", then right regions
    const leftRegions  = regions.slice(0, mid);
    const rightRegions = regions.slice(mid);
    leftRegions.forEach(r  => TREE[continent][r].forEach(c => result.push(c.name)));
    rightRegions.forEach(r => TREE[continent][r].forEach(c => result.push(c.name)));
  });
  return result;
}

// Post-order: children before parent (countries, then region label, then continent)
function traversePostOrder() {
  const result = [];
  Object.keys(TREE).sort().forEach(continent => {
    Object.keys(TREE[continent]).sort().forEach(region => {
      TREE[continent][region].forEach(country => result.push(country.name));
    });
  });
  return result;
}

/* Animate traversal highlights with delay */
function animateTraversal(names) {
  clearHighlights();
  const nodes = document.querySelectorAll('.country-node');
  const nodeMap = {};
  nodes.forEach(n => { nodeMap[n.dataset.name] = n; });

  names.forEach((name, i) => {
    const key = name.toLowerCase();
    setTimeout(() => {
      if (nodeMap[key]) {
        nodeMap[key].classList.add('traversal-highlight');
        setTimeout(() => nodeMap[key].classList.remove('traversal-highlight'), 600);
      }
    }, i * 60);
  });

  // Show result text
  const resultEl = document.getElementById('travResult');
  resultEl.textContent = names.join('  →  ');
  resultEl.classList.remove('empty');
}

/* ── Search (DFS & BFS) ─────────────────────────────────────── */
function searchDFS(query) {
  const q = query.toLowerCase();
  // DFS: depth-first through continent → region → country
  const stack = [];
  Object.keys(TREE).sort().forEach(continent => {
    Object.keys(TREE[continent]).sort().forEach(region => {
      TREE[continent][region].forEach(country => {
        if (country.name.toLowerCase().includes(q)) {
          stack.push({ continent, region, country });
        }
      });
    });
  });
  return stack;
}

function searchBFS(query) {
  const q = query.toLowerCase();
  // BFS: level by level (continent → all regions → all countries)
  const queue = [];
  const continents = Object.keys(TREE).sort();
  for (const continent of continents) {
    const regions = Object.keys(TREE[continent]).sort();
    for (const region of regions) {
      for (const country of TREE[continent][region]) {
        if (country.name.toLowerCase().includes(q)) {
          queue.push({ continent, region, country });
        }
      }
    }
  }
  return queue;
}

/* ── Highlight search results + show path ───────────────────── */
let pathTimeout = null;

function showPath(continent, region, countryName) {
  const pathEl = document.getElementById('pathDisplay');
  pathEl.style.display = 'block';
  pathEl.innerHTML = `<span class="path-label">Caminho:</span>
    <span class="path-value">🌐 ONU  →  ${continent}  →  ${region}  →  ${countryName}</span>`;
  clearTimeout(pathTimeout);
  pathTimeout = setTimeout(() => { pathEl.style.display = 'none'; }, 4000);
}

function performSearch(query, method = 'dfs') {
  clearHighlights();
  if (!query.trim()) return;

  expandAll();

  const results = method === 'bfs' ? searchBFS(query) : searchDFS(query);
  const nodes   = document.querySelectorAll('.country-node');
  const nameMap = {};
  nodes.forEach(n => { nameMap[n.dataset.name] = n; });

  let firstFound = null;
  results.forEach(({ continent, region, country }) => {
    const node = nameMap[country.name.toLowerCase()];
    if (node) {
      node.classList.add('highlighted');
      if (!firstFound) {
        firstFound = { continent, region, name: country.name };
        node.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    // Hide others
  });

  // Hide non-matching
  nodes.forEach(n => {
    if (!n.classList.contains('highlighted')) n.style.opacity = '0.3';
  });

  if (firstFound) showPath(firstFound.continent, firstFound.region, firstFound.name);

  return results.length;
}

function clearHighlights() {
  document.querySelectorAll('.country-node').forEach(n => {
    n.classList.remove('highlighted', 'path-highlight', 'traversal-highlight');
    n.style.opacity = '';
    n.style.display = '';
  });
  document.getElementById('pathDisplay').style.display = 'none';
}

/* ── Insert ─────────────────────────────────────────────────── */
function insertCountry(name, continent, region) {
  if (!name || !continent || !region) return { ok: false, msg: 'Preencha todos os campos.' };
  if (!TREE[continent])         return { ok: false, msg: `Continente "${continent}" não encontrado.` };
  if (!TREE[continent][region]) {
    // Create new region
    TREE[continent][region] = [];
  }
  // Check duplicate
  const exists = TREE[continent][region].some(c => c.name.toLowerCase() === name.toLowerCase());
  if (exists) return { ok: false, msg: `"${name}" já existe nessa região.` };

  const newCountry = { name, flag: '', capital: 'N/A', population: 0, area: 0, cca3: '—' };
  TREE[continent][region].push(newCountry);
  TREE[continent][region].sort((a, b) => a.name.localeCompare(b.name));

  // Re-render that region
  rebuildRegion(continent, region);
  // Highlight new node
  setTimeout(() => {
    const node = document.querySelector(`.country-node[data-name="${name.toLowerCase()}"]`);
    if (node) {
      node.classList.add('inserted');
      expandPath(continent, region);
      node.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => node.classList.remove('inserted'), 2000);
    }
  }, 100);

  updateStats();
  return { ok: true, msg: `"${name}" inserido em ${continent} › ${region}.` };
}

/* ── Delete ─────────────────────────────────────────────────── */
function deleteCountry(continent, region, name) {
  if (!TREE[continent] || !TREE[continent][region]) return false;
  const idx = TREE[continent][region].findIndex(c => c.name === name);
  if (idx === -1) return false;
  TREE[continent][region].splice(idx, 1);
  // If region empty, remove it
  if (TREE[continent][region].length === 0) {
    delete TREE[continent][region];
    if (Object.keys(TREE[continent]).length === 0) delete TREE[continent];
  }
  rebuildRegion(continent, region);
  updateStats();
  return true;
}

/* ── Expand helpers ─────────────────────────────────────────── */
function expandAll() {
  document.querySelectorAll('.regions-wrap').forEach(e  => e.classList.add('open'));
  document.querySelectorAll('.continent-node').forEach(e => e.classList.add('active'));
  document.querySelectorAll('.countries-wrap').forEach(e => e.classList.add('open'));
  document.querySelectorAll('.region-node').forEach(e   => e.classList.add('active'));
}

function collapseAll() {
  document.querySelectorAll('.regions-wrap').forEach(e  => e.classList.remove('open'));
  document.querySelectorAll('.continent-node').forEach(e => e.classList.remove('active'));
  document.querySelectorAll('.countries-wrap').forEach(e => e.classList.remove('open'));
  document.querySelectorAll('.region-node').forEach(e   => e.classList.remove('active'));
}

function expandPath(continent, region) {
  const contId = `cont-wrap-${continent.replace(/\s/g,'_')}`;
  const regId  = `reg-wrap-${continent.replace(/\s/g,'_')}-${region.replace(/[^a-zA-Z0-9]/g,'_')}`;
  const cWrap  = document.getElementById(contId);
  const rWrap  = document.getElementById(regId);
  if (cWrap) { cWrap.classList.add('open'); cWrap.previousElementSibling?.classList.add('active'); }
  if (rWrap) { rWrap.classList.add('open'); rWrap.previousElementSibling?.classList.add('active'); }
}

/* ── Update stats bar ───────────────────────────────────────── */
function updateStats() {
  let tR = 0, tC = 0;
  for (const c in TREE) { for (const r in TREE[c]) { tR++; tC += TREE[c][r].length; } }
  document.getElementById('sCont').textContent  = Object.keys(TREE).length;
  document.getElementById('sReg').textContent   = tR;
  document.getElementById('sCoun').textContent  = tC;
  document.querySelector('.root-sub').textContent = `${tC} países · ${Object.keys(TREE).length} continentes · ${tR} regiões`;
}

/* ── Build a single country node element ────────────────────── */
function buildCountryNode(co, continent, region) {
  const cn = el('div', 'country-node');
  cn.dataset.name      = co.name.toLowerCase();
  cn.dataset.continent = continent;
  cn.dataset.region    = region;
  cn.dataset.fullname  = co.name;

  const m = countryMetrics(continent, region, co.name);

  cn.innerHTML = `
    <img class="c-flag" src="${co.flag}" alt="${co.name}" loading="lazy" onerror="this.style.display='none'">
    <span class="c-name-txt">${co.name}</span>
    <div class="metrics-badge">H:${m.height} G:${m.degree}</div>
    <button class="c-delete-btn" title="Remover país">✕</button>
    <div class="c-tooltip">
      <img class="tt-flag" src="${co.flag}" alt="${co.name}" loading="lazy" onerror="this.style.display='none'">
      <div class="tt-name">${co.name}</div>
      <div class="tt-row"><span>Capital</span><span class="tt-val">${co.capital || 'N/A'}</span></div>
      <div class="tt-row"><span>População</span><span class="tt-val">${fmt(co.population)}</span></div>
      <div class="tt-row"><span>Área</span><span class="tt-val">${fmt(co.area)} km²</span></div>
      <div class="tt-row"><span>Código</span><span class="tt-val">${co.cca3 || 'N/A'}</span></div>
      <hr class="tt-divider">
      <div class="tt-metric-row">
        <span class="tt-metric-lbl">Altura: <b>${m.height}</b></span>
        <span class="tt-metric-val">Grau: ${m.degree}</span>
      </div>
      <div class="tt-row" style="margin-top:3px"><span style="font-size:10px;color:var(--text-dim)">Profundidade: ${m.depth}</span></div>
    </div>`;

  // Click: show path
  cn.addEventListener('click', (e) => {
    if (e.target.classList.contains('c-delete-btn')) return;
    showPath(continent, region, co.name);
  });

  // Delete button
  cn.querySelector('.c-delete-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('deleteInfo').innerHTML = `Remover: <span>${co.name}</span>?`;
    document.getElementById('btnConfirmDelete').dataset.continent = continent;
    document.getElementById('btnConfirmDelete').dataset.region    = region;
    document.getElementById('btnConfirmDelete').dataset.name      = co.name;
    // Highlight
    document.querySelectorAll('.country-node.selected-delete').forEach(n => n.classList.remove('selected-delete'));
    cn.classList.add('selected-delete');
    document.getElementById('editPanel').style.display = 'flex';
  });

  return cn;
}

/* ── Rebuild a specific region's countries grid ─────────────── */
function rebuildRegion(continent, region) {
  const regId  = `reg-wrap-${continent.replace(/\s/g,'_')}-${region.replace(/[^a-zA-Z0-9]/g,'_')}`;
  const cWrap  = document.getElementById(regId);
  if (!cWrap) { rebuildFullTree(); return; }

  const grid = cWrap.querySelector('.countries-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const countries = (TREE[continent] || {})[region] || [];
  countries.forEach((co, ki) => {
    const cn = buildCountryNode(co, continent, region);
    cn.style.animationDelay = `${ki * 0.015}s`;
    grid.appendChild(cn);
  });

  // Update region count badge
  const rNode = cWrap.previousElementSibling;
  if (rNode) {
    const badge = rNode.querySelector('.r-count');
    if (badge) badge.textContent = countries.length;
  }
}

/* ── Full tree render ───────────────────────────────────────── */
function rebuildFullTree() {
  buildTreeDOM(TREE);
}

function buildTreeDOM(data) {
  const container = document.getElementById('treeContainer');
  container.innerHTML = '';

  let tR = 0, tC = 0;
  for (const c in data) { for (const r in data[c]) { tR++; tC += data[c][r].length; } }

  document.getElementById('sCont').textContent = Object.keys(data).length;
  document.getElementById('sReg').textContent  = tR;
  document.getElementById('sCoun').textContent = tC;
  document.getElementById('statsBar').style.display = 'flex';
  document.getElementById('traversalPanel').style.display = 'flex';

  // Root
  const root = el('div', '');
  root.innerHTML = `<div class="root-card">
    <div class="root-icon">🌐</div>
    <div>
      <div class="root-label">ONU — Nações Unidas</div>
      <div class="root-sub">${tC} países · ${Object.keys(data).length} continentes · ${tR} regiões</div>
    </div>
  </div>`;
  container.appendChild(root);
  container.appendChild(vLine('s'));

  const crow = el('div', 'continents-row');

  Object.entries(data).forEach(([continent, regions], ci) => {
    const cnt   = Object.values(regions).reduce((s, a) => s + a.length, 0);
    const emoji = CONTINENT_EMOJI[continent] || '🌐';
    const cm    = continentMetrics(continent);

    const branch = el('div', 'continent-branch');
    branch.style.animationDelay = `${ci * 0.07}s`;
    branch.appendChild(vLine('s'));

    const node = el('div', 'continent-node');
    node.dataset.continent = continent;
    node.title = `Altura: ${cm.height}  |  Grau: ${cm.degree}`;
    node.innerHTML = `<span class="c-emoji">${emoji}</span>
      <span class="c-name">${continent}</span>
      <span class="c-count">${cnt}</span>
      <span class="chevron">▼</span>`;
    branch.appendChild(node);

    const rWrap = el('div', 'regions-wrap');
    rWrap.id = `cont-wrap-${continent.replace(/\s/g,'_')}`;
    rWrap.appendChild(vLine('m'));
    const rRow = el('div', 'regions-row');

    Object.entries(regions).forEach(([region, countries], ri) => {
      const rm = regionMetrics(continent, region);
      const rb = el('div', 'region-branch');
      rb.style.animationDelay = `${ri * 0.05}s`;
      rb.appendChild(vLine('s'));

      const rn = el('div', 'region-node');
      rn.dataset.continent = continent;
      rn.dataset.region    = region;
      rn.title = `Altura: ${rm.height}  |  Grau: ${rm.degree}`;
      rn.innerHTML = `<span class="r-name">${region}</span>
        <span class="r-count">${countries.length}</span>
        <span class="chevron" style="font-size:9px;color:var(--text-dim)">▼</span>`;
      rb.appendChild(rn);

      const cWrap = el('div', 'countries-wrap');
      cWrap.id = `reg-wrap-${continent.replace(/\s/g,'_')}-${region.replace(/[^a-zA-Z0-9]/g,'_')}`;
      cWrap.appendChild(vLine('s'));

      const grid = el('div', 'countries-grid');
      countries.forEach((co, ki) => {
        const cn = buildCountryNode(co, continent, region);
        cn.style.animationDelay = `${ki * 0.015}s`;
        grid.appendChild(cn);
      });

      cWrap.appendChild(grid);
      rb.appendChild(cWrap);

      rn.addEventListener('click', () => {
        const open = cWrap.classList.toggle('open');
        rn.classList.toggle('active', open);
      });

      rRow.appendChild(rb);
    });

    rWrap.appendChild(rRow);
    branch.appendChild(rWrap);

    node.addEventListener('click', () => {
      const open = rWrap.classList.toggle('open');
      node.classList.toggle('active', open);
    });

    crow.appendChild(branch);
  });

  container.appendChild(crow);
  container.classList.add('visible');
}

/* ── UI event bindings ──────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  // Search
  const searchInput = document.getElementById('searchInput');
  let searchDebounce;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    const q = searchInput.value.trim();
    if (!q) { clearHighlights(); return; }
    searchDebounce = setTimeout(() => {
      const method = document.getElementById('searchMethod')?.value || 'dfs';
      performSearch(q, method);
    }, 300);
  });

  // Traversal buttons
  document.getElementById('btnPreOrder').addEventListener('click', () => {
    expandAll();
    const names = traversePreOrder();
    animateTraversal(names);
  });
  document.getElementById('btnInOrder').addEventListener('click', () => {
    expandAll();
    const names = traverseInOrder();
    animateTraversal(names);
  });
  document.getElementById('btnPostOrder').addEventListener('click', () => {
    expandAll();
    const names = traversePostOrder();
    animateTraversal(names);
  });

  // Expand / Collapse
  document.getElementById('btnExpand').addEventListener('click',   expandAll);
  document.getElementById('btnCollapse').addEventListener('click', collapseAll);

  // Toggle edit panel
  document.getElementById('btnEdit').addEventListener('click', () => {
    const p = document.getElementById('editPanel');
    p.style.display = p.style.display === 'flex' ? 'none' : 'flex';
  });

  // Insert
  document.getElementById('btnInsert').addEventListener('click', () => {
    const name      = document.getElementById('insertName').value.trim();
    const continent = document.getElementById('insertContinent').value.trim();
    const region    = document.getElementById('insertRegion').value.trim();
    const result    = insertCountry(name, continent, region);
    const info      = document.getElementById('deleteInfo');
    info.innerHTML  = result.ok
      ? `<span style="color:var(--accent)">${result.msg}</span>`
      : `<span style="color:var(--danger)">${result.msg}</span>`;
    if (result.ok) {
      document.getElementById('insertName').value = '';
    }
  });

  // Confirm delete
  document.getElementById('btnConfirmDelete').addEventListener('click', (e) => {
    const btn       = e.currentTarget;
    const continent = btn.dataset.continent;
    const region    = btn.dataset.region;
    const name      = btn.dataset.name;
    if (!name) return;
    const ok = deleteCountry(continent, region, name);
    document.getElementById('deleteInfo').innerHTML = ok
      ? `<span style="color:var(--accent)">"${name}" removido.</span>`
      : `<span style="color:var(--danger)">Erro ao remover.</span>`;
    btn.dataset.name = '';
  });

  // Cancel delete
  document.getElementById('btnCancelDelete').addEventListener('click', () => {
    document.querySelectorAll('.country-node.selected-delete').forEach(n => n.classList.remove('selected-delete'));
    document.getElementById('deleteInfo').innerHTML = '';
    document.getElementById('btnConfirmDelete').dataset.name = '';
  });

});

/* ── Bootstrap: load data from API ─────────────────────────── */
async function loadData() {
  try {
    const endpoint = window.API_ENDPOINT || 'https://restcountries.com/v3.1/all?fields=name,region,subregion,flags,population,area,capital,cca3';
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error('Falha na API');
    const raw = await res.json();

    // Build in-memory tree
    const tree = {};
    raw.forEach(co => {
      const cont = co.region || 'Unknown';
      const reg  = co.subregion || (cont + ' — Outros');
      if (!tree[cont])      tree[cont] = {};
      if (!tree[cont][reg]) tree[cont][reg] = [];
      tree[cont][reg].push({
        name:       (co.name || {}).common || 'N/A',
        flag:       (co.flags || {}).svg   || (co.flags || {}).png || '',
        capital:    (co.capital || ['N/A'])[0],
        population: co.population || 0,
        area:       co.area       || 0,
        cca3:       co.cca3       || '',
      });
    });

    // Sort
    TREE = {};
    Object.keys(tree).sort().forEach(c => {
      TREE[c] = {};
      Object.keys(tree[c]).sort().forEach(r => {
        TREE[c][r] = tree[c][r].sort((a, b) => a.name.localeCompare(b.name));
      });
    });

    buildTreeDOM(TREE);

    const ls = document.getElementById('loadingScreen');
    ls.classList.add('hidden');
    setTimeout(() => ls.remove(), 600);

  } catch (err) {
    const eb = document.getElementById('errBox');
    eb.style.display = 'block';
    eb.innerHTML = `<div class="error-box">
      <div style="font-size:32px;margin-bottom:12px">⚠️</div>
      <b>Erro ao carregar dados</b>
      <p style="margin-top:8px;font-size:12px">${err.message}</p>
      <button class="btn" style="margin-top:16px" onclick="location.reload()">Tentar novamente</button>
    </div>`;
    document.getElementById('loadingScreen').classList.add('hidden');
  }
}

loadData();
