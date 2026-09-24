import * as React from "react"

import { cn } from "@/lib/utils"
import { Eye, EyeOff, Search } from "lucide-react"

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    fullWidth?: boolean
    suffix?: React.ReactNode
    prefixIcon?: React.ReactNode
    wrapperClassName?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    (
        {
            className,
            wrapperClassName,
            type,
            fullWidth,
            suffix,
            prefixIcon,
            ...props
        },
        ref,
    ) => {
        const [hide, setHide] = React.useState<boolean>(true)
        const inputRef = React.useRef<HTMLInputElement | null>(null)

        // `forwardRef` bilan ishlashni ta'minlash
        React.useEffect(() => {
            if (typeof ref === "function") ref(inputRef.current)
            else if (ref) ref.current = inputRef.current
        }, [ref])

        // Picker ochish uchun event handler
        const handleIconClick = () => {
            if (inputRef.current && (type === "time" || type === "date")) {
                inputRef.current.showPicker?.()
                inputRef.current.focus()
            }
        }

        return (
            <div
                className={cn(
                    `${fullWidth ? "w-full" : "w-full sm:w-max"} ${
                        props.hidden ? "h-0" : "h-10"
                    } relative`,
                    wrapperClassName,
                )}
            >
                {type === "search" && (
                    <Search
                        width={18}
                        className="absolute left-1 top-1/2 -translate-y-1/2 text-muted-foreground p-1 box-content cursor-pointer backdrop-blur z-1"
                    />
                )}
                {!!prefixIcon && (
                    <span
                        className="absolute left-1 top-1/2 -translate-y-1/2 text-muted-foreground p-1 box-content cursor-pointer backdrop-blur z-1"
                        onClick={handleIconClick}
                    >
                        {prefixIcon}
                    </span>
                )}
                <input
                    ref={inputRef}
                    type={
                        type === "password" ?
                            hide ?
                                "password"
                            :   "text"
                        :   type
                    }
                    className={cn(
                        "flex h-10 w-full no-time-icon rounded-md border bg-background border-input px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                        className,
                        (type === "search" || !!prefixIcon) && "pl-9",
                        (type === "password" || !!suffix) && "pr-8",
                    )}
                    {...props}
                    hidden={props.hidden}
                />
                {type === "password" && (
                    <button
                        type="button"
                        aria-label={hide ? "Parolni ko'rsatish" : "Parolni yashirish"}
                        onClick={() => setHide(!hide)}
                        className="absolute right-1 top-1 text-muted-foreground p-1 box-content cursor-pointer backdrop-blur z-2"
                    >
                        {hide ? <Eye width={18} /> : <EyeOff width={18} />}
                    </button>
                )}
                {!!suffix && (
                    <span
                        className={`absolute right-1 top-1 text-muted-foreground p-1 box-content cursor-pointer backdrop-blur z-1 ${props.disabled && "pointer-events-none cursor-not-allowed opacity-50"}`}
                    >
                        {suffix}
                    </span>
                )}
            </div>
        )
    },
)
Input.displayName = "Input"

export { Input }
