"use client";

import LogoIcon from "@/assets/logo.svg";
import MenuIcon from "@/assets/icon-menu.svg";
import { Button } from "@/components/Button";
import { motion } from "framer-motion";

export const Header = () => {
  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="py-4 border-b border-white/15 md:border-none sticky top-0 z-40 bg-black/80 backdrop-blur-md"
    >
      <div className="container">
        <div className="flex justify-between items-center md:border border-white/15 md:p-2.5 rounded-xl max-w-2xl mx-auto relative">
          <div className="absolute inset-0 backdrop-blur -z-10 hidden md:block"></div>
          <div>
            <a href="/" className="cursor-pointer">
              <div className="border h-10 w-10 rounded-lg inline-flex justify-center items-center border-white/15 hover:border-white/30 transition-colors">
                <LogoIcon className="h-8 w-8" />
              </div>
            </a>
          </div>
          <div className="flex gap-4 items-center">
            <a href="/quiz" className="hidden md:block text-white/70 hover:text-white transition-colors text-sm">
              Quiz
            </a>
            <a href="/inventory"><Button>Explore Models</Button></a>
            <MenuIcon className="md:hidden" />
          </div>
        </div>
      </div>
    </motion.header>
  );
};
