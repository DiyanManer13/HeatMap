import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import type { DeliveryRoute, DispatchMapData } from "./types";
import "leaflet/dist/leaflet.css";

const puneCenter: [number, number] = [18.527, 73.86];

const RouteFocus = ({ route }: { route: DeliveryRoute | null }) => {
  const map = useMap();
  useEffect(() => {
    if (route) map.fitBounds([[route.pickup.latitude, route.pickup.longitude], [route.dropoff.latitude, route.dropoff.longitude]], { padding: [45, 45] });
  }, [map, route]);
  return null;
};

export const DispatchMap = ({ data, language, compact = false }: { data: DispatchMapData; language: "en" | "hi"; compact?: boolean }) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(data.deliveries[0]?.orderId ?? null);
  const selectedRoute = useMemo(() => data.deliveries.find((route) => route.orderId === selectedOrderId) ?? null, [data.deliveries, selectedOrderId]);
  const selectedRiderId = selectedRoute?.riderId;
  const activeLabel = language === "hi" ? "चुनी गई डिलीवरी" : "Selected delivery";
  const restLabel = language === "hi" ? "ओपनस्ट्रीटमैप उम्मीदवार · सत्यापित नहीं" : "OpenStreetMap candidate · not verified";
  const heatAware = data.mode === "HEAT_AWARE";
  const restCandidates = data.restPointStatus === "LIVE_OSM" || data.restPointStatus === "STALE_OSM" ? data.restPoints : [];

  return <section className={`map-panel${compact ? " comparison-map-panel" : ""}`} aria-label={`${heatAware ? "Pause Pay" : "Baseline"} dispatch map`}>
    <div className="map-canvas">
      <MapContainer center={puneCenter} zoom={12} scrollWheelZoom className="pune-map">
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <RouteFocus route={selectedRoute} />
        {data.deliveries.map((route) => <Polyline key={route.orderId} positions={[[route.pickup.latitude, route.pickup.longitude], [route.dropoff.latitude, route.dropoff.longitude]]} pathOptions={{ color: heatAware ? (route.orderId === selectedOrderId ? "#16805f" : "#9fc7b4") : (route.orderId === selectedOrderId ? "#596b7f" : "#b7c1ca"), weight: route.orderId === selectedOrderId ? 5 : 2, opacity: route.orderId === selectedOrderId ? 1 : .5 }} />)}
        {data.deliveries.map((route) => <CircleMarker key={`${route.orderId}-pickup`} center={[route.pickup.latitude, route.pickup.longitude]} radius={route.orderId === selectedOrderId ? 7 : 4} pathOptions={{ color: "#d47d38", fillColor: "#f0a45d", fillOpacity: .95, weight: 1 }}><Popup>{language === "hi" ? "पिकअप" : "Pickup"}<br />Order {route.orderId.slice(0, 6)}</Popup></CircleMarker>)}
        {data.deliveries.map((route) => <CircleMarker key={`${route.orderId}-dropoff`} center={[route.dropoff.latitude, route.dropoff.longitude]} radius={route.orderId === selectedOrderId ? 7 : 4} pathOptions={{ color: "#12684f", fillColor: "#38a37f", fillOpacity: .95, weight: 1 }}><Popup>{language === "hi" ? "ड्रॉप-ऑफ" : "Drop-off"}<br />Order {route.orderId.slice(0, 6)}</Popup></CircleMarker>)}
        {data.riders.map((rider) => {
          const color = rider.dose >= 80 ? "#cf5543" : rider.dose >= 50 ? "#d99543" : "#16805f";
          return <CircleMarker key={rider.riderId} center={[rider.location.latitude, rider.location.longitude]} radius={rider.riderId === selectedRiderId ? 7 : 4} pathOptions={{ color: "#fff", fillColor: color, fillOpacity: rider.riderId === selectedRiderId ? 1 : .85, weight: 1 }}><Popup>{language === "hi" ? "राइडर" : "Rider"} {rider.riderId.slice(0, 6)}<br />{language === "hi" ? "हीट डोज़" : "Heat dose"}: {Math.round(rider.dose)}%</Popup></CircleMarker>;
        })}
        {heatAware && restCandidates.map((point) => <CircleMarker key={point.id} center={[point.location.latitude, point.location.longitude]} radius={7} pathOptions={{ color: "#265c9f", fillColor: "#7db5ea", fillOpacity: .9, weight: 2 }}><Popup>{restLabel}<br /><strong>{point.name}</strong><br />{point.category}<br /><a href={point.osmUrl} target="_blank" rel="noreferrer">OpenStreetMap</a></Popup></CircleMarker>)}
      </MapContainer>
    </div>
    <aside className="route-list"><p className="eyebrow">{activeLabel}</p><div className="route-scroll">{data.deliveries.map((route, index) => <button key={route.orderId} className={route.orderId === selectedOrderId ? "route-item active" : "route-item"} onClick={() => setSelectedOrderId(route.orderId)}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{language === "hi" ? "ऑर्डर" : "Order"} #{route.orderId.slice(0, 6)}</strong><small>{language === "hi" ? "राइडर" : "Rider"} #{route.riderId.slice(0, 6)} · ₹{Math.round(route.deliveryFee)}</small></div><em>{Math.round(route.doseAfter)}%</em></button>)}</div>{selectedRoute && <div className="route-detail"><p>{language === "hi" ? "रूट" : "Route"}</p><strong>{language === "hi" ? "पिकअप" : "Pickup"} → {language === "hi" ? "ड्रॉप-ऑफ" : "Drop-off"}</strong><span>{new Date(selectedRoute.assignedAt).toLocaleTimeString(language === "hi" ? "hi-IN" : "en-IN", { hour: "2-digit", minute: "2-digit" })} · ₹{Math.round(selectedRoute.deliveryFee)}</span></div>}</aside>
  </section>;
};
