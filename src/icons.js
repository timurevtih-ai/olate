// Линейные иллюстрации для позиций без фото (viewBox 0 0 64 64, обводка currentColor).
const I = {
  cup: '<path d="M14 26h30v10a15 15 0 0 1-30 0z"/><path d="M44 29h3a6 6 0 0 1 0 12h-4"/><path d="M8 52h42"/><path d="M22 18c-2-3 2-5 0-8M30 18c-2-3 2-5 0-8M38 18c-2-3 2-5 0-8"/>',
  cezve: '<path d="M18 22h22l-3 26a4 4 0 0 1-4 4H25a4 4 0 0 1-4-4z"/><path d="M16 22h26"/><path d="M40 26l14-8"/><path d="M24 15c-2-3 2-4 0-7M33 15c-2-3 2-4 0-7"/>',
  glass: '<path d="M18 12h28l-4 42a3 3 0 0 1-3 2H25a3 3 0 0 1-3-2z"/><path d="M20 26h24"/><rect x="25" y="31" width="7" height="7" rx="1.5"/><rect x="33" y="38" width="7" height="7" rx="1.5"/><path d="M38 4l-4 22"/>',
  bottle: '<path d="M27 6h10v6c0 3 7 6 7 13v27a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4V25c0-7 7-10 7-13z"/><path d="M26 6h12"/><rect x="22" y="30" width="20" height="14" rx="2"/>',
  teapot: '<path d="M14 30h32v6a14 14 0 0 1-14 14h-4a14 14 0 0 1-14-14z"/><path d="M46 33c5 0 8 3 8 7s-3 6-8 6"/><path d="M14 34l-6-6"/><path d="M24 30v-5a6 6 0 0 1 12 0v5"/><path d="M28 19h4"/>',
  cake: '<path d="M8 40l30-22 18 10v18L26 56 8 46z"/><path d="M8 40l18 6 30-18"/><path d="M26 46v10"/><path d="M8 43l18 6M26 49l30-15"/><circle cx="40" cy="20" r="3"/>',
  jar: '<path d="M16 18h32v32a6 6 0 0 1-6 6H22a6 6 0 0 1-6-6z"/><path d="M14 18h36"/><path d="M16 32c6 3 10-3 16 0s10 3 16 0"/><path d="M16 42c6 3 10-3 16 0s10 3 16 0"/><circle cx="32" cy="12" r="3"/>',
  tart: '<path d="M8 36h48l-5 12H13z"/><path d="M8 36c4-4 8-4 12 0s8 4 12 0 8-4 12 0 8 4 12 0"/><circle cx="22" cy="28" r="4"/><circle cx="32" cy="25" r="4"/><circle cx="42" cy="28" r="4"/>',
  macaron: '<path d="M10 28c0-9 10-14 22-14s22 5 22 14z"/><path d="M10 36c0 9 10 14 22 14s22-5 22-14z"/><path d="M8 32h48"/><path d="M10 28c-1 1-2 2-2 4s1 3 2 4M54 28c1 1 2 2 2 4s-1 3-2 4"/>',
  bar: '<rect x="12" y="10" width="40" height="44" rx="3"/><path d="M12 25h40M12 40h40M25 10v44M39 10v44"/>',
  cookie: '<circle cx="32" cy="32" r="22"/><circle cx="24" cy="24" r="2.5"/><circle cx="38" cy="22" r="2"/><circle cx="40" cy="36" r="2.5"/><circle cx="26" cy="40" r="2"/><circle cx="32" cy="31" r="1.5"/>'
};

const BY_CAT = { coffee: 'cup', caucasus: 'cup', cold: 'bottle', tea: 'teapot', fresh: 'glass', shakes: 'glass', cakes: 'cake', trifles: 'tart', macaron: 'macaron', sweets: 'bar', kitchen: 'cake' };

export function iconFor(item) {
  const key = item.icon || BY_CAT[item.cat && item.cat.id] || 'cup';
  return `<svg class="ph__icon" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[key] || I.cup}</svg>`;
}
