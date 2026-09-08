import { FormInput } from "@/components/form/input"
import { Button } from "@/components/ui/button"
import { LOGIN } from "@/constants/api-endpoints"
import { usePost } from "@/hooks/usePost"
import { setTokens } from "@/services/axios-instance"
import { handleFormError } from "@/lib/show-form-errors"
import { createLazyFileRoute } from "@tanstack/react-router"
import { Truck } from "lucide-react"
import { useForm } from "react-hook-form"

export const Route = createLazyFileRoute("/_auth/auth")({
    component: AuthComponent,
})

type Form = {
    username: string
    password: string
}

function AuthComponent() {
    const { mutate, isPending } = usePost()

    const form = useForm<Form>({
        disabled: isPending,
    })

    const onSubmit = form.handleSubmit((data) => {
        mutate(LOGIN, data, {
            onSuccess(res) {
                // Access token muddati qisqa (15 daqiqa) — refresh tokensiz
                // foydalanuvchi 15 daqiqada tizimdan chiqib ketadi, shuning
                // uchun IKKALASI ham saqlanadi.
                setTokens({ access: res.access, refresh: res.refresh })
                window.location.href = "/"
            },
            onError: (error) => handleFormError(error, form),
        })
    })

    return (
        <div className="min-h-screen flex bg-white">
            {/* Left side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-[url(/volvo-veb.webp)]  bg-cover px-8 pt-8 pb-5 flex-col justify-between relative overflow-hidden bg-center">
                <div className="absolute inset-0 bg-black/50" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
                            <Truck className="w-6 h-6 " />
                        </div>
                        <span className="text-2xl font-bold ">
                            IMB LOGISTIKA
                        </span>
                    </div>
                    <div className="h-[55vh] w-full flex flex-col items-center justify-center">
                        <h2 className="text-4xl font-bold  mb-4 leading-tight">
                            Xush kelibsiz!
                        </h2>
                        <p className="text-lg text-center">
                            Yuk tashish ishlarini oson va tartibli boshqarish
                            endi muammo emas. <br /> IMB Logistika — ishonchli,
                            tezkor va qulay tizim siz uchun.
                        </p>
                    </div>
                </div>

                <div className="relative z-10 text-white/90">
                    Mualliflik huquqi © 2025, IMBTECH MChJ. Barcha huquqlar
                    himoyalangan.
                </div>
            </div>

            {/* Right side - Login form */}
            <div className="flex-1 flex items-center justify-center sm:p-8 p-4">
                <div className="w-full max-w-md">
                    <h1 className="text-3xl font-bold text-center sm:text-start  mb-2 text-zinc-800">
                        Tizimga kirish
                    </h1>
                    <p className="sm:mb-6 mb-2 text-gray-600 sm:text-lg text-sm">
                        Davom etish uchun ma'lumotlaringizni kiriting
                    </p>
                    <form
                        onSubmit={onSubmit}
                        className=" space-y-4 flex flex-col items-center"
                    >
                        <FormInput
                            name="username"
                            label="Login"
                            methods={form}
                            required
                            className="bg-white border border-primary"
                            wrapperClassName={"text-zinc-800"}
                        />

                        <FormInput
                            name="password"
                            label="Parol"
                            type="password"
                            methods={form}
                            required
                            className="bg-white border border-primary"
                            wrapperClassName={"text-zinc-800"}
                        />

                        <Button
                            type="submit"
                            loading={isPending}
                            className="w-full bg-blue-400 hover:bg-blue-500 text-white"
                        >
                            Kirish
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )
}
