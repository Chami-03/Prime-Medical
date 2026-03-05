import { useState } from 'react'
import { AlertTriangle, Clock, User, Activity } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'

export default function CheckInModal({ isOpen, onClose, onConfirm, patient, appointment, isPending }) {
    const [priority, setPriority] = useState('NORMAL')

    if (!patient) return null

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Patient Check-In Protocol"
        >
            <div className="space-y-10 p-4">
                {/* Patient Context Card */}
                <div className="bg-muted/30 rounded-[2rem] border border-border/50 p-8 flex items-center gap-6 group transition-all hover:bg-muted/50">
                    <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl font-black shadow-xl group-hover:rotate-6 transition-transform">
                        {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
                    </div>
                    <div>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mb-1">Authenticated Identity</p>
                        <h4 className="text-xl font-black text-foreground uppercase tracking-tight leading-none">
                            {patient.firstName} {patient.lastName}
                        </h4>
                        <p className="text-[10px] font-mono text-primary mt-1.5 opacity-60">ID: {patient.patientNumber}</p>
                    </div>
                </div>

                {appointment && (
                    <div className="flex items-center gap-4 px-6 py-4 bg-primary/5 border border-primary/20 rounded-2xl">
                        <Clock size={16} className="text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                            Scheduled Appointment: {appointment.slotTime || appointment.appointmentTime?.split('T')[1]?.substring(0, 5)}
                        </span>
                    </div>
                )}

                {/* Priority Selection */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-2">Clinical Priority Level</label>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { id: 'NORMAL', label: 'Normal', desc: 'Standard clinical flow', icon: Activity, color: 'primary' },
                            { id: 'EMERGENCY', label: 'Emergency', desc: 'Immediate attention', icon: AlertTriangle, color: 'destructive' }
                        ].map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setPriority(p.id)}
                                className={`p-6 rounded-[2rem] border-2 transition-all text-left group/btn relative overflow-hidden ${priority === p.id
                                        ? `bg-${p.color}/5 border-${p.color}/40 shadow-xl`
                                        : 'bg-card border-border hover:border-primary/20'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center transition-all ${priority === p.id ? `bg-${p.color} text-white` : 'bg-muted text-muted-foreground'
                                    }`}>
                                    <p.icon size={20} />
                                </div>
                                <p className={`font-black uppercase tracking-tight text-sm ${priority === p.id ? `text-${p.color}` : 'text-foreground'}`}>
                                    {p.label}
                                </p>
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mt-1">{p.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Info Note */}
                <div className="p-6 bg-foreground rounded-[2rem] text-background relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />
                    <div className="relative z-10 flex items-start gap-4">
                        <div className="mt-1 text-primary">ℹ️</div>
                        <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed opacity-60">
                            Check-in will finalize the entry in today's clinical queue and notify the respective practitioner of patient arrival.
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-4">
                    <button
                        className="flex-1 h-16 rounded-[1.25rem] bg-muted text-muted-foreground font-black text-[11px] uppercase tracking-[0.2em] hover:bg-border transition-all active:scale-95 border-2 border-transparent"
                        onClick={onClose}
                    >
                        Abort Protocol
                    </button>
                    <Button
                        className="flex-[2] h-16 rounded-[1.25rem] shadow-2xl shadow-primary/30 font-black uppercase tracking-widest text-[11px] active:scale-95"
                        onClick={() => onConfirm(priority)}
                        loading={isPending}
                    >
                        Confirm Arrival & Check-In
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
