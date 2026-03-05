import React from 'react';
import { Pill, Droplets, Activity, Clipboard, FlaskConical, Stethoscope, Thermometer, ShieldCheck } from 'lucide-react';

const colorPalettes = [
    { name: 'Indigo', bg: 'rgba(129,140,248,0.12)', border: 'rgba(129,140,248,0.25)', stroke: '#818cf8' },
    { name: 'Emerald', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.25)', stroke: '#34d399' },
    { name: 'Pink', bg: 'rgba(244,114,182,0.12)', border: 'rgba(244,114,182,0.25)', stroke: '#f472b6' },
    { name: 'Amber', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.25)', stroke: '#fbbf24' },
];

const MedIcon = ({ id, size = 24, strokeWidth = 2.5 }) => {
    const palette = colorPalettes[id % colorPalettes.length];
    const icons = [Pill, Droplets, Activity, Clipboard, FlaskConical, Stethoscope, Thermometer, ShieldCheck];
    const Icon = icons[id % icons.length];

    return (
        <div
            style={{
                backgroundColor: palette.bg,
                border: `1.5px solid ${palette.border}`,
                color: palette.stroke
            }}
            className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-inner backdrop-blur-md transition-all hover:scale-110 hover:rotate-3"
        >
            <Icon size={size} strokeWidth={strokeWidth} />
        </div>
    );
};

export default function MedicationIconsDemo() {
    return (
        <div className="p-12 space-y-12 min-h-screen bg-background">
            <div className="space-y-4">
                <h1 className="text-4xl font-black text-foreground tracking-tight">Medication Icons System</h1>
                <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
                    A professional iconography system for medical applications, combining Luicde icons with a soft, persistent color palette.
                </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                {[0, 1, 2, 3, 4, 5, 6, 7].map(id => (
                    <div key={id} className="bg-card p-8 rounded-[2.5rem] border border-border shadow-2xl flex flex-col items-center gap-6 group hover:border-primary/50 transition-all">
                        <MedIcon id={id} size={32} />
                        <div className="text-center">
                            <p className="font-black text-sm uppercase tracking-widest text-foreground">Icon Variation {id + 1}</p>
                            <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-tighter">ID: #{id}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-primary/5 border border-primary/20 p-8 rounded-[2rem] space-y-4">
                <h3 className="font-black text-primary uppercase tracking-[0.2em] text-xs">Usage in Inventory</h3>
                <code className="block bg-card/50 p-6 rounded-xl border border-border font-mono text-sm overflow-x-auto text-foreground">
                    {`<MedIcon id={item.id} />`}
                </code>
            </div>
        </div>
    );
}
