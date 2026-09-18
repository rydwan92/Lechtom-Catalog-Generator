import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { clsx } from 'clsx'

const buttonStyle = cva('btn', { variants: { variant: { primary: 'btn-primary', secondary: 'btn-secondary', ghost: 'btn-ghost', danger: 'btn-danger' }, size: { normal: 'btn-normal', small: 'btn-small' } }, defaultVariants: { variant: 'primary', size: 'normal' } })
export function Button({ asChild, variant, size, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonStyle> & { asChild?: boolean }) { const Component = asChild ? Slot : 'button'; return <Component className={clsx(buttonStyle({ variant, size }), className)} {...props} /> }
export function Input(props: InputHTMLAttributes<HTMLInputElement>) { return <input {...props} className={clsx('input', props.className)} /> }
export function Card({ children, className }: { children: ReactNode; className?: string }) { return <div className={clsx('card', className)}>{children}</div> }
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) { return <label className="field"><span className="field-label">{label}</span>{children}{hint && <span className="field-hint">{hint}</span>}</label> }
export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action?: ReactNode }) { return <div className="empty-state"><div className="empty-icon">{icon}</div><h3>{title}</h3><p>{description}</p>{action}</div> }
