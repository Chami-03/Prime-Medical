export default function Skeleton({ className = '', variant = 'rect' }) {
    const variants = {
        circular: 'rounded-full',
        rect: 'rounded-lg',
        text: 'rounded h-4 w-full',
    }

    return (
        <div
            className={`
                bg-muted/40 animate-pulse transition-colors duration-1000
                ${variants[variant] || variants.rect}
                ${className}
            `}
        />
    )
}
