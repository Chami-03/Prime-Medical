import { useEffect, useState } from 'react'
import { Palette } from 'lucide-react'

export default function ColorChanger() {
    const [hue, setHue] = useState(() => {
        const saved = localStorage.getItem('theme-hue')
        return saved ? parseInt(saved, 10) : 238
    })

    useEffect(() => {
        const updateTheme = () => {
            const isDark = document.documentElement.classList.contains('dark')
            const lightness = isDark ? '65%' : '59%'
            document.documentElement.style.setProperty('--primary', `${hue} 77% ${lightness}`)
            document.documentElement.style.setProperty('--ring', `${hue} 77% ${lightness}`)
            localStorage.setItem('theme-hue', hue.toString())
        }

        updateTheme()

        const observer = new MutationObserver(updateTheme)
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

        return () => observer.disconnect()
    }, [hue])

    return (
        <div className="flex items-center gap-3 bg-card/80 backdrop-blur-md p-3 rounded-full border border-border shadow-luminous transition-all hover:scale-105 z-50 group">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center group-hover:rotate-12 transition-transform">
                <Palette size={18} className="text-primary animate-pulse-subtle" />
            </div>
            <div className="relative flex flex-col justify-center w-24 sm:w-32">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1 leading-none">Theme Color</label>
                <input
                    type="range"
                    min="0" max="360"
                    value={hue}
                    onChange={(e) => setHue(parseInt(e.target.value))}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
                    style={{
                        background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)'
                    }}
                />
            </div>
        </div>
    )
}
