import { MockHandler } from "./types"

const ALL_ACTIONS = [
    "manager_vehicles_view",
    "manager_cashflow_view",
    "manager_tech_check_view",
    "accounting_view",
    "investor_view",
    "finance_view",
    "monitoring_view",
    "settings_locations_view",
    "settings_directions_view",
    "settings_users_view",
    "settings_drivers_view",
    "settings_roles_view",
    "settings_customers_view",
    "settings_vehicles_view",
    "settings_vehicle_types_view",
    "settings_cargo_types_view",
    "settings_payment_types_view",
    "settings_expense_types_view",
    "settings_petrol_stations_view",
    "settings_petrol_stations_control",
]

const MOCK_USER = {
    uuid: "mock-user-uuid",
    full_name: "Demo Foydalanuvchi",
    phone: "+998901234567",
    username: "demo",
    is_superuser: true,
    actions: ALL_ACTIONS,
}

export const authHandlers: MockHandler[] = [
    {
        match: (m, u) => m === "POST" && u === "/auth/login/",
        respond: () => ({ status: 200, data: { access: "mock-access-token" } }),
    },
    {
        match: (m, u) => m === "GET" && u === "/profile/",
        respond: () => ({ status: 200, data: MOCK_USER }),
    },
]
