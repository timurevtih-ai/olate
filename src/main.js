import { initScene } from './scene.js';
import { iconFor } from './icons.js';

const D = window.OLATE;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rub = (n) => n.toLocaleString('ru-RU') + ' ₽';
const norm = (s) => s.toLowerCase().replace(/ё/g, 'е');

const allItems = D.categories.flatMap((c) => c.items.map((it) => ({ ...it, cat: c })));
const byImg = Object.fromEntries(allItems.filter((i) => i.img).map((i) => [i.img, i]));

function priceHTML(it) {
  if (Array.isArray(it.p)) {
    return it.p.map((v, i) => `<span class="price__part">${it.pl && it.pl[i] ? `<small>${esc(it.pl[i])}</small>` : ''}${rub(v)}</span>`).join('<i class="price__sep">/</i>');
  }
  return `<span class="price__part">${rub(it.p)}</span>`;
}
const imgSrc = (name) => `img/${name}.webp`;
const placeholderHTML = (it) => `<div class="ph" aria-hidden="true">${iconFor(it)}</div>`;

/* ---------------- Загрузчик ---------------- */
const loader = $('#loader');
const loaderBar = $('#loaderBar');
let loadP = 0;
const loaderTick = setInterval(() => {
  loadP = Math.min(92, loadP + Math.random() * 18);
  loaderBar.style.transform = `scaleX(${loadP / 100})`;
}, 120);

function whenReady() {
  const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
  const load = new Promise((r) => (document.readyState === 'complete' ? r() : addEventListener('load', r, { once: true })));
  const min = new Promise((r) => setTimeout(r, reduceMotion ? 0 : 900));
  const max = new Promise((r) => setTimeout(r, 3500));
  return Promise.race([Promise.all([fonts, load, min]), max]);
}

/* ---------------- 3D ---------------- */
let scene = null;
try {
  scene = initScene($('#gl'), $('#stage'), { reduceMotion });
} catch (e) {
  scene = null;
}
if (!scene) document.documentElement.classList.add('no-gl');

/* ---------------- Разбивка заголовка на буквы ---------------- */
$$('.split').forEach((el) => {
  el.innerHTML = [...el.textContent].map((ch, i) => `<span class="ch" style="--i:${i}">${ch === ' ' ? '&nbsp;' : esc(ch)}</span>`).join('');
});

whenReady().then(() => {
  clearInterval(loaderTick);
  loaderBar.style.transform = 'scaleX(1)';
  setTimeout(() => {
    loader.classList.add('is-done');
    document.body.classList.add('is-ready');
    if (scene) scene.intro();
  }, reduceMotion ? 0 : 250);
  setTimeout(() => loader.remove(), 1600);
});

/* ---------------- Появление при прокрутке ---------------- */
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
const observeReveals = (root = document) => $$('.reveal:not(.is-in)', root).forEach((el) => io.observe(el));
observeReveals();

/* ---------------- Счётчики в первом экране ---------------- */
const years = Number(new Intl.DateTimeFormat('en', { timeZone: D.timezone, year: 'numeric' }).format(new Date())) - D.since;
const countUp = (el, to) => {
  if (reduceMotion) { el.textContent = to; return; }
  const t0 = performance.now(), dur = 1400;
  const step = (t) => {
    const k = clamp01((t - t0) / dur);
    el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};
const yEl = $('[data-count-years]'), iEl = $('[data-count-items]');
yEl.textContent = years; iEl.textContent = allItems.length;
const statsIO = new IntersectionObserver(([e]) => {
  if (!e.isIntersecting) return;
  countUp(yEl, years); countUp(iEl, allItems.length);
  statsIO.disconnect();
}, { threshold: 0.5 });
statsIO.observe($('.hero__facts'));

/* ---------------- Навигация ---------------- */
const nav = $('#nav');
const burger = $('#burger');
burger.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  burger.setAttribute('aria-expanded', open);
});
$$('#navLinks a').forEach((a) => a.addEventListener('click', () => {
  nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false');
}));

/* ---------------- Бегущая строка ---------------- */
const marquee = $('#marquee');
marquee.innerHTML += marquee.innerHTML; // дублируем для бесшовной прокрутки
let mx = 0, mWidth = 0;
const measureMarquee = () => { mWidth = marquee.scrollWidth / 2; };
measureMarquee();
addEventListener('resize', measureMarquee);

