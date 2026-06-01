'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type CarouselContextType = {
    current: number;
    setCurrent: React.Dispatch<React.SetStateAction<number>>;
    count: number;
    registerItems: (length: number) => void;
};

const CarouselContext = React.createContext<CarouselContextType | null>(null);

function useCarousel() {
    const ctx = React.useContext(CarouselContext);
    if (!ctx) throw new Error('Carousel components must be used inside <Carousel>');
    return ctx;
}

function Carousel({
    children,
    autoPlay = true,
    interval = 5000,
    moveLeft = true,
    moveRight = true,
    indicator = true,
}: {
    children: React.ReactNode;
    autoPlay?: boolean;
    interval?: number;
    moveLeft?: boolean;
    moveRight?: boolean;
    indicator?: boolean;
}) {
    const [current, setCurrent] = React.useState(0);
    const [count, setCount] = React.useState(0);

    const registerItems = React.useCallback((length: number) => {
        setCount(length);
    }, []);

    React.useEffect(() => {
        if (!autoPlay || count <= 1) return;
        const id = setInterval(() => {
            setCurrent((c) => (c + 1) % count);
        }, interval);
        return () => clearInterval(id);
    }, [autoPlay, interval, count]);

    return (
        <CarouselContext.Provider
            value={{ current, setCurrent, count, registerItems }}
        >
            <div className='w-full flex flex-row gap-2 items-center'>
                {
                    moveLeft
                        ?
                        <CarouselPrevious />
                        :
                        null
                }
                <div
                    data-slot="carousel"
                    className={cn(
                        'w-lg relative overflow-hidden'
                    )}
                >
                    {children}
                </div>
                {
                    moveRight
                        ?
                        <CarouselNext />
                        :
                        null
                }
            </div>
            {
                indicator
                    ?
                    <CarouselIndicators />
                    :
                    null
            }
        </CarouselContext.Provider>
    );
}

function CarouselContent({ children }: { children: React.ReactNode | React.ReactNode[] }) {
    const { current, setCurrent, registerItems, count } = useCarousel();

    const startX = React.useRef<number | null>(null);
    const endX = React.useRef<number | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        startX.current = e.touches[0].clientX;
        endX.current = null;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        endX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (startX.current === null || endX.current === null) return;
        const delta = startX.current - endX.current;

        if (Math.abs(delta) > 50) {
            if (delta > 0) {
                setCurrent((c) => (c + 1) % count);
            } else {
                setCurrent((c) => (c - 1 + count) % count);
            }
        }

        startX.current = null;
        endX.current = null;
    };

    React.useEffect(() => {
        registerItems(React.Children.count(children));
    }, [children, registerItems]);

    return (
        <div
            data-slot="carousel-content"
            className={cn(
                'flex transition-transform duration-500 ease-in-out select-none'
            )}
            style={{ transform: `translateX(-${current * 100}%)` }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {React.Children.map(children, (child, i) => (
                <div key={i} className="w-full flex-shrink-0">
                    {child}
                </div>
            ))}
        </div>
    );
}


function CarouselItem({ children, index }: { children: React.ReactNode, index?: number }) {
    const { current } = useCarousel();
    return (
        <div
            data-slot="carousel-item"
            className={cn(
                "w-full h-full flex items-center justify-center transition-all duration-700",
                index ? (current === index ? "scale-100 opacity-100" : "scale-0 opacity-0 ") : ''
            )}
        >
            {children}
        </div>
    );
}

function CarouselPrevious({ className }: { className?: string }) {
    const { setCurrent, count } = useCarousel();
    return (
        <button
            onClick={() => setCurrent((c) => (c - 1 + count) % count)}
            className={cn(
                'rounded-full bg-background p-2 transition-all ease-out hover:bg-foreground/15',
                className,
            )}
            data-slot="carousel-previous"
        >
            <ChevronLeft className="size-5" />
        </button>
    );
}

function CarouselNext({ className }: { className?: string }) {
    const { setCurrent, count } = useCarousel();
    return (
        <button
            onClick={() => setCurrent((c) => (c + 1) % count)}
            className={cn(
                'rounded-full bg-background p-2 transition-all ease-out hover:bg-foreground/15',
                className,
            )}
            data-slot="carousel-next"
        >
            <ChevronRight className="size-5" />
        </button>
    );
}

function CarouselIndicators({ className }: { className?: string }) {
    const { current, setCurrent, count } = useCarousel();
    return (
        <div
            className={cn(
                'flex justify-center gap-2 mt-3',
                className,
            )}
            data-slot="carousel-indicators"
        >
            {Array.from({ length: count }).map((_, i) => (
                <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={cn(
                        'size-2 rounded-full transition-all',
                        current === i ? 'bg-primary w-4' : 'bg-transparent border-1 border-foreground',
                    )}
                />
            ))}
        </div>
    );
}

export {
    Carousel,
    CarouselContent,
    CarouselItem
};
