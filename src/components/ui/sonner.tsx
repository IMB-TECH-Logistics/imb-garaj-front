import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";
import Spinner from "./spinner";
import { BellRing, CircleCheck, CircleX } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
    const { theme = "system" } = useTheme();

    return (
        <Sonner
            theme={theme as ToasterProps["theme"]}
            className="toaster group"
            /**
             * YANGI-C-01: xato toasti standart holatda pastki O'NG burchakda
             * chiqardi — aynan formalarning "Saqlash" tugmasi ustida. O'lchov:
             * tugma to'liq qoplanardi va 700–4900 ms davomida bosilmasdi;
             * qayta bosilganda blok yangidan boshlanib halqaga tushardi.
             * Ikki qatlamli yechim:
             *   1) joylashuv yuqori-markazga ko'chirildi — hech bir sahifada
             *      tugma yoki forma maydoni u yerda emas;
             *   2) toast `pointer-events: none` — hatto ustma-ust tushsa ham
             *      ostidagi tugmani bloklamaydi (`elementFromPoint` tugmani
             *      qaytaradi). Toastlar o'zi 4–6 soniyada yo'qoladi va
             *      loyihada birorta toast tugmali (action) emas, shuning uchun
             *      bosilishi shart emas.
             */
            position="top-center"
            toastOptions={{
                className:
                    "shadow-sm border bg-card text-card-foreground flex items-center pointer-events-none",
                classNames: {
                    toast: "group toast pointer-events-none group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
                    description: "group-[.toast]:text-muted-foreground w-full",
                    actionButton:
                        "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
                    cancelButton:
                        "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
                },
            }}
            {...props}
            icons={{
                loading: <Spinner size="sm" />,
                success: <CircleCheck size={20} className="text-primary" />,
                error: <CircleX size={20} className="text-destructive" />,
                info: <BellRing size={20} className="text-primary" />,
            }}
        />
    );
};

export { Toaster };
