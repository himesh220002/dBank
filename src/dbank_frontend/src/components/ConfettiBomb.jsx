import React, { useEffect, useState } from 'react';

export function ConfettiBomb() {
    const [particles, setParticles] = useState([]);

    useEffect(() => {
        const colors = ['#f59e0b', '#fbbf24', '#6366f1', '#10b981', '#ef4444', '#ffffff'];
        const newParticles = Array.from({ length: 150 }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 8 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            delay: Math.random() * 2,
            duration: Math.random() * 3 + 2,
            angle: Math.random() * 360,
            velocity: Math.random() * 20 + 10
        }));
        setParticles(newParticles);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
            {particles.map(p => (
                <div
                    key={p.id}
                    className="absolute rounded-sm animate-confetti"
                    style={{
                        left: `${p.x}%`,
                        top: `-10px`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        backgroundColor: p.color,
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${p.duration}s`,
                        transform: `rotate(${p.angle}deg)`
                    }}
                />
            ))}
            <style>{`
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti {
          animation-name: confetti;
          animation-timing-function: ease-out;
          animation-fill-mode: forwards;
        }
        @keyframes gradient-x {
           0% { background-position: 0% 50%; }
           50% { background-position: 100% 50%; }
           100% { background-position: 0% 50%; }
        }
        .animate-gradient-x {
           background-size: 200% 200%;
           animation: gradient-x 3s ease infinite;
        }
      `}</style>
        </div>
    );
}
