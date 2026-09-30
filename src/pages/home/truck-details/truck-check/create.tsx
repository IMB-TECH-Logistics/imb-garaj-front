import AddExpenseModal from "@/pages/home/texnik-check/add-expense"
import { useParams } from "@tanstack/react-router"

export default function CreateTechnicInspect() {
    const { id } = useParams({ strict: false })
    return <AddExpenseModal modalKey="create" vehicleId={id ? Number(id) : undefined} />
}
