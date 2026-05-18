type LogItem = {
    id: number
    created: string
    updated: string
    action: number
    comment: string | null
    old_data: Record<string, unknown> | null
    new_data: Record<string, unknown> | null
    section: string | null
    device: string | null
    user_agent: string | null
    ip_address: string | null
    model: string
    obj_id: string
    user: number | null
    role: number | null
    full_name: string | null
    username: string | null
    role_name: string | null
    action_label: string | null
}

type LogSection = {
    section: string
    count: number
}
