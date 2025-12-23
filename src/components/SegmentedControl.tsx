interface Option<T extends string> {
    label: string
    value: T
}

interface SegmentedControlProps<T extends string> {
    options: Option<T>[]
    value: T
    onChange: (value: T) => void
}

/**
 *
 */
export function SegmentedControl<T extends string>({
    options,
    value,
    onChange,
}: SegmentedControlProps<T>) {
    return (
        <div className="flex gap-2">
            {options.map((opt) => (
                <button
                    key={opt.value}
                    onClick={() => onChange(opt.value)}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                        value === opt.value
                            ? 'border-neon/60 bg-neon/10 text-neon'
                            : 'border-white/10 hover:border-white/20 text-space-fg'
                    }`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    )
}
