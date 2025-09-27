import React, { useEffect, useState } from 'react';

const Modal = ({ isOpen, onClose, title, children, size = "default" }) => {
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShowModal(true);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => {
                setShowModal(false);
                document.body.style.overflow = 'unset';
            }, 300);
            return () => {
                clearTimeout(timer);
                document.body.style.overflow = 'unset';
            };
        }
    }, [isOpen]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    if (!showModal) return null;

    // Define size configurations
    const sizeConfigs = {
        default: {
            container: "max-w-lg w-full max-h-[90vh]",
            content: "p-6",
            wrapper: "p-4"
        },
        landscape: {
            container: "w-[96vw] h-[96vh] max-w-none max-h-none",
            content: "p-0",
            wrapper: "p-0"
        },
        large: {
            container: "max-w-4xl w-full max-h-[90vh]",
            content: "p-6",
            wrapper: "p-4"
        },
        xl: {
            container: "max-w-6xl w-full max-h-[90vh]",
            content: "p-6",
            wrapper: "p-4"
        }
    };
    
    const config = sizeConfigs[size] || sizeConfigs.default; // Add fallback

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
            onClick={onClose}
            style={{ zIndex: 9999 }} // Inline style to ensure high z-index
        >
            <div
                className={`bg-white overflow-hidden dark:bg-gray-800 rounded-xl shadow-2xl transform transition-all duration-300 ease-in-out flex flex-col
                    ${config.container} ${config.content}
                    ${isOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Only show header for default size or when title is provided */}
                {(size === 'default' && title) && (
                    <div className="flex justify-between items-center mb-4 border-b border-gray-300 pb-4">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none"
                        >
                            ×
                        </button>
                    </div>
                )}
                
                {/* Content area - flexible for landscape */}
                <div className={`${size === 'landscape' ? 'flex-1 overflow-hidden min-h-0' : 'flex-1'}`}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;