import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme()

    return (
        <button
            onClick={toggleTheme}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-primary transition-all duration-300 group shadow-md hover:shadow-primary/10 active:scale-90 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            {theme === 'light' ? (
                <Moon size={17} strokeWidth={2.4} className="group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500" />
            ) : (
                <Sun size={17} strokeWidth={2.4} className="group-hover:scale-110 group-hover:rotate-90 transition-all duration-500" />
            )}
        </button>
    )
}