/* ---------------- Манифест: слова «проявляются» при прокрутке ---------------- */
const statement = $('#statement');
const words = statement.textContent.trim().split(/\s+/);
statement.innerHTML = words.map((w) => `<span class="w">${esc(w)}</span> `).join('');
const wordEls = $$('.w', statement);

/* ---------------- Фирменное: горизонтальная лента ---------------- */
const SIGNATURE = ['trifle-adyg', 'chanfet', 'raf-urbech', 'san-sebastian', 'meringue-pistachio-slice', 'macaron-adyg', 'bumble-fresh', 'trifle-dubai', 'adyg-chocolate'];
const sigTrack = $('#sigTrack');
sigTrack.innerHTML = SIGNATURE.map((key, i) => {
  const it = byImg[key];
  if (!it) return '';
  return `<button class="sig" data-item="${esc(key)}" data-cursor="view" style="--i:${i}">
    <span class="sig__media"><img src="${imgSrc(key)}" alt="${esc(it.n)}" loading="lazy"></span>
    <span class="sig__num">${String(i + 1).padStart(2, '0')}</span>
    <span class="sig__body"><b>${esc(it.n)}</b><span class="sig__cat">${esc(it.cat.title)}</span><span class="sig__price">${priceHTML(it)}</span></span>
  </button>`;
}).join('');
const sigSection = $('#signature');
sigTrack.prepend($('.signature__head', sigSection));
const sigCards = $$('.sig', sigTrack);
const sigImgs = sigCards.map((c) => $('img', c));
const pinMQ = matchMedia('(min-width: 900px)');
let sigDistance = 0;
function layoutSignature() {
  if (!pinMQ.matches) { sigSection.style.height = ''; sigTrack.style.transform = ''; sigDistance = 0; return; }
  sigDistance = Math.max(0, sigTrack.scrollWidth - innerWidth + 48);
  sigSection.style.height = `${innerHeight + sigDistance}px`;
}

/* ---------------- Меню ---------------- */
const tabsEl = $('#tabs');
const grid = $('#grid');
const note = $('#menuNote');
const search = $('#search');
let activeCat = D.categories[0].id;

tabsEl.innerHTML = D.categories.map((c) => `<button role="tab" id="tab-${c.id}" data-cat="${c.id}" aria-selected="false" aria-controls="grid">${esc(c.title)}<sup>${c.items.length}</sup></button>`).join('') + '<i class="tabs__pill" aria-hidden="true"></i>';
const pill = $('.tabs__pill', tabsEl);

function cardHTML(it, i) {
  const key = `${it.cat.id}:${it.n}`;
  return `<button class="card" data-key="${esc(key)}" data-cursor="view" style="--i:${Math.min(i, 14)}">
    <span class="card__media">${it.img ? `<img src="${imgSrc(it.img)}" alt="${esc(it.n)}" loading="lazy">` : placeholderHTML(it)}${it.tag ? `<em class="tag tag--${esc(norm(it.tag))}">${esc(it.tag)}</em>` : ''}</span>
    <span class="card__body">
      <b class="card__title">${esc(it.n)}</b>
      ${it.d ? `<span class="card__desc">${esc(it.d)}</span>` : ''}
      <span class="card__meta"><span class="card__vol">${esc(it.v || '')}</span><span class="price">${priceHTML(it)}</span></span>
    </span>
  </button>`;
}

const itemByKey = new Map(allItems.map((it) => [`${it.cat.id}:${it.n}`, it]));

function movePill() {
  const btn = $(`[data-cat="${activeCat}"]`, tabsEl);
  if (!btn || search.value.trim()) { pill.style.opacity = 0; return; }
  pill.style.opacity = 1;
  pill.style.width = `${btn.offsetWidth}px`;
  pill.style.transform = `translateX(${btn.offsetLeft}px)`;
}

