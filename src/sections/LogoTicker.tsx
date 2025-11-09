'use client';
/*import acmeLogo from "@/assets/logo-acme.png";*/

import car from '@/assets/car.png';
import { motion } from "framer-motion";

export const LogoTicker = () => {
  return (
  <section className="py-20 md:py-24 bg-black">
    <div className="container">
      <div className="flex items-center gap-5">
        <motion.div 
          className="flex-1 md:flex-none"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h2 className="text-white">Empowering the World's Most Dedicated Drivers</h2>
        </motion.div>
        <motion.div 
          className="flex flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]"
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
        >
          <motion.div
            initial={{translateX:"-50%"}}
            animate={{translateX:"0"}}
            transition={{
              repeat: Infinity,
              duration: 30,
              ease: "linear",
            }}
          className="flex flex-none gap-14 pr-14 -translate-x-1/2">
          {[
            /*acmeLogo,*/
            car,
            car,
            car,
            car,
            car,
            /*acmeLogo,*/
            car,
            car,
            car,
            car,
            car,
          ].map((logo) => (
            <img src={logo.src} key={logo.src} className="h-6 w-auto" />
          ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  </section>
  );
};