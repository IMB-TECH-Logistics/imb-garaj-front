/** ===== HR (legacy placeholders) ===== */

export const CLIENT_CODES = "hr/"
export const SELECTABLE_FILTER = "hr/"
export const SELECTABLE_USERS = "hr/"
export const CLIENTS_AVAILABLE = "hr/"
export const MANAGERS_ORDERS_CREATE = "hr/"
export const MANAGERS_ORDERS_NEW = "hr/"
export const SHIFTS = "hr/"

/** ===== AUTH & PROFILE ===== */
export const LOGIN = "auth/login"
export const PROFILE = "profile"

/** ===== TRIPS ===== */
export const TRIPS = "trips"
export const TRIPS_ORDERS = "trips/orders"
export const TRIPS_ORDERS_PAYMENT = "trips/order-payments"
export const TRIPS_DRIVER_STATS = "trips/driver-stats"

/** ===== VEHICLES ===== */
export const VEHICLES = "vehicles"
export const TECHNICAL_INSPECT = "vehicles/technical-inspection"

/** ===== CHECKOUT ===== */
export const CHECKOUT_MAIN = "checkout/main"
export const ORDER_CASHFLOWS = "checkout/order-cashflows"
export const VEHICLES_CASHFLOWS = "checkout/vehicle-cashflows"
export const CASHFLOW_STATISTICS = "checkout/cashflow-statistic"

/** ===== USERS / DRIVERS / ROLES ===== */
export const SETTINGS_USERS = "users"
export const SETTINGS_ROLES = "users/roles"
export const SETTINGS_DRIVERS = "users/drivers"
export const DRIVERS_BALANCE = "users/drivers/balance"

/** ===== REFERENCE DATA (moved from /common/ to dedicated domains) ===== */
export const SETTINGS_PETROL_STATIONS = "petrol-stations"
export const SETTINGS_CUSTOMERS = "clients"
export const SETTINTS_PAYMENT_TYPE = "payment-types"
export const SETTINGS_VEHICLE_TYPE = "vehicle-types"
export const SETTINGS_CARGO_TYPE = "cargo-types"
export const SETTINGS_CARGO_TYPES = "cargo-types"
export const SETTINGS_EXPENSES = "expense-categories"

/** ===== PLACES (was /common/{countries,regions,districts}) ===== */
export const SETTINGS_COUNTRIES = "places/countries"
export const SETTINGS_REGIONS = "places/regions"
export const SETTINGS_DISTRICTS = "places/districts"

/** ===== ROUTES / DIRECTIONS (was /common/directions) ===== */
export const COMMON_DIRECTIONS = "routes"
export const COMMON_DIRECTIONS_LOADS = "routes/loads"
export const COMMON_DIRECTIONS_CLIENTS = "routes/clients"
export const COMMON_DIRECTIONS_CARGO_TYPES = "routes/cargo-types"

/** ===== SELECTABLE (was /common/selectable/*) ===== */
export const SETTINGS_SELECTABLE_VEHICLE_TYPE = "selectable/vehicle-type"
export const SETTINGS_SELECTABLE_USERS = "selectable/user"
export const SETTINGS_SELECTABLE_CLIENT = "selectable/client"
export const SETTINGS_SELECTABLE_DISTRICT = "selectable/district"
export const SETTINGS_SELECTABLE_PAYMENT_TYPE = "selectable/payment-type"
export const SETTINGS_SELECTABLE_CARGO_TYPE = "selectable/cargo-type"
export const SETTINGS_SELECTABLE_EXPENSE_CATEGORY = "selectable/expense-category"
export const COMMON_SELECTABLE_VEHICLE_TYPE = "vehicle-types"

/** ===== DASHBOARD (was /owner/) ===== */
export const OWNER_MAIN_STATISTIC = "dashboard/main-statistic"
export const OWNER_TRIP_DAILY_STATISTIC = "dashboard/trip-daily-statistic"

/** ===== MANAGER (BFF aggregator — unchanged) ===== */
export const MANAGERS_VEHICLES = "manager/vehicles"
export const MANAGERS_TRIPS = "manager/trips"
export const MANAGERS_TRIPS_START_DATA = "manager/trips/start-data"
export const MANAGERS_ORDERS = "manager/orders"
export const MANAGERS_EXPENSES = "manager/expense"
export const MANAGERS_INCOMES = "manager/income"
export const MANAGERS_CASHFLOW = "manager/cashflow"
export const MANAGERS_CASHFLOW_CURRENCY = "manager/cashflow/currency"
export const MANAGERS_CASHFLOW_TRIP_STAT = "manager/cashflow/trip"
export const MANAGERS_CASHFLOW_DRIVER_STAT = "manager/cashflow/driver"
export const MANAGERS_EXPENSE_CATEGORIES = "manager/expense/category"
export const MANAGERS_RUNS = "manager/runs"
export const MANAGERS_DRIVER_SALARY = "manager/driver-salary"

/** ===== MOBILE (driver app — unchanged) ===== */
export const MOBILE_ORDER_UPDATE = "mobile/order-update"

/** ===== MONITORING (GPS routes & live tracking) ===== */
export const MONITORING_ROUTES = "monitoring/routes"
export const MONITORING_ROUTES_POLYLINE = "monitoring/routes/polyline"
export const MONITORING_LIVE_TRACKING = "monitoring/live-tracking"
// Append `/<tripId>/track` when calling: `${MONITORING_TRIP_TRACK}/${id}/track`
export const MONITORING_TRIP_TRACK = "monitoring/trips"

/** ===== WAREHOUSE / OMBOR ===== */
export const WAREHOUSE_PRODUCTS = "warehouse/products"
export const WAREHOUSE_STATS = "warehouse/stats"

/** ===== CHECKOUT extras ===== */
export const CHECKOUT_TOP_UP = "checkout/top-up"
export const CHECKOUT_EXPENSE = "checkout/expense"
export const TRANSACTIONS = "transaction"
export const PETROL_STATIONS_STATS = "petrol-stations/stats"

export const WAREHOUSE_WITHDRAW = "warehouse/withdraw"
export const WAREHOUSE_WITHDRAWALS = "warehouse/withdrawals"

/** ===== DRIVERS (Haydovchilar) ===== */
export const DRIVERS_STATS = "users/drivers/stats"
export const DRIVERS_OVERVIEW = "users/drivers"

/** ===== DRIVER SALARIES (route config) ===== */
export const DRIVER_SALARIES = "driver-salaries"
export const DRIVERS_LIST = "users/drivers/list"
