 import { useState, useRef, useEffect } from 'react';
 import { cn } from '@/lib/utils';
 
 interface LazyImageProps {
   src: string;
   alt: string;
   className?: string;
   placeholderClassName?: string;
   width?: number;
   height?: number;
 }
 
 export const LazyImage = ({ 
   src, 
   alt, 
   className, 
   placeholderClassName,
   width,
   height 
 }: LazyImageProps) => {
   const [isLoaded, setIsLoaded] = useState(false);
   const [isInView, setIsInView] = useState(false);
   const imgRef = useRef<HTMLImageElement>(null);
 
   useEffect(() => {
     const observer = new IntersectionObserver(
       ([entry]) => {
         if (entry.isIntersecting) {
           setIsInView(true);
           observer.disconnect();
         }
       },
       {
         rootMargin: '100px',
         threshold: 0.01,
       }
     );
 
     if (imgRef.current) {
       observer.observe(imgRef.current);
     }
 
     return () => observer.disconnect();
   }, []);
 
   return (
     <div 
       ref={imgRef}
       className={cn(
         'relative overflow-hidden bg-muted',
         placeholderClassName
       )}
       style={{ width, height }}
     >
       {isInView && (
         <img
           src={src}
           alt={alt}
           className={cn(
             'transition-opacity duration-300',
             isLoaded ? 'opacity-100' : 'opacity-0',
             className
           )}
           onLoad={() => setIsLoaded(true)}
           loading="lazy"
           decoding="async"
         />
       )}
       {!isLoaded && (
         <div className="absolute inset-0 bg-muted animate-pulse" />
       )}
     </div>
   );
 };