function renderMenu() {
  const q = norm(search.value.trim());
  let items, noteText = '';
  if (q) {
    items = allItems.filter((it) => norm(`${it.n} ${it.d} ${it.cat.title}`).includes(q));
    noteText = items.length ? `Найдено: ${items.length}` : '';
  } else {
    const cat = D.categories.find((c) => c.id === activeCat);
    items = cat.items.map((it) => ({ ...it, cat }));
    noteText = cat.note || '';
  }
  $$('[role="tab"]', tabsEl).forEach((b) => {
    const on = !q && b.dataset.cat === activeCat;
    b.setAttribute('aria-selected', on);
    b.classList.toggle('is-active', on);
  });
  note.textContent = noteText;
  grid.innerHTML = items.length
    ? items.map(cardHTML).join('')
    : `<p class="empty">Ничего не нашли по запросу «${esc(search.value.trim())}». Попробуйте «раф», «трайфл» или «макарон».</p>`;
  movePill();
}

tabsEl.addEventListener('click', (e) => {
  const b = e.target.closest('[data-cat]');
  if (!b) return;
  activeCat = b.dataset.cat;
  search.value = '';
  renderMenu();
  b.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
});
tabsEl.addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
  const ids = D.categories.map((c) => c.id);
  const i = (ids.indexOf(activeCat) + (e.key === 'ArrowRight' ? 1 : -1) + ids.length) % ids.length;
  activeCat = ids[i]; search.value = ''; renderMenu();
  $(`[data-cat="${activeCat}"]`, tabsEl).focus();
});
search.addEventListener('input', renderMenu);
addEventListener('resize', movePill);
renderMenu();

/* ---------------- Торты ---------------- */
const cakesGrid = $('#cakesGrid');
const cakes = D.categories.find((c) => c.id === 'cakes').items.filter((it) => it.img).map((it) => ({ ...it, cat: { id: 'cakes', title: 'Торты' } }));
let cakeMode = 0;
const cakePrice = (it) => (Array.isArray(it.p) ? rub(it.p[cakeMode]) : rub(it.p));
const cakeLabel = (it) => (Array.isArray(it.p) ? (cakeMode ? 'кусочек' : `${it.pl[0]} · ${it.v}`) : it.v);
cakesGrid.innerHTML = cakes.map((it, i) => `
  <button class="cake reveal" data-key="cakes:${esc(it.n)}" data-cursor="view" style="--i:${i % 4}">
    <span class="cake__media"><img src="${imgSrc(it.img)}" alt="${esc(it.n)}" loading="lazy"></span>
    <span class="cake__body">
      <b>${esc(it.n)}</b>
      <span class="cake__price"><span class="flip">${cakePrice(it)}</span></span>
      <small class="cake__label">${esc(cakeLabel(it))}</small>
    </span>
  </button>`).join('');
observeReveals(cakesGrid);

const toggle = $('.toggle');
toggle.addEventListener('click', (e) => {
  const b = e.target.closest('[data-mode]');
  if (!b) return;
  cakeMode = Number(b.dataset.mode);
  toggle.classList.toggle('is-right', cakeMode === 1);
  $$('[data-mode]', toggle).forEach((x) => {
    x.classList.toggle('is-active', x === b);
    x.setAttribute('aria-pressed', x === b);
  });
  $$('.cake', cakesGrid).forEach((el, i) => {
    const it = cakes[i];
    const f = $('.flip', el);
    f.classList.remove('is-flipping'); void f.offsetWidth; f.classList.add('is-flipping');
    setTimeout(() => { f.textContent = cakePrice(it); $('.cake__label', el).textContent = cakeLabel(it); }, reduceMotion ? 0 : 180);
  });
});

/* ---------------- Адреса и статус «открыто» ---------------- */
function nowParts() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: D.timezone, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(new Date()).map((p) => [p.type, p.value]));
  return { day: parts.weekday, min: Number(parts.hour) * 60 + Number(parts.minute) };
}
const toMin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const pretty = (s) => s.replace(/^0/, '');
const isWeekend = (d) => d === 'Sat' || d === 'Sun';
const nextDay = { Mon: 'Tue', Tue: 'Wed', Wed: 'Thu', Thu: 'Fri', Fri: 'Sat', Sat: 'Sun', Sun: 'Mon' };

