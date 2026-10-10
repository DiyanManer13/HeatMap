import {
  MapPin, Navigation, Siren, Droplets, Wallet, Bike,
  CheckCircle2, Trees, Coffee, Zap, Loader2, QrCode, ScanLine, X
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./Rider.css";

// ─── fix Leaflet default icon paths (broken by Vite) ─────────────────────────
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ─── helpers ─────────────────────────────────────────────────────────────────
const lerp  = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpPt = (a: [number,number], b: [number,number], t: number): [number,number] =>
  [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

// Walk t (0..1) along a multi-point polyline
const interpolateRoute = (pts: [number,number][], t: number): [number,number] => {
  if (!pts.length) return [18.5204, 73.8567];
  if (t <= 0) return pts[0];
  if (t >= 1) return pts[pts.length - 1];
  const seg = t * (pts.length - 1);
  const i   = Math.floor(seg);
  return lerpPt(pts[i], pts[Math.min(i + 1, pts.length - 1)], seg - i);
};

// OSRM public router — real road geometry, no API key needed
const fetchRoadRoute = async (
  from: [number,number], to: [number,number]
): Promise<[number,number][]> => {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${from[1]},${from[0]};${to[1]},${to[0]}` +
    `?overview=full&geometries=geojson`;
  const res  = await fetch(url);
  const json = await res.json() as {
    routes?: { geometry: { coordinates: [number,number][] } }[];
  };
  // OSRM returns [lng, lat]; Leaflet needs [lat, lng]
  return (json.routes?.[0]?.geometry.coordinates ?? []).map(
    ([lng, lat]) => [lat, lng] as [number,number]
  );
};

// ─── icons ────────────────────────────────────────────────────────────────────
const placeIcon = (type: string) => L.divIcon({
  className: "",
  html: `<div style="
    width:34px;height:34px;border-radius:50%;
    background:${type==="rest"?"#16805f":type==="water"?"#1a73e8":"#7b5ea7"};
    display:flex;align-items:center;justify-content:center;
    border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,0.28);
    font-size:16px;
  ">${type==="rest"?"☕":type==="water"?"💧":"🌳"}</div>`,
  iconSize:   [34, 34],
  iconAnchor: [17, 17],
});

const riderIcon = (color: string) => L.divIcon({
  className: "",
  html: `<div style="
    width:42px;height:42px;border-radius:50%;
    background:${color};
    display:flex;align-items:center;justify-content:center;
    border:3px solid #fff;box-shadow:0 4px 16px rgba(0,0,0,0.32);
    font-size:22px;
  ">🛵</div>`,
  iconSize:   [42, 42],
  iconAnchor: [21, 21],
});

const destinationIcon = (emoji: string) => L.divIcon({
  className: "",
  html: `<div style="
    width:36px;height:36px;border-radius:50%;
    background:#fff;border:3px solid #222;
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 2px 10px rgba(0,0,0,0.25);font-size:18px;
  ">${emoji}</div>`,
  iconSize:   [36, 36],
  iconAnchor: [18, 18],
});

