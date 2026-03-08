export const DEMAND_CONSTANTS = {
    DEMAND_SPIKE_THRESHOLD: 1.5, // 50% increase over baseline
    FAST_MOVING_THRESHOLD: 5.0,  // sales velocity >= 5 units per day
    STOCKOUT_DAYS_THRESHOLD: 14, // 14 days or less to stockout
    REORDER_CONFIDENCE_THRESHOLD: 0.6,
    DEFAULT_SIGNAL_EXPIRY_DAYS: 7, // signals expire after 7 days if not updated
};

export const DEMAND_SIGNAL_TYPES = {
    STOCKOUT_RISK: "STOCKOUT_RISK",
    FAST_MOVING_PRODUCT: "FAST_MOVING_PRODUCT",
    DEMAND_SPIKE: "DEMAND_SPIKE",
    REORDER_POINT_REACHED: "REORDER_POINT_REACHED",
};

export const DEMAND_SIGNAL_STATUS = {
    OPEN: "OPEN",
    RESOLVED: "RESOLVED",
    EXPIRED: "EXPIRED",
};