function status(place) {
  const { day, min } = nowParts();
  const [o, c] = place.hours[isWeekend(day) ? 'weekend' : 'weekdays'];
  if (min >= toMin(o) && min < toMin(c)) return { open: true, text: `Открыто до ${pretty(c)}` };
  if (min < toMin(o)) return { open: false, text: `Закрыто · откроется в ${pretty(o)}` };
  const [o2] = place.hours[isWeekend(nextDay[day]) ? 'weekend' : 'weekdays'];
  return { open: false, text: `Закрыто · откроется завтра в ${pretty(o2)}` };
}
function hoursText(h) {
  const a = `${pretty(h.weekdays[0])}–${pretty(h.weekdays[1])}`, b = `${pretty(h.weekend[0])}–${pretty(h.weekend[1])}`;
  return a === b ? `Ежедневно ${a}` : `Пн–Пт ${a}<br>Сб–Вс ${b}`;
}
const placesGrid = $('#placesGrid');
function renderPlaces() {
  placesGrid.innerHTML = D.places.map((pl, i) => {
    const st = status(pl);
    const q = encodeURIComponent(`О'ЛАТЕ ${pl.city || 'Яблоновский'} ${pl.address}`);
    const tel = pl.phone.replace(/[^\d+]/g, '');
    return `<article class="place reveal" style="--i:${i}" data-tilt>
      <span class="place__num">0${i + 1}</span>
      <p class="status ${st.open ? 'is-open' : ''}"><i></i>${st.text}</p>
      <h3>${esc(pl.address)}</h3>
      ${pl.city ? `<p class="place__city">${esc(pl.city)}</p>` : ''}
      <p class="place__hours">${hoursText(pl.hours)}</p>
      <div class="place__actions">
        ${pl.phone ? `<a class="btn btn--small" href="tel:${tel}">${esc(pl.phone)}</a>` : ''}
        <a class="btn btn--small btn--ghost" href="https://yandex.ru/maps/?text=${q}" target="_blank" rel="noopener">Маршрут</a>
      </div>
    </article>`;
  }).join('');
  observeReveals(placesGrid);
  bindTilt(placesGrid);
}
renderPlaces();
setInterval(() => $$('.place', placesGrid).forEach((el, i) => {
  const st = status(D.places[i]); const s = $('.status', el);
  s.classList.toggle('is-open', st.open); s.lastChild.textContent = st.text;
}), 60000);

/* ---------------- Модальное окно с блюдом ---------------- */
const modal = $('#modal');
let lastFocus = null;
function openItem(it) {
  lastFocus = document.activeElement;
  $('#cursor').classList.remove('is-view', 'is-link');
  const img = $('#modalImg');
  const media = $('.modal__media', modal);
  if (it.img) { img.src = imgSrc(it.img); img.alt = it.n; media.classList.remove('is-empty'); } else { img.removeAttribute('src'); img.alt = ''; media.classList.add('is-empty'); }
  const oldPh = $('.ph', media); if (oldPh) oldPh.remove();
  if (!it.img) media.insertAdjacentHTML('beforeend', placeholderHTML(it));
  $('#modalCat').textContent = [it.cat.title, it.v, it.tag].filter(Boolean).join(' · ');
  $('#modalTitle').textContent = it.n;
  $('#modalDesc').textContent = it.d || 'Спросите о составе у бариста — с радостью расскажем.';
  $('#modalPrice').innerHTML = priceHTML(it);
  modal.hidden = false;
  requestAnimationFrame(() => modal.classList.add('is-open'));
  document.documentElement.classList.add('is-locked');
  $('.modal__close', modal).focus();
}
function closeItem() {
  modal.classList.remove('is-open');
  document.documentElement.classList.remove('is-locked');
  setTimeout(() => { modal.hidden = true; }, reduceMotion ? 0 : 300);
  if (lastFocus) lastFocus.focus();
}
modal.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeItem(); });
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeItem(); });
document.addEventListener('click', (e) => {
  const c = e.target.closest('[data-key], [data-item]');
  if (!c || modal.contains(c)) return;
  const it = c.dataset.key ? itemByKey.get(c.dataset.key) : byImg[c.dataset.item];
  if (it) openItem(it);
});

/* ---------------- Наклон карточек ---------------- */
function bindTilt(root = document) {
  if (!finePointer || reduceMotion) return;
  $$('[data-tilt]', root).forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}
bindTilt();

