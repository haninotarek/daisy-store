// Minimal, consistent line icons (stroke = currentColor).
const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
const wrap = (children, size = 20) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...S} aria-hidden="true">{children}</svg>
);

export const IconSearch = ({ size }) => wrap(<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>, size);
export const IconHeart = ({ size, filled }) => (
  <svg width={size || 20} height={size || 20} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 21s-7.5-4.6-10-9A5.2 5.2 0 0 1 12 6a5.2 5.2 0 0 1 10 6c-2.5 4.4-10 9-10 9Z" />
  </svg>
);
export const IconBag = ({ size }) => wrap(<><path d="M6 8h12l-1 12H7L6 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>, size);
export const IconUser = ({ size }) => wrap(<><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>, size);
export const IconMenu = ({ size }) => wrap(<><path d="M3 6h18M3 12h18M3 18h18" /></>, size);
export const IconClose = ({ size }) => wrap(<><path d="M6 6l12 12M18 6 6 18" /></>, size);
export const IconSun = ({ size }) => wrap(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>, size);
export const IconMoon = ({ size }) => wrap(<><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></>, size);
export const IconChevronDown = ({ size }) => wrap(<><path d="m6 9 6 6 6-6" /></>, size);
export const IconChevronRight = ({ size }) => wrap(<><path d="m9 6 6 6-6 6" /></>, size);
export const IconChevronLeft = ({ size }) => wrap(<><path d="m15 6-6 6 6 6" /></>, size);
export const IconMinus = ({ size }) => wrap(<><path d="M5 12h14" /></>, size);
export const IconPlus = ({ size }) => wrap(<><path d="M12 5v14M5 12h14" /></>, size);
export const IconTrash = ({ size }) => wrap(<><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13" /></>, size);
export const IconCheck = ({ size }) => wrap(<><path d="m5 12 5 5L20 7" /></>, size);
export const IconWhatsapp = ({ size }) => (
  <svg width={size || 20} height={size || 20} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm5.7 14.3c-.2.7-1.4 1.3-2 1.4-.5.1-1.1.1-1.8-.1-.4-.1-1-.3-1.6-.6-2.9-1.2-4.7-4.1-4.9-4.3-.1-.2-1.1-1.5-1.1-2.8 0-1.3.7-2 .9-2.2.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.5.1.3.7 1.1 1.4 1.8.9.8 1.7 1.1 2 1.2.2.1.4.1.5-.1l.6-.7c.2-.2.3-.2.5-.1l1.8.9c.2.1.4.2.4.3.1.2.1.6 0 1Z" />
  </svg>
);
export const IconInstagram = ({ size }) => wrap(<><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" /></>, size);
export const IconFacebook = ({ size }) => wrap(<><path d="M14 8h2V5h-2a3 3 0 0 0-3 3v2H9v3h2v6h3v-6h2l1-3h-3V8a1 1 0 0 1 1-1Z" /></>, size);
export const IconStar = ({ size }) => wrap(<><path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19l1-5.8L3.5 9.2l5.9-.9L12 3Z" /></>, size);
export const IconGrid = ({ size }) => wrap(<><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></>, size);
export const IconBox = ({ size }) => wrap(<><path d="M3 7l9-4 9 4v10l-9 4-9-4V7Z" /><path d="M3 7l9 4 9-4M12 21V11" /></>, size);
export const IconTag = ({ size }) => wrap(<><path d="M3 3h8l10 10-8 8L3 11V3Z" /><circle cx="7" cy="7" r="1.4" /></>, size);
export const IconSettings = ({ size }) => wrap(<><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2 2M17 17l2 2M19.1 4.9l-2 2M7 17l-2 2" /></>, size);
export const IconImage = ({ size }) => wrap(<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></>, size);
export const IconLayout = ({ size }) => wrap(<><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></>, size);
export const IconClipboard = ({ size }) => wrap(<><rect x="8" y="4" width="8" height="4" rx="1" /><path d="M8 6H6v14h12V6h-2" /></>, size);
export const IconUsers = ({ size }) => wrap(<><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3 3-5 6-5s6 2 6 5" /><path d="M16 5a3 3 0 0 1 0 6M22 20c0-2.5-1.6-4.2-4-4.7" /></>, size);
export const IconFile = ({ size }) => wrap(<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" /><path d="M14 3v5h5" /></>, size);
export const IconLogout = ({ size }) => wrap(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></>, size);
export const IconEdit = ({ size }) => wrap(<><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" /></>, size);
export const IconDup = ({ size }) => wrap(<><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></>, size);
export const IconEye = ({ size }) => wrap(<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>, size);
export const IconArrowRight = ({ size }) => wrap(<><path d="M5 12h14M13 6l6 6-6 6" /></>, size);
