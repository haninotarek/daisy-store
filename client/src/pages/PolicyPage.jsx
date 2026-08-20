import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { StoreAPI } from '../services/api.js';
import { useUI } from '../context/UIContext.jsx';
import { Spinner } from '../components/Common.jsx';

export default function PolicyPage() {
  const { key } = useParams();
  const { L } = useUI();
  const [policy, setPolicy] = useState(null);
  useEffect(() => { setPolicy(null); StoreAPI.policy(key).then((d) => setPolicy(d.policy)).catch(() => setPolicy(false)); }, [key]);

  if (policy === null) return <div className="page container"><Spinner center /></div>;
  if (!policy) return <div className="page container"><h1 className="page-title">—</h1></div>;

  return (
    <div className="page container policy">
      <div className="page-header-simple"><h1>{L(policy, 'title')}</h1></div>
      <div className="policy-content">
        {L(policy, 'content').split('\n').map((p, i) => <p key={i}>{p}</p>)}
      </div>
    </div>
  );
}
