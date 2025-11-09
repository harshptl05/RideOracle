"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const vehicles = [
  { name: "2025 Toyota Camry", img: "/CarImages/camry.png" },
  { name: "2025 Toyota RAV4", img: "/CarImages/rav4.png" },
  { name: "2025 Toyota Tacoma", img: "/CarImages/tacoma.png.png" },
  { name: "2025 Toyota Prius", img: "/CarImages/prius.png" },
  { name: "2025 Toyota Highlander", img: "/CarImages/highlander.png" },
  { name: "2025 Toyota Corolla", img: "/CarImages/corolla.png" },
];

export const RotatingShowcase = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % vehicles.length);
    }, 3000); // 3 seconds per vehicle

    return () => clearInterval(interval);
  }, [isPaused]);

  const currentVehicle = vehicles[currentIndex];

  return (
    <div className="relative w-full h-full min-h-[400px] md:min-h-[500px] flex items-center justify-center rounded-2xl overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }}
          transition={{
            duration: 1,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="absolute inset-0 flex flex-col items-center justify-center p-8 md:p-12"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Glassmorphism Card */}
          <motion.div 
            className="relative w-full max-w-4xl backdrop-blur-md bg-white/5 rounded-2xl border border-white/10 shadow-lg p-6 md:p-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Vehicle Image */}
            <div className="relative w-full h-[250px] md:h-[400px] mb-6 md:mb-8 flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full h-full"
              >
                <Image
                  src={currentVehicle.img}
                  alt={currentVehicle.name}
                  fill
                  className="object-contain"
                  priority={currentIndex === 0}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                />
              </motion.div>
            </div>

            {/* Vehicle Name */}
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-2xl md:text-4xl font-bold text-white text-center"
            >
              {currentVehicle.name}
            </motion.h3>
          </motion.div>

          {/* Indicator Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {vehicles.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentIndex
                    ? "w-8 h-2 bg-white"
                    : "w-2 h-2 bg-white/40 hover:bg-white/60"
                }`}
                aria-label={`Go to ${vehicles[index].name}`}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

