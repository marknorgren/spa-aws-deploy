import { useLocation } from 'react-router-dom';

export function RouteViewer() {
  const location = useLocation();
  return (
    <div style={{ fontSize: '0.9em', color: '#666', margin: '1rem 0' }}>
      Current route: <code>{location.pathname}</code>
    </div>
  );
}
