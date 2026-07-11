import { cn } from "@/lib/utils"
import React, { useEffect, useState } from "react"

const Timer = React.memo(function ({ data }: { data: OrderDispatchData }) {
    const [timeRemaining, setTimeRemaining] = useState(0)
    const user_id = localStorage.getItem("user_id")

    useEffect(() => {
        if (
            data.dispatcher?.id &&
            ((data.dispatcher?.id || "") == user_id) === true &&
            data.updated_at
        ) {
            const start: Date = new Date(data.updated_at)
            const end: Date = new Date()
            const diffInMilliseconds = +end - +start
            const diffInSeconds = 20 * 60 - diffInMilliseconds / 1000

            setTimeRemaining(diffInSeconds)

            const intervalId = setInterval(() => {
                setTimeRemaining((prevTime) => {
                    if (prevTime > 0) {
                        return prevTime - 1
                    } else {
                        return 0
                    }
                })
            }, 1000)

            return () => clearInterval(intervalId)
        }
    }, [data, user_id])

    const minutes = Math.floor(timeRemaining / 60)
    const seconds = Math.floor(timeRemaining % 60)

    if (
        !data.dispatcher?.id ||
        ((data.dispatcher?.id || "") == user_id) !== true
    ) {
        return null
    }

    if (minutes === 0 && seconds === 1) {
        return <span>00:00</span>
    }

    return (
        <span
            className={cn(
                minutes <= 10 ? "text-destructive" : "text-destructive",
            )}
        >
            {minutes}:{seconds > 9 ? seconds : `0${seconds}`}
        </span>
    )
})

export default Timer
