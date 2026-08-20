import { Link } from 'react-router-dom';
import { useUI } from '../context/UIContext.jsx';
import Logo from '../components/Logo.jsx';

export default function NotFound() {
  const { t } = useUI();
  return (
    <div className="page container notfound">
      <Logo size={64} showText={false} />
      <h1>404</h1>
      <p className="muted">{t('noResults')}</p>
      <Link to="/" className="btn btn-primary">{t('home')}</Link>
    </div>
  );
}
