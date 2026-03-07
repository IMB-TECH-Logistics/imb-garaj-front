import { formatMoney } from "@/lib/format-money"
import {
    CalendarDays,
    DollarSign,
    FileText,
    Fuel,
    Gauge,
    Phone,
    Truck,
    User,
    Wrench,
} from "lucide-react"

type Props = {
    data: any | undefined
}


function TruckProfile({ data }: Props) {
    return (
        <div
            className="bg-background border border-divider relative rounded-lg p-4 
        grid grid-cols-4 gap-6"
        >
            <div className="flex items-start gap-6 col-span-2">
                {/* Truck rasmi */}
                <div className="border border-divider h-[200px] sm:h-full sm:w-[260px] rounded-lg overflow-hidden">
                    <img
                        alt="Truck"
                        className="w-full h-full object-cover object-center"
                        src={
                            typeof data?.image === "string" ?
                                data.image
                            :   "https://media.wired.com/photos/60f9b8a417ecd990dacf3c75/1:1/w_947,h_947,c_limit/Business-Self-Driving-Trucks-TuSimple.jpg"
                        }
                    />
                </div>

                {/* Truck ma’lumotlari  1*/}

                <div className="flex flex-col gap-2">
                    <div className="font-bold text-2xl mb-2">
                        {data?.truck_number || "01 369 JKA"}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <Truck size={18} />
                        <span className="font-medium">{"Tirkama"}:</span>
                        <span>{data?.trailer_number || "40 3994 BA"}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <User size={18} />
                        <span className="font-medium">{"Haydovchi"}:</span>
                        <span>{data?.driver_name || "Haydovchi 1"}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <Phone size={18} />
                        <span className="font-medium">{"Telefon 1"}:</span>
                        <span>+998 88 102 30 42</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <Phone size={18} />
                        <span className="font-medium">{"Telefon 2"}:</span>
                        <span>+998 88 102 30 42</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <CalendarDays size={18} />
                        <span className="font-medium">
                            {"Mashina  narxi "}:
                        </span>
                        <span>{"200 000 000 so'm"}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <CalendarDays size={18} />
                        <span className="font-medium">
                            {"Yillik amortizatsiya"}:
                        </span>
                        <span>{"20 000 000 so'm"}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <CalendarDays size={18} />
                        <span className="font-medium">
                            {"Ro‘yxatdan o‘tgan sana"}:
                        </span>
                        <span>{data?.register_date || "2025-01-01"}</span>
                    </div>
                </div>
            </div>

            {/* Truck ma’lumotlari 2 */}
            <div className="flex flex-col gap-2 mt-10">
                <div className="flex items-center gap-2 flex-wrap">
                    <Fuel size={18} />
                    <span className="font-medium">{"Yoqilg'i turlari"}:</span>
                    {/* Qaysi mashina yo'qilgi turi shunga oid chiqishi kerak */}
                    <span>{data?.fuel_consumption || "Benzin / Metan / Dizel / Elektr "}</span>

                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <Fuel size={18} />
                    <span className="font-medium">{"Yoqilg‘i sarfi"}:</span>
                    <span>{data?.fuel_consumption || "100 km / 28 litr"}</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <Wrench size={18} />
                    <span className="font-medium">{"Texnik holat"}:</span>
                    <span>{data?.technical_status || "90%"}</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <Gauge size={18} />
                    <span className="font-medium">{"Probeg"}:</span>
                    <span>{data?.distance || "25 000 km / + 12 000 km"}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <CalendarDays size={18} />
                    <span className="font-medium">{"Ishlab chiqarilgan yili"}:</span>
                    <span>{data?.distance || "2024 "}</span>
                </div>
            </div>

            {/* O‘ng taraf - moliyaviy ma’lumotlar */}
            <div className="flex-col border border-divider  whitespace-nowrap p-6 rounded-lg flex items-start  gap-2">
                <div className="flex items-center gap-3 w-full border-b pb-2 dark:border-b-zinc-700">
                    <Fuel size={18} className="mr-2" />
                    <span className="min-w-24 font-medium text-xl">
                        {"Yoqilq'i sarfi"}:
                    </span>
                    <span className="font-medium text-xl">
                        {formatMoney(10000)} litr
                    </span>
                </div>
                <div className="flex items-center gap-3 w-full border-b pb-2 dark:border-b-zinc-700">
                    <Gauge size={18} className="mr-2" />
                    <span className="min-w-24 font-medium text-xl">
                        {"Masofa"}:
                    </span>
                    <span className="font-medium text-xl">
                        {data?.distance || "250 000 km"}
                    </span>
                </div>

                <div className="flex items-center gap-3 w-full border-b pb-2 dark:border-b-zinc-700">
                    <DollarSign size={18} className="mr-2" />
                    <span className="min-w-24 font-medium text-xl">
                        {"Tushum"}:
                    </span>
                    <span className="font-medium text-blue-500 text-xl">
                        {formatMoney(120000000)}
                    </span>
                </div>

                <div className="flex items-center w-full gap-3 border-b pb-2 dark:border-b-zinc-700">
                    <FileText size={18} className="mr-2" />
                    <span className="min-w-24 font-medium text-xl">
                        {"Xarajat"}:
                    </span>
                    <span className="text-destructive font-medium text-xl">
                        -{formatMoney(80000000)}
                    </span>
                </div>

                <div className="flex items-center w-full gap-3 border-b pb-2 dark:border-b-zinc-700">
                    <FileText size={18} className="mr-2" />
                    <span className="min-w-24 font-medium text-xl">
                        {"Foyda"}:
                    </span>
                    <span className="text-green-500 font-medium text-xl">
                        +{formatMoney(80000000)}
                    </span>
                </div>
            </div>
        </div>
    )
}

export default TruckProfile
