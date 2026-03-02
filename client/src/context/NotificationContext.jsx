// ---------------------------------------------------------------------------
// client/src/context/NotificationContext.jsx
// ---------------------------------------------------------------------------
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { onValue, off, ref } from 'firebase/database';
import { database, fireAuth } from '../firebase/firebase.config';

const NotificationContext = createContext();
const WELCOME_SHOWN_KEY = 'bidstation-welcome-notif-shown';

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return ctx;
};

// Generate unique IDs
const genId = () => `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// Load from localStorage on init
const STORAGE_KEY = 'bidstation-notifications';
const loadStored = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.map((n) => ({ ...n, timestamp: new Date(n.timestamp) }));
    }
  } catch {}
  return [];
};

const saveStored = (list) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(list.map((n) => ({ ...n, timestamp: n.timestamp?.toISOString?.() ?? new Date().toISOString() })))
    );
  } catch {}
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(loadStored);

  // Bootstrap a welcome notification for first-time local users
  useEffect(() => {
    const stored = loadStored();
    if (stored.length === 0 && !localStorage.getItem(WELCOME_SHOWN_KEY)) {
      const welcome = {
        id: genId(),
        type: 'info',
        title: 'Welcome to BidStation',
        message: "You'll see bid updates, auction alerts, and other notifications here.",
        read: false,
        timestamp: new Date(),
        link: '/dashboard',
      };
      setNotifications([welcome]);
      saveStored([welcome]);
      localStorage.setItem(WELCOME_SHOWN_KEY, '1');
    }
  }, []);

  // Subscribe to Firebase notifications for the current user
  useEffect(() => {
    const unsubscribers = [];

    const attach = (uid) => {
      if (!uid) return;
      const notifRef = ref(database, `notifications/${uid}`);
      const handler = (snapshot) => {
        if (!snapshot.exists()) {
          return;
        }
        const raw = snapshot.val() || {};
        const fromServer = Object.entries(raw)
          .map(([id, value]) => ({
            id,
            type: 'info',
            title: value.type || 'Notification',
            message: value.message || '',
            read: !!value.read,
            timestamp: new Date(value.createdAt || Date.now()),
            link: value.auctionId ? `/auction/${value.auctionId}` : undefined,
          }))
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 50);

        setNotifications((prevLocal) => {
          const merged = [...fromServer, ...prevLocal].slice(0, 50);
          saveStored(merged);
          return merged;
        });
      };
      onValue(notifRef, handler);
      unsubscribers.push(() => off(notifRef, 'value', handler));
    };

    const auth = fireAuth;
    const current = auth.currentUser;
    if (current?.uid) {
      attach(current.uid);
    }

    const unsubAuth = auth.onAuthStateChanged((user) => {
      unsubscribers.forEach((fn) => fn());
      unsubscribers.length = 0;
      if (user?.uid) {
        attach(user.uid);
      } else {
        setNotifications(loadStored);
      }
    });

    return () => {
      unsubscribers.forEach((fn) => fn());
      unsubAuth();
    };
  }, []);

  const addNotification = useCallback(({ type = 'info', title, message, link }) => {
    const item = {
      id: genId(),
      type,
      title: title || (type === 'error' ? 'Error' : type === 'success' ? 'Success' : type === 'warning' ? 'Warning' : 'Info'),
      message: message || '',
      read: false,
      timestamp: new Date(),
      link,
    };
    setNotifications((prev) => {
      const next = [item, ...prev].slice(0, 50);
      saveStored(next);
      return next;
    });
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      saveStored(next);
      return next;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      saveStored(next);
      return next;
    });
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => {
      const next = prev.filter((n) => n.id !== id);
      saveStored(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    saveStored([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
