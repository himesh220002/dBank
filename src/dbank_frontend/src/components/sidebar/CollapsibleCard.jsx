import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const CollapsibleCard = ({ title, children, defaultOpen = false, icon: Icon, className = "" }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className={`bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm transition-all duration-300 ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-2">
                    {Icon && <Icon size={16} className="text-amber-400" />}
                    <span className="font-medium text-sm text-slate-200">{title}</span>
                </div>
                {isOpen ? (
                    <ChevronDown size={14} className="text-slate-400" />
                ) : (
                    <ChevronRight size={14} className="text-slate-400" />
                )}
            </button>

            {isOpen && (
                <div className="p-3 border-t border-white/5 animate-in slide-in-from-top-2 duration-200">
                    {children}
                </div>
            )}
        </div>
    );
};

export default CollapsibleCard;
