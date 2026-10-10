export type DispatchMetrics = {
  completedOrders: number;
  lateDeliveries: number;
  ridersOverHeatLimit: number;
  softLimitOverrides: number;
  deliveryEarnings: number;
  pauseCredits: number;
  averageEarningsPerHeatPoint: number;
};

export type Comparison = {
  baseline: DispatchResult;
  heatAware: DispatchResult;
};

export type DispatchAssignmentSummary = {
  orderId: string;
  riderId: string;
  assignedAt: string;
  completedAt: string;
  doseAfter: number;
  late: boolean;
  softLimitOverride: boolean;
};

export type DispatchResult = {
  seed: number;
  mode: "BASELINE" | "HEAT_AWARE";
  assignments: DispatchAssignmentSummary[];
  metrics: DispatchMetrics;
};

export type ComparisonSummary = {
  seed: number;
  generatedAt: string;
  baseline: DispatchMetrics;
  heatAware: DispatchMetrics;
};

export type PuneLocation = { latitude: number; longitude: number };

export type DeliveryRoute = {
  orderId: string;
  riderId: string;
  pickup: PuneLocation;
  dropoff: PuneLocation;
  assignedAt: string;
  completedAt: string;
  deliveryFee: number;
  doseAfter: number;
  heatLimitOverride: boolean;
};

export type DispatchMapData = {
  seed: number;
  mode: "BASELINE" | "HEAT_AWARE";
  riders: { riderId: string; location: PuneLocation; dose: number; onHeatPause: boolean }[];
  restPoints: { id: string; name: string; location: PuneLocation; category: string; osmUrl: string; verified: boolean }[];
  restPointStatus?: "LIVE_OSM" | "STALE_OSM" | "UNAVAILABLE";
  restPointsUpdatedAt: string | null;
  deliveries: DeliveryRoute[];
};
