import React from 'react';
import { motion } from 'framer-motion';

export const CardComponent = ({ 
  children, 
  className = '', 
  hover = true, 
  ...props 
}) => {
  return (
    <motion.div 
      whileHover={hover ? { scale: 1.05 } : false}
      transition={{ type: "spring", stiffness: 300 }}
      className={`
        bg-white 
        rounded-xl 
        shadow-lg 
        border 
        border-gray-300 
        overflow-hidden 
        hover:shadow-2xl 
        transition-all 
        duration-300 
        ease-in-out
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const Button = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}) => {
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-500 text-white hover:bg-gray-600 focus:ring-gray-400',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-400',
    success: 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-400',
    outline: 'border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white focus:ring-blue-400',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      className={`
        px-5 
        py-3 
        text-sm 
        font-medium 
        rounded-lg 
        shadow-md 
        transition-all 
        duration-300 
        ease-in-out 
        focus:outline-none 
        focus:ring-2 
        focus:ring-offset-2 
        ${variantStyles[variant]} 
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export const CardContent = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`px-6 pt-4 pb-2 border-b border-gray-300 font-semibold text-lg text-gray-800 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