/* ---------------- «Магнитные» кнопки ---------------- */
if (finePointer && !reduceMotion) {
  $$('[data-magnetic]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px, ${(e.clientY - r.top - r.height / 2) * 0.35}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

/* ---------------- Курсор ---------------- */
const cursor = $('#cursor');
let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
if (finePointer && !reduceMotion) {
  document.documentElement.classList.add('has-cursor');
  addEventListener('pointermove', (e) => {
    tx = e.clientX; ty = e.clientY;
    const t = e.target.closest ? e.target : null;
    cursor.classList.toggle('is-view', !!(t && t.closest('[data-cursor="view"]')));
    cursor.classList.toggle('is-link', !!(t && t.closest('a, button, input, label')) && !cursor.classList.contains('is-view'));
    if (scene) {
      scene.setPointer(e.clientX / innerWidth * 2 - 1, e.clientY / innerHeight * 2 - 1);
    }
  });
  addEventListener('pointerdown', () => cursor.classList.add('is-down'));
  addEventListener('pointerup', () => cursor.classList.remove('is-down'));
  document.addEventListener('pointerleave', () => cursor.classList.add('is-hidden'));
  document.addEventListener('pointerenter', () => cursor.classList.remove('is-hidden'));
}

/* ---------------- Главный цикл прокрутки ---------------- */
const progress = $('#progress');
const hero = $('#top');
const cakesSection = $('#cakes');
const drips = $('.cakes__drips');
let lastY = scrollY, vel = 0, navHidden = false;

function loop() {
  const y = scrollY, vh = innerHeight;
  const dy = y - lastY; lastY = y;
  vel += (dy - vel) * 0.12;

  // полоса прогресса
  const max = document.documentElement.scrollHeight - vh;
  progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

  // шапка: прячем при прокрутке вниз
  nav.classList.toggle('is-scrolled', y > 20);
  if (!nav.classList.contains('is-open')) {
    if (dy > 4 && y > 300 && !navHidden) { navHidden = true; nav.classList.add('is-hidden'); }
    else if (dy < -4 && navHidden) { navHidden = false; nav.classList.remove('is-hidden'); }
  }

  // 3D: прогресс первого экрана
  if (scene) scene.setProgress(y / (hero.offsetHeight * 0.9));

  // бегущая строка — быстрее при прокрутке
  if (!reduceMotion && mWidth) {
    mx -= 0.6 + Math.min(Math.abs(vel) * 0.35, 18);
    if (mx <= -mWidth) mx += mWidth;
    marquee.style.transform = `translate3d(${mx}px,0,0)`;
  }

  // манифест
  const sr = statement.getBoundingClientRect();
  const sp = clamp01((vh * 0.85 - sr.top) / (sr.height + vh * 0.35));
  const lit = sp * wordEls.length * 1.15;
  wordEls.forEach((w, i) => { w.style.opacity = reduceMotion ? 1 : (0.16 + 0.84 * clamp01(lit - i)).toFixed(3); });

  // горизонтальная лента
  if (sigDistance) {
    const r = sigSection.getBoundingClientRect();
    const p = clamp01(-r.top / (r.height - vh));
    sigTrack.style.transform = `translate3d(${-p * sigDistance}px,0,0)`;
    if (!reduceMotion) {
      sigCards.forEach((c, i) => {
        const cr = c.getBoundingClientRect();
        const k = (cr.left + cr.width / 2 - innerWidth / 2) / innerWidth;
        sigImgs[i].style.transform = `translate3d(${k * -24}px,0,0) scale(1.08)`;
      });
    }
  }

  // шоколадные капли тянутся вниз
  const cr = cakesSection.getBoundingClientRect();
  const dp = clamp01((vh - cr.bottom) / (vh * 0.6) + 0.35);
  drips.style.transform = `scaleY(${reduceMotion ? 1 : dp.toFixed(3)})`;

  // курсор
  if (finePointer && !reduceMotion) {
    cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
    cursor.style.transform = `translate3d(${cx}px,${cy}px,0)`;
  }

  requestAnimationFrame(loop);
}

addEventListener('resize', layoutSignature);
addEventListener('load', () => { layoutSignature(); measureMarquee(); movePill(); });
layoutSignature();
requestAnimationFrame(loop);

$('#year').textContent = new Date().getFullYear();
