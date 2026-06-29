"use client";

import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

/** 하단 바텀시트 — 입력방식 선택·장보기 리스트 등에 공용. */
export function Sheet({ open, onClose, children, title }: SheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-cocoa/30"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-mochi bg-cream-50 p-5 pb-8 shadow-mochi"
          >
            {title && <h3 className="mb-4 text-center font-bold text-cocoa">{title}</h3>}
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
