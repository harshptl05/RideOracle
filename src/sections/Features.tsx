"use client";
import { DotLottieCommonPlayer, DotLottiePlayer } from "@dotlottie/react-player";
import { ComponentPropsWithoutRef, useEffect, useRef, useState } from "react";
import { animate, motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { RotatingShowcase } from "@/components/RotatingShowcase";

const tabs = [
  {
    icon: "/assets/lottie/vroom.lottie",
    title: "User-friendly dashboard",
    isNew: false,
    backgroundPositionX: 0,
    backgroundPositionY: 0,
    backgroundSizeX: 150,
  },
  {
    icon: "/assets/lottie/click.lottie",
    title: "One-click optimization",
    isNew: false,
    backgroundPositionX: 98,
    backgroundPositionY: 100,
    backgroundSizeX: 135,
  },
  {
    icon: "/assets/lottie/stars.lottie",
    title: "AI Powered Quiz",
    isNew: true,
    backgroundPositionX: 100,
    backgroundPositionY: 27,
    backgroundSizeX: 177,
  },
];

const FeatureTab = (props: typeof tabs[number] & ComponentPropsWithoutRef<'div'> & { selected: boolean }) => {
  const tabRef = useRef<HTMLDivElement>(null);
  const dotLottieRef = useRef<DotLottieCommonPlayer>(null);

  const xPercentage = useMotionValue(0);
  const yPercentage = useMotionValue(0);
  const rotationAngle = useMotionValue(0);

  const maskImage= useMotionTemplate`radial-gradient(80px 80px at ${xPercentage}% ${yPercentage}%, black, transparent)`;

  // Revolving color animation - always active
  useEffect(() => {
    if (!tabRef.current) return;
    xPercentage.set(0);
    yPercentage.set(0);
    const { height, width } = tabRef.current?.getBoundingClientRect();
    const circumference = height * 2 + width * 2;

    const times = [0, width / circumference, (width + height) / circumference, (width * 2 + height) / circumference, 1]
    const options: ValueAnimationTransition ={
      times,
      duration: 4,
      repeat: Infinity,
      ease: 'linear',
      repeatType: 'loop',
    }

    animate(xPercentage, [0,100,100,0,0], options);
    animate(yPercentage, [0,0,100,100,0], options);
    
    // Rotating gradient animation
    animate(rotationAngle, [0, 360], {
      duration: 3,
      repeat: Infinity,
      ease: 'linear',
    });
      
  },[]);

  const handleTabHover = () => {
    if(dotLottieRef.current === null) return;
    dotLottieRef.current.seek(0);
    dotLottieRef.current.play();
  };
  const gradientRotation = useMotionTemplate`${rotationAngle}deg`;
  
  return (
    <div 
      ref={tabRef} 
      onMouseEnter={handleTabHover} 
      className="border border-white/15 flex p-2.5 rounded-xl gap-2.5 items-center lg:flex-1 relative overflow-hidden" 
      onClick={props.onClick}
    >
      {/* Revolving red border - always visible, travels around perimeter */}
      <motion.div 
        style={{
          maskImage,
        }}
        className="absolute inset-0 -m-px rounded-xl pointer-events-none"
      >
        <motion.div 
          style={{
            rotate: gradientRotation,
          }}
          className="absolute inset-0 rounded-xl"
        >
          <div 
            className="absolute inset-0 rounded-xl"
            style={{
              background: `conic-gradient(from 0deg, #FFFFFF, #E5E5E5, #CCCCCC, #FFFFFF)`,
            }}
          />
        </motion.div>
      </motion.div>
      
      {/* Inner background to hide gradient except border */}
      <div className="absolute inset-[2px] bg-black rounded-lg z-0"></div>
      
      {/* Selected state border */}
      {props.selected && (
        <motion.div 
          style={{
            maskImage,
          }}
          className="absolute inset-0 -m-px border-2 border-white/50 rounded-xl z-20 pointer-events-none"
        ></motion.div>
      )}
            
      <div className="h-12 w-12 border border-white/15 rounded-lg inline-flex items-center justify-center relative z-10">
        <DotLottiePlayer
          ref={dotLottieRef}
          src={props.icon}
          className="h-5 w-5"
          autoplay />
      </div>
      <div className="font-medium relative z-10 text-white">{props.title}</div>
      {props.isNew && <div className="text-xs rounded-full px-2 py-0. bg-white text-black font-semibold relative z-10">new</div>}
    </div>
  )
}

export const Features = () => {
  const [selectTab, setSelectedTab] = useState(0);

  const handleSelectTab = (index:number) => {
    setSelectedTab(index);
  };

  return (
  <section id="features" className="py-20 md:py-24 bg-black">
    <div className="container">
      <motion.h2 
        className="text-5xl md:text-6xl font-medium text-center tracking-tighter text-white"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        Level up your ride
      </motion.h2>
      <motion.p 
        className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto tracking-tight text-center mt-5"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
      >
      From dreamers to drivers, our AI-powered tool is revolutionizing how you find your perfect ride.
      </motion.p>
      <motion.div 
        className= "mt-10 flex flex-col lg:flex-row gap-3"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
      >
        {tabs.map((tab, tabIndex) => (
          <FeatureTab 
            {...tab} 
            selected={selectTab === tabIndex}
            onClick={() => handleSelectTab(tabIndex)}
            key={tab.title} />
        ))}
      </motion.div>
      <motion.div 
        className="mt-3"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
      >
        <RotatingShowcase />
      </motion.div>
    </div>
  </section>
  );
};