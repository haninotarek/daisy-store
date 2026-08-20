import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';

export default function StoreLayout() {
  return (
    <div className="store-layout">
      <Navbar />
      <main className="store-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