// ─── smooth-follow camera ────────────────────────────────────────────────────
const SmoothCamera = ({ center }: { center: [number,number] }) => {
  const map     = useMap();
  const raf     = useRef<number>(0);
  const current = useRef<[number,number]>(center);

  useEffect(() => {
    const target = center;
    const tick = () => {
      current.current = lerpPt(current.current, target, 0.08);
      map.panTo(current.current, { animate: false });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [map, center]);

  return null;
};

// ─── sub-components ──────────────────────────────────────────────────────────
const PlaceMarker = ({
  place,
}: {
  place: { id: number; type: string; lat: number; lng: number; name: string; time: string; credit: number };
}) => (
  <Marker position={[place.lat, place.lng]} icon={placeIcon(place.type)}>
    <Popup closeButton={false}>
      <div style={{ minWidth: 150, fontFamily: "DM Sans, sans-serif", padding: 4 }}>
        <strong style={{ fontSize: 15 }}>{place.name}</strong>
        <p style={{ margin: "4px 0 2px", color: "#555", fontSize: 13 }}>🚶 {place.time} walk</p>
        {place.credit > 0 && (
          <p style={{ margin: 0, color: "#16805f", fontWeight: 700, fontSize: 13 }}>
            Pause credit: ₹{place.credit}
          </p>
        )}
      </div>
    </Popup>
  </Marker>
);

// ─── main component ──────────────────────────────────────────────────────────
export const Rider = ({
  riderId,
  language,
  setLanguage,
}: {
  riderId: string;
  language: string;
  setLanguage: (l: string) => void;
}) => {
  const [dose, setDose]           = useState(38);
  const [earnings, setEarnings]   = useState(450);
  const [status, setStatus]       = useState<"ACTIVE" | "RESTING" | "OFFLINE">("ACTIVE");
  const [restTimer, setRestTimer] = useState(300);
  const [task, setTask]           = useState<"IDLE" | "PICKUP" | "DROPOFF">("IDLE");
  const [progress, setProgress]   = useState(0);
  const [toast, setToast]         = useState<string | null>(null);
  const [orderSeed, setOrderSeed] = useState(0);
  const [routeLoading, setRouteLoading] = useState(false);
  const [restCheckedIn, setRestCheckedIn] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);

  // real road polylines fetched from OSRM
  const [pickupRoad,  setPickupRoad]  = useState<[number,number][]>([]);
  const [dropoffRoad, setDropoffRoad] = useState<[number,number][]>([]);
  const [restRoad,    setRestRoad]    = useState<[number,number][]>([]);

  // deterministic rider base location
  const idHash = useMemo(() =>
    riderId ? riderId.split("").reduce((a, b) => a + b.charCodeAt(0), 0) : 100,
  [riderId]);
  const baseLat = 18.5204 + (idHash % 100 - 50) / 4000;
  const baseLng = 73.8567 + ((idHash * 3) % 100 - 50) / 4000;

  // order waypoints (deterministic per orderSeed)
  const { pickupPt, dropoffPt, customerPt, restaurantName, orderNum, restPlace } = useMemo(() => {
    const s = idHash + orderSeed * 17;
    const rnames = ["Vaishali", "Cafe Goodluck", "Burger King", "Kalyani Veg", "Le Plaisir", "Blue Nile", "Wadeshwar", "Roopali"];
    const rPlace = ["Cool Cafe", "Akbar Park Shade", "PMC Water Point", "Kalmadi Shaded Spot", "Shivaji Bridge Rest"][s % 5];

    const off = (n: number, scale = 8000) => ((n % 120 - 60) / scale);
    const pLat = baseLat + off(s);
    const pLng = baseLng + off(s * 7);
    const dLat = baseLat + off(s * 13);
    const dLng = baseLng + off(s * 19);

    return {
      pickupPt:      [baseLat, baseLng]   as [number,number],
      dropoffPt:     [pLat, pLng]         as [number,number],
      customerPt:    [dLat, dLng]         as [number,number],
      restaurantName: rnames[s % rnames.length],
      orderNum:       (s * 13 + 1000) % 9000 + 1000,
      restPlace:      rPlace,
    };
  }, [idHash, orderSeed, baseLat, baseLng]);

  // rest + helper place markers
  const places = useMemo(() => {
    const s = idHash + orderSeed;
    const off = (n: number) => ((n % 60 - 30) / 10000);
    return [
      { id: 1, type: "rest",  lat: baseLat + off(s * 7),  lng: baseLng + off(s * 11), name: restPlace,           time: "3 min", credit: 20 },
      { id: 2, type: "water", lat: baseLat + off(s * 13), lng: baseLng - off(s * 17), name: "PMC Water Point",   time: "2 min", credit: 5  },
      { id: 3, type: "shade", lat: baseLat - off(s * 19), lng: baseLng + off(s * 23), name: "Banyan Tree Shade", time: "1 min", credit: 10 },
    ];
  }, [idHash, orderSeed, baseLat, baseLng, restPlace]);

  // ── fetch REAL road routes whenever order changes ─────────────────────────
  useEffect(() => {
    let cancelled = false;
    setRouteLoading(true);
    setPickupRoad([]);
    setDropoffRoad([]);
    setRestRoad([]);

    const restPoint: [number,number] = [places[0].lat, places[0].lng];

    Promise.all([
      fetchRoadRoute(pickupPt,  dropoffPt),
      fetchRoadRoute(dropoffPt, customerPt),
      fetchRoadRoute(pickupPt,  restPoint),
    ]).then(([pr, dr, rr]) => {
      if (cancelled) return;
      setPickupRoad(pr.length  ? pr : [pickupPt,  dropoffPt]);   // fallback to straight line if OSRM fails
      setDropoffRoad(dr.length ? dr : [dropoffPt, customerPt]);
      setRestRoad(rr.length    ? rr : [pickupPt,  restPoint]);
      setRouteLoading(false);
    }).catch(() => {
      if (cancelled) return;
      // graceful fallback to straight lines
      setPickupRoad([pickupPt,  dropoffPt]);
      setDropoffRoad([dropoffPt, customerPt]);
      setRestRoad([pickupPt,    [places[0].lat, places[0].lng]]);
      setRouteLoading(false);
    });

    return () => { cancelled = true; };
  }, [orderSeed, pickupPt, dropoffPt, customerPt, places]);

  // current road path being driven
  const activeRoad =
    task === "PICKUP"  ? pickupRoad  :
    task === "DROPOFF" ? dropoffRoad :
    status === "RESTING" ? restRoad  : null;

  // rider position = interpolated along road
  const riderPos: [number,number] = activeRoad?.length
    ? interpolateRoute(activeRoad, progress)
    : pickupPt;

  // ── animate progress along road ───────────────────────────────────────────
  useEffect(() => {
    if (!activeRoad?.length) return;
    const id = setInterval(() => setProgress(p => Math.min(1, p + 0.006)), 80);
    return () => clearInterval(id);
  }, [activeRoad, task, status]);

  // ── dose ticker ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (status === "ACTIVE") {
      const id = setInterval(() => setDose(d => Math.min(110, d + 4)), 6000);
      return () => clearInterval(id);
    }
    if (status === "RESTING" && restCheckedIn) {
      const id = setInterval(() => {
        setDose(d => Math.max(0, d - 6));
        setRestTimer(r => Math.max(0, r - 1));
      }, 1000);
      return () => clearInterval(id);
    }
  }, [status, restCheckedIn]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const doseColor =
    dose > 100 ? "#8B0000" :
    dose >= 80 ? "#cf5543" :
    dose >= 50 ? "#d99543" :
                 "#16805f";

  const acceptOrder = () => { setTask("PICKUP"); setProgress(0); showToast(`Heading to ${restaurantName}`); };
  const arrivedPickup = () => { setTask("DROPOFF"); setProgress(0); showToast("Order picked up! Riding to customer."); };
  const completeDelivery = () => {
    setTask("IDLE"); setProgress(0);
    setEarnings(e => e + 45);
    setOrderSeed(s => s + 1);
    showToast("₹45 earned! Looking for next order…");
  };
  const startRest = () => { setStatus("RESTING"); setTask("IDLE"); setProgress(0); setRestCheckedIn(false); showToast(`Rest plan shared: ${restPlace}`); };
  const checkInAtRest = () => { setRestCheckedIn(true); setRestTimer(300); setShowQrScanner(false); showToast("Check-in verified. Your paid cooling break has started."); };

  const routeColor =
    task === "PICKUP"  ? "#1a73e8" :
    task === "DROPOFF" ? "#f59e0b" :
    dose >= 80 ? "#cf5543" : "#16805f";

  // ETA estimate based on progress
  const pickupETA  = Math.max(1, Math.round((1 - progress) * 6));
  const dropoffETA = Math.max(1, Math.round((1 - progress) * 10));

  return (
    <div className="rider-screen">
      {toast && <div className="app-toast" key={toast}>{toast}</div>}

      {showQrScanner && (
        <div className="qr-scanner" role="dialog" aria-modal="true" aria-label="Rest hub QR scanner">
          <div className="scanner-top"><button onClick={() => setShowQrScanner(false)} aria-label="Close scanner"><X size={20}/></button><strong>Scan rest-hub QR</strong><span/></div>
          <div className="scanner-view">
            <div className="scan-frame"><i/><i/><i/><i/><ScanLine size={34}/></div>
            <p>Point your camera at the QR plaque at <strong>{restPlace}</strong>.</p>
          </div>
          <div className="demo-qr-card">
            <div className="demo-qr" aria-label="Demo rest hub QR code"><b/><b/><b/><b/><b/><b/><b/><b/><b/></div>
            <div><strong>Judge demo QR</strong><span>This represents the QR plaque at the partner hub.</span></div>
            <button onClick={checkInAtRest}><CheckCircle2 size={16}/> Verify</button>
          </div>
        </div>
      )}

      {/* ── full-bleed map ── */}
      <div className="rider-map-container">
        <MapContainer
          key={`${baseLat.toFixed(5)}-${baseLng.toFixed(5)}`}
          center={riderPos}
          zoom={16}
          zoomControl={false}
          className="rider-map"
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <SmoothCamera center={riderPos} />

          {/* real road route polyline */}
          {activeRoad && activeRoad.length > 1 && (
            <Polyline
              positions={activeRoad}
              pathOptions={{ color: routeColor, weight: 6, opacity: 0.85, lineCap: "round", lineJoin: "round" }}
            />
          )}

          {/* destination marker */}
          {task === "PICKUP" && (
            <Marker position={dropoffPt} icon={destinationIcon("🏪")} />
          )}
          {task === "DROPOFF" && (
            <Marker position={customerPt} icon={destinationIcon("📦")} />
          )}

          {/* helper place markers */}
          {places.map(p => <PlaceMarker key={p.id} place={p} />)}

          {/* rider */}
          <Marker position={riderPos} icon={riderIcon(doseColor)} zIndexOffset={1000} />
        </MapContainer>

        {/* loading badge */}
        {routeLoading && (
          <div className="route-loading-badge">
            <Loader2 size={14} className="spin-icon" /> Fetching road…
          </div>
        )}
      </div>

      {/* ── floating glass header ── */}
      <header className="rider-header">
        <div className="rider-top">
          <label className="language-switch">
            <select value={language} onChange={e => setLanguage(e.target.value)}>
              <option value="en">EN</option>
              <option value="hi">HI</option>
              <option value="mr">MR</option>
            </select>
          </label>
          <div className="earnings-pill"><Wallet size={15} /> ₹{earnings}</div>
        </div>
        <div className="dose-header">
          <div
            className="circular-dose"
            style={{ "--dose": `${Math.min(100, dose)}%`, "--dose-color": doseColor } as CSSProperties}
          >
            <strong>{Math.round(dose)}%</strong>
          </div>
          <p>Heat Dose</p>
        </div>
      </header>

      {/* ── bottom sheet ── */}
      <div className="rider-bottom-card">
        <div className="drag-handle" />

        {status === "OFFLINE" ? (
          <div className="card-state">
            <h3>Offline</h3>
            <p><MapPin size={15} /> Last location saved. Reconnecting…</p>
            <button className="btn-primary" onClick={() => setStatus("ACTIVE")}>Go Online</button>
          </div>

        ) : status === "RESTING" ? (
          <div className="card-state">
            <h3>Resting at {restPlace}</h3>
            {restCheckedIn ? <>
              <p><Droplets size={15} /> QR check-in verified · Dose cooling down · {Math.floor(restTimer / 60)}:{String(restTimer % 60).padStart(2, "0")} left</p>
              <div className="progress-bar"><div style={{ width: `${Math.max(0, (300 - restTimer) / 300 * 100)}%`, background: doseColor }} /></div>
              <button className="btn-secondary" style={{ marginTop: 12 }} onClick={() => { setStatus("ACTIVE"); setRestTimer(300); }}>Resume Work</button>
            </> : <>
              <p><MapPin size={15} /> Follow the amber route to <strong>{restPlace}</strong>. A QR plaque is displayed at its counter/entrance.</p>
              <button className="btn-primary nav-btn" onClick={() => setShowQrScanner(true)}><QrCode size={17} /> I’m at the hub · Scan QR</button>
              <button className="btn-secondary" style={{ marginTop: 10 }} onClick={() => setStatus("ACTIVE")}>I cannot reach this hub</button>
            </>}
          </div>

        ) : task === "PICKUP" ? (
          <div className="card-state">
            <div className="task-pill blue"><Zap size={13} /> On the way to pickup</div>
            <h3>{restaurantName}</h3>
            <p><Navigation size={15} /> {pickupETA} min away</p>
            <div className="progress-bar"><div style={{ width: `${progress * 100}%`, background: "#1a73e8" }} /></div>
            <button className="btn-primary blue-btn" style={{ marginTop: 14 }} onClick={arrivedPickup}>
              Arrived at Restaurant
            </button>
          </div>

        ) : task === "DROPOFF" ? (
          <div className="card-state">
            <div className="task-pill amber"><Bike size={13} /> Delivering to customer</div>
            <h3>Order #{orderNum}</h3>
            <p><Navigation size={15} /> {dropoffETA} min away</p>
            <div className="progress-bar"><div style={{ width: `${progress * 100}%`, background: "#f59e0b" }} /></div>
            <button className="btn-primary amber-btn" style={{ marginTop: 14 }} onClick={completeDelivery}>
              <CheckCircle2 size={18} /> Mark Delivered
            </button>
          </div>

        ) : dose < 50 ? (
          <div className="card-state">
            <div className="task-pill green"><Zap size={13} /> New order</div>
            <h3>Order #{orderNum}</h3>
            <p><MapPin size={15} /> Pickup: {restaurantName} · 1.2 km</p>
            <button className="btn-primary accept-btn" onClick={acceptOrder}>Accept (₹45)</button>
          </div>

        ) : dose < 80 ? (
          <div className="card-state">
            <div className="task-pill amber"><Trees size={13} /> Shaded route assigned</div>
            <h3>Order #{orderNum}</h3>
            <p><MapPin size={15} /> Pickup: {restaurantName} · shaded path</p>
            <button className="btn-primary accept-btn" onClick={acceptOrder}>Accept (₹45)</button>
          </div>

        ) : dose <= 100 ? (
          <div className="card-state">
            <div className="task-pill red"><Droplets size={13} /> Heat limit reached</div>
            <h3>Time for a break</h3>
            <p><Coffee size={15} /> {restPlace} · Pause credit ₹20</p>
            <button className="btn-primary nav-btn" onClick={startRest}><Navigation size={17} /> Navigate to Rest Point</button>
            <button className="btn-secondary" onClick={acceptOrder}>Skip break, take order</button>
          </div>

        ) : (
          <div className="card-state">
            <div className="task-pill dark"><Siren size={13} /> Critical level</div>
            <h3>Stop now</h3>
            <p><Siren size={15} /> Your body is at serious risk. Rest immediately.</p>
            <button className="btn-primary critical-btn" onClick={startRest}><Droplets size={17} /> Force Break</button>
            <button className="btn-text warning-text" onClick={acceptOrder}>Ignore (High Risk)</button>
          </div>
        )}

        <div className="rider-safety-actions">
          {status === "ACTIVE" && <button className="request-rest-btn" onClick={startRest}><Coffee size={16} /> Request a safe break</button>}
          <button className="emergency-btn" onClick={() => showToast("🚨 Emergency services alerted!")}>
            <Siren size={17} /> Emergency
          </button>
        </div>
      </div>
    </div>
  );
};
