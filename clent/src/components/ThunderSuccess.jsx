// components/ThunderSuccess.jsx
import { motion } from "framer-motion";
import React, { useState, useEffect, useMemo } from "react";

export default function ThunderSuccess({ trigger, count = 1000 }) {
  const [active, setActive] = useState(false);

 const colors = ["#00ffff", "#ff69b4", "#ffa500", "#7fff00", "#ff4500", "#1e90ff", "#ff1493"];
  useEffect(() => {
    if (trigger) {
      setActive(true);
      const timer = setTimeout(() => setActive(false), 5000); 
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  
  const drops = useMemo(() => {
    return [...Array(count)].map(() => ({
      left: Math.random() * 100, 
      delay: Math.random() * 2, 
      duration: 1 + Math.random() * 2,
      width: 2 + Math.random() * 3, 
      height: 2 + Math.random() * 6, 
      color: colors[Math.floor(Math.random() * colors.length)] 
    }));
  }, [count]);

  if (!active) return null;

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden bg-transparent"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {drops.map((drop, i) => (
        <motion.div
          key={i}
          initial={{ y: -20, opacity: 1 }}
          animate={{ y: "100vh", opacity: 0 }}
          transition={{
            delay: drop.delay,
            duration: drop.duration,
            ease: "easeIn"
          }}
          className="absolute bg-cyan-400 rounded-full"
          style={{
            left: `${drop.left}%`,
            width: `${drop.width}px`,
            height: `${drop.height}px`
          }}
        />
      ))}
    </motion.div>
  );
}



