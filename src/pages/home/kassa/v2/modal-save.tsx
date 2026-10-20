import { Button } from "@/components/ui/button"

export const Save = ({ label, loading, disabled }: { label: string; loading?: boolean; disabled?: boolean }) => (
    <div className="flex justify-end mt-1">
        <Button className="min-w-32" type="submit" loading={loading} disabled={disabled}>{label}</Button>
    </div>
)
