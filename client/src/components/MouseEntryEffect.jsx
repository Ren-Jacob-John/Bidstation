import { useEffect, useState } from 'react';

const MouseEntryEffect = () => {
  const [position, setPosition] = useState({ x: '50%', y: '50%' });
  const [visible, setVisible] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);

  useEffect(() => {
    const handleFirstMove = (event) => {
      if (hasPlayed) return;

      setPosition({ x: event.clientX, y: event.clientY });
      setVisible(true);
      setHasPlayed(true);

      // Fade out the orb after the entrance animation
      const timer = setTimeout(() => {
        setVisible(false);
      }, 900);

      return () => clearTimeout(timer);
    };

    window.addEventListener('mousemove', handleFirstMove, { once: true });

    return () => {
      window.removeEventListener('mousemove', handleFirstMove);
    };
  }, [hasPlayed]);

  if (!visible) return null;

  return (
    <div
      className="cursor-entry-orb"
      style={{ left: position.x, top: position.y }}
    />
  );
};

export default MouseEntryEffect;

