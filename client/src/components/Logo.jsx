import { Link } from 'react-router-dom';
import { useUI } from '../context/UIContext.jsx';

// Daisy logo — image mark + wordmark. Logo URL comes from store settings
// (falls back to the bundled default), so the owner can replace it in admin.
export default function Logo({ size = 40, showText = true, to = '/' }) {
  const { settings } = useUI();
  const logo = settings?.logo || '/logo.png';
  const name = settings?.storeName || 'Daisy';
  return (
    <Link to={to} className="logo" aria-label={name}>
      <img src={logo} alt={name} width={size} height={size} className="logo-mark" style={{ width: size, height: size }} />
      {showText && <span className="logo-text">{name}</span>}
    </Link>
  );
}
