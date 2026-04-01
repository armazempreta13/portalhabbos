'use client';

import { motion } from 'motion/react';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.99, filter: 'blur(5px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 1.01, filter: 'blur(5px)' }}
      transition={{ ease: "easeOut", duration: 0.4 }}
      className="flex-1 w-full flex flex-col"
    >
      {children}
    </motion.div>
  );
}
