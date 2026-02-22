// ---------------------------------------------------------------------------
// client/src/components/NotificationPanel.jsx
// ---------------------------------------------------------------------------
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import './NotificationPanel.css';

const NotificationPanel = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } = useNotification();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [open]);

  const formatTime = (date) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return d.toLocaleDateString();
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'success': return '✓';
      case 'warning': return '⚠';
      case 'error': return '✕';
      default: return 'ℹ';
    }
  };

  return (
    <div className="notification-panel-wrapper" ref={panelRef}>
      <button
        type="button"
        className="notification-bell-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className="notification-bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown" role="menu">
          <div className="notification-header">
            <h3 className="notification-title">Notifications</h3>
            <div className="notification-actions">
              {unreadCount > 0 && (
                <button type="button" className="notification-action-btn" onClick={markAllAsRead}>
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button type="button" className="notification-action-btn" onClick={clearAll}>
                  Clear all
                </button>
              )}
            </div>
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <span className="notification-empty-icon">🔕</span>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`notification-item notification-item--${n.type} ${n.read ? 'notification-item--read' : ''}`}
                  role="menuitem"
                >
                  <div className="notification-item-icon">{getTypeIcon(n.type)}</div>
                  <div className="notification-item-body">
                    {n.link ? (
                      <Link
                        to={n.link}
                        className="notification-item-link"
                        onClick={() => {
                          markAsRead(n.id);
                          setOpen(false);
                        }}
                      >
                        <span className="notification-item-title">{n.title}</span>
                        <span className="notification-item-message">{n.message}</span>
                      </Link>
                    ) : (
                      <div
                        className="notification-item-content"
                        onClick={() => markAsRead(n.id)}
                        onKeyDown={(e) => e.key === 'Enter' && markAsRead(n.id)}
                        role="button"
                        tabIndex={0}
                      >
                        <span className="notification-item-title">{n.title}</span>
                        <span className="notification-item-message">{n.message}</span>
                      </div>
                    )}
                    <span className="notification-item-time">{formatTime(n.timestamp)}</span>
                  </div>
                  <button
                    type="button"
                    className="notification-item-dismiss"
                    onClick={() => removeNotification(n.id)}
                    aria-label="Dismiss"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
