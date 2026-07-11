// import { useNavigationStore } from "@/store/navigation-store"
// import { useNavigate } from "@tanstack/react-router"

// export default function useHistoryNavigate() {
//     const { prev,  add } = useNavigationStore()
//     const navigate = useNavigate()

//     function push(path: string) {
//         add(path)
//         navigate({ to: path })
//     }

//     function back(fallBack: string = "/hr") {
//         if (prev) {
//             navigate({ to: prev })
//         } else {
//             navigate({ to: fallBack })
//         }
//     }

//     return { push, back }
// }
 