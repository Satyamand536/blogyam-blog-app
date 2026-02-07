import { useState, useEffect } from 'react';
import { ImageOff, Loader2 } from 'lucide-react';

/**
 * OptimizedImage Component
 * 
 * A production-grade image wrapper that ensures:
 * 1. Zero Layout Shift (CLS) via aspect-ratio or fixed dimensions
 * 2. Visual Skeleton Loading state
 * 3. Graceful Error Handling with fallback UI
 * 4. Smooth Opacity Transition (Fade-in)
 * 5. Smart Priority Loading (eager vs lazy)
 * 
 * @param {string} src - Image source URL
 * @param {string} alt - Alt text for accessibility
 * @param {string} className - Classes for the image element
 * @param {string} containerClassName - Classes for the wrapper container
 * @param {boolean} priority - If true, loads eagerly (LCP candidates)
 * @param {string} fallbackSrc - Optional specific fallback image URL
 * @param {Function} onLoad - Optional callback when image loads
 * @param {Function} onError - Optional callback when image fails
 */
export default function OptimizedImage({
    src,
    alt,
    className = '',
    containerClassName = '',
    priority = false,
    fallbackSrc = '',
    onLoad,
    onError,
    ...props
}) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [currentSrc, setCurrentSrc] = useState(src);

    // Reset state when src changes
    useEffect(() => {
        setIsLoading(true);
        setHasError(false);
        setCurrentSrc(src);
    }, [src]);

    const handleLoad = (e) => {
        setIsLoading(false);
        if (onLoad) onLoad(e);
    };

    const handleError = (e) => {
        console.warn(`Image failed to load: ${src}`);
        setIsLoading(false);
        setHasError(true);
        
        if (fallbackSrc) {
            setCurrentSrc(fallbackSrc);
        } else if (onError) {
            onError(e);
        }
    };

    return (
        <div className={`relative overflow-hidden bg-slate-100 dark:bg-slate-800 ${containerClassName}`}>
            {/* Skeleton Loader - Visible while loading */}
            {isLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-200 dark:bg-slate-700 animate-pulse">
                    <Loader2 className="w-6 h-6 text-slate-400 animate-spin opacity-50" />
                </div>
            )}

            {/* Error State - Visible if load fails */}
            {hasError && !fallbackSrc && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400">
                    <ImageOff className="w-8 h-8 mb-1" />
                    <span className="text-xs font-medium">Image unavailable</span>
                </div>
            )}

            {/* Actual Image */}
            <img
                src={currentSrc}
                alt={alt}
                loading={priority ? "eager" : "lazy"}
                fetchPriority={priority ? "high" : "auto"}
                onLoad={handleLoad}
                onError={handleError}
                className={`
                    block w-full h-full object-cover transition-opacity duration-700 ease-in-out
                    ${isLoading ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}
                    ${hasError && !fallbackSrc ? 'hidden' : ''}
                    ${className}
                `}
                {...props}
            />
        </div>
    );
}
