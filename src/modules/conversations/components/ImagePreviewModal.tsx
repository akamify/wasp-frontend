import { motion } from "framer-motion";
import { X } from "lucide-react";

type Props = {
  image: string | null;
  onClose: () => void;
};

export function ImagePreviewModal({ image, onClose }: Props) {
  if (!image) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-8" onClick={onClose}>
      <button className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-[5px] transition-all">
        <X size={24} />
      </button>
      <motion.img
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        src={image}
        className="max-w-full max-h-full rounded-[8px] shadow-2xl border border-white/10"
        alt=""
      />
    </div>
  );
}

