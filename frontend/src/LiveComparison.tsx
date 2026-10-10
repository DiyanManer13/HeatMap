import { AlertTriangle, Pause, Play, RefreshCw, ShieldCheck, ThermometerSun, Wallet } from "lucide-react";
import { useEffect, useState, useMemo, useRef } from "react";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { CircleMarker, MapContainer, Polyline, TileLayer, Marker, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./LiveComparison.css";

// ─── fix Leaflet default icon ──────────────────────────────────────────────
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const restIcon = L.divIcon({
  className: "",
  html: `<div style="width:28px;height:28px;background:#1a73e8;color:#fff;border-radius:50%;display:grid;place-items:center;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:14px;">☕</div>`,
  iconSize: [28,28],
  iconAnchor: [14,14]
});

// ─── Route Helpers ────────────────────────────────────────────────────────
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const interpolateRoute = (route: [number,number][], progress: number): [number,number] => {
  if (!route.length) return [18.5204, 73.8567];
  const p = Math.max(0, Math.min(1, progress));
  const seg = p * (route.length - 1);
  const i = Math.floor(seg);
  if (i >= route.length - 1) return route[route.length - 1];
  const t = seg - i;
  return [lerp(route[i][0], route[i+1][0], t), lerp(route[i][1], route[i+1][1], t)];
};

const getDrivenPath = (route: [number,number][], progress: number): [number,number][] => {
  if (!route.length) return [];
  const p = Math.max(0, Math.min(1, progress));
  const seg = p * (route.length - 1);
  const i = Math.floor(seg);
  if (i >= route.length - 1) return route;
  return [...route.slice(0, i + 1), interpolateRoute(route, p)];
};

// OSRM fetcher
const fetchRoadRoute = async (from: [number,number], to: [number,number]): Promise<[number,number][]> => {
  const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    const coords = json.routes?.[0]?.geometry.coordinates;
    if (coords) return coords.map(([lng, lat]: any) => [lat, lng]);
  } catch (e) {}
  return [from, to]; // fallback
};

const doseColor = (dose: number) => dose > 80 ? "#cf5543" : dose >= 50 ? "#d99543" : "#16805f";

// Story Waypoints
const START: [number,number] = [18.525, 73.850];
const REST: [number,number]  = [18.515, 73.860];
const END: [number,number]   = [18.505, 73.855];

// ─── Individual Map Component ─────────────────────────────────────────────
const SingleSimMap = ({
  mode, time, dose, isResting, routes, awsStatus
}: {
  mode: "BASELINE"|"HEATBUDGET"; time: number; dose: number; isResting: boolean;
  routes: { base: [number,number][], leg1: [number,number][], leg2: [number,number][] };
  awsStatus?: "connecting" | "connected" | "error";
}) => {
  const isB = mode === "BASELINE";
  
  let pos: [number,number] = START;
  let drawnPath: [number,number][] = [];
  let fullPath: [number,number][] = [];

  if (isB) {
    fullPath = routes.base;
    const p = time / 1000;
    pos = interpolateRoute(routes.base, p);
    drawnPath = getDrivenPath(routes.base, p);
  } else {
    fullPath = [...routes.leg1, ...routes.leg2];
    if (time < 450) {
      const p = time / 450;
      pos = interpolateRoute(routes.leg1, p);
      drawnPath = getDrivenPath(routes.leg1, p);
    } else if (time < 650) {
      pos = REST;
      drawnPath = routes.leg1;
    } else {
      const p = (time - 650) / 350;
      pos = interpolateRoute(routes.leg2, p);
      drawnPath = [...routes.leg1, ...getDrivenPath(routes.leg2, p)];
    }
  }
  
  return (
    <article className={`sim-map-card ${isB ? "baseline-card" : "heatbudget-card"}`}>
      <header className={isB ? "map-header-baseline" : "map-header-heatbudget"}>
        <div className="map-header-left">
          {isB ? <><AlertTriangle size={15}/> <span>Baseline — No Protection</span></>
               : <><ShieldCheck size={15}/> <span>HeatBudget — AI Active</span></>}
        </div>
        <div className="map-header-right">
          <span className="wbgt-pill">{isResting ? "Resting" : "Delivering"}</span>
        </div>
      </header>

      <div style={{ position: "relative", height: "100%" }}>
        {!isB && (
          <div className="aws-badge">
            <span style={{
              display:"inline-block", width:8, height:8, borderRadius:"50%",
              background: awsStatus === "connected" ? "#16805f" : awsStatus === "error" ? "#cf5543" : "#ff9900",
              boxShadow: awsStatus === "connected" ? "0 0 6px #16805f" : "none"
            }} />
            <span style={{color: "#ff9900"}}>AWS</span> Location Service
          </div>
        )}
        
        {isB && dose >= 100 && (
          <div className="sns-alert-badge">
            🚨 AWS SNS: Fleet Manager Alerted
          </div>
        )}

        <MapContainer center={[18.515, 73.855]} zoom={14} className="sim-map" scrollWheelZoom={false} attributionControl={false} dragging={false} doubleClickZoom={false} zoomControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          {/* Path preview */}
          {fullPath.length > 0 && <Polyline positions={fullPath} pathOptions={{ color: "#e0e0e0", weight: 4, dashArray: "5 5" }} />}
          
          {/* Path driven so far */}
          {drawnPath.length > 0 && <Polyline positions={drawnPath} pathOptions={{ color: isB ? "#8897a3" : (dose > 80 ? "#cf5543" : "#16805f"), weight: 5 }} />}

          {/* Rest stop & AWS Geofence (Only show for HeatBudget) */}
          {!isB && (
            <>
              <Circle center={REST} radius={180} pathOptions={{ color: '#232f3e', fillColor: '#ff9900', fillOpacity: 0.1, weight: 2, dashArray: "4 4" }} />
              <Marker position={REST} icon={restIcon} />
            </>
          )}

          {/* Rider */}
          <CircleMarker center={pos} radius={isResting ? 0 : 8} pathOptions={{ color: "#fff", fillColor: doseColor(dose), fillOpacity: 1, weight: 2 }} />
          
          {isResting && (
             <Marker position={REST} icon={L.divIcon({
               className: "",
               html: `<div style="background:#16805f;color:white;padding:4px 8px;border-radius:12px;font-size:12px;font-weight:bold;white-space:nowrap;transform:translate(-50%, -35px);box-shadow:0 2px 5px rgba(0,0,0,0.2);">☕ Resting & Earning</div>`,
               iconSize: [0,0]
             })} />
          )}
        </MapContainer>
      </div>
    </article>
  );
};


// ─── Main View ────────────────────────────────────────────────────────────
export const LiveComparison = () => {
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0); // 0 to 1000 ticks
  
  const [routes, setRoutes] = useState<{base: [number,number][], leg1: [number,number][], leg2: [number,number][]}>({
    base: [START, END], leg1: [START, REST], leg2: [REST, END]
  });

  const [awsStatus, setAwsStatus] = useState<"connecting" | "connected" | "error">("connecting");

  // Fetch true OSRM road routes and Ping AWS on mount
  useEffect(() => {
    Promise.all([
      fetchRoadRoute(START, END),
      fetchRoadRoute(START, REST),
      fetchRoadRoute(REST, END)
    ]).then(([base, leg1, leg2]) => {
      setRoutes({ base, leg1, leg2 });
    });

    // Authenticated AWS Ping (Fetches style descriptor to verify API key)
    const apiKey = import.meta.env.VITE_AWS_LOCATION_KEY;
    if (!apiKey) {
      console.warn("Missing VITE_AWS_LOCATION_KEY in .env file");
      setAwsStatus("error");
      return;
    }
    const awsUrl = `https://maps.geo.ap-south-1.amazonaws.com/maps/v0/maps/HeatBudgetMap/style-descriptor?key=${apiKey}`;
    fetch(awsUrl)
      .then(res => {
        if (res.ok) setAwsStatus("connected");
        else setAwsStatus("error");
      })
      .catch(() => setAwsStatus("error"));
  }, []);

  // Clock loop
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setTime(t => (t >= 1000 ? 0 : t + 2));
    }, 60);
    return () => clearInterval(id);
  }, [playing]);

  const hasFiredSns = useRef(false);

  // Reset SNS lock when sim resets
  useEffect(() => {
    if (time === 0) hasFiredSns.current = false;
  }, [time]);

  // The REAL AWS SNS Trigger
  useEffect(() => {
    if (time >= 860 && !hasFiredSns.current) {
      hasFiredSns.current = true;
      
      const fireRealAwsAlert = async () => {
        try {
          const snsClient = new SNSClient({
            region: import.meta.env.VITE_AWS_REGION,
            credentials: {
              accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
              secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
            }
          });
          
          const command = new PublishCommand({
            // Base Topic ARN (stripping the subscription ID if provided by mistake)
            TopicArn: "arn:aws:sns:ap-south-1:629234874999:HeatBudgetAlerts",
            Subject: "🚨 URGENT: HeatBudget Medical Alert",
            Message: "CRITICAL ALERT:\n\nA rider on the Baseline dispatch route has reached a 100% heat exposure dose.\n\nImmediate medical risk detected. Please dispatch support to their current GPS location immediately.\n\n- AWS Location Service & HeatBudget AI",
          });
          
          const result = await snsClient.send(command);
          console.log("SUCCESS: AWS Accepted it! MessageId:", result.MessageId);
        } catch (error) {
          console.error("Failed to send real AWS SNS Alert:", error);
        }
      };

      fireRealAwsAlert();
    }
  }, [time]);

  const hasStarted = time > 0;

  // ── Baseline Math ──
  const bDose = Math.min(100, (time / 1000) * 115); 
  const bOrders = Math.floor(time / 200);
  const bEarnings = bOrders * 45;
  const bStatus = bDose >= 100 ? "Critical Heatstroke Risk" : "Delivering";

  // ── HeatBudget Math ──
  let hDose = (time / 1000) * 90; 
  let hOrders = Math.floor(time / 200); 
  let pausePay = 0;
  let hStatus = "Delivering";
  let isResting = false;

  if (time >= 450 && time < 650) {
      isResting = true;
      hStatus = "Resting (Pause Pay Active)";
      const restProgress = (time - 450) / 200; 
      hDose = 40.5 - (30 * restProgress); 
      pausePay = Math.floor(restProgress * 40); 
      hOrders = 2; 
  } else if (time >= 650) {
      hStatus = "Delivering";
      hDose = 10.5 + ((time - 650) / 1000) * 90;
      pausePay = 40;
      hOrders = 2 + Math.floor((time - 650) / 200);
  }
  const hEarnings = hOrders * 45;
  const hTotalEarnings = hEarnings + pausePay;

  const realTime = new Date(new Date("2026-05-01T12:00:00").getTime() + (time / 1000) * 4 * 60 * 60 * 1000);
  const timeLabel = realTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const events = [];
  if (time > 50)  events.unshift({ msg: "Both riders start their shift.", type: "neutral" });
  if (time > 200) events.unshift({ msg: "Order 1 completed. Heat increasing.", type: "neutral" });
  if (time > 400) events.unshift({ msg: "Baseline rider approaching dangerous heat levels.", type: "danger" });
  if (time > 440) events.unshift({ msg: "AWS Location Service: Rider entered Rest Zone Geofence.", type: "aws" });
  if (time > 450) events.unshift({ msg: "HeatBudget AI intercepts! Rider diverted to rest point for 20 mins.", type: "safe" });
  if (time > 500) events.unshift({ msg: "HeatBudget rider earning ₹40 Pause Pay while resting in shade.", type: "safe" });
  if (time > 650) events.unshift({ msg: "HeatBudget rider fully recovered. Resuming deliveries.", type: "safe" });
  if (time > 850) events.unshift({ msg: "Baseline rider hits 100% critical heat dose. Medical risk high.", type: "danger" });
  if (time > 860) events.unshift({ msg: "AWS SNS Triggered: High-priority medical alert sent to Fleet Manager.", type: "aws" });
  if (time >= 990) events.unshift({ msg: "Shift ended.", type: "neutral" });

  return (
    <section className="live-comparison">
      <div className="top-bar-new">
        <div className="title-area">
          <h2>Rider Journey Comparison</h2>
          <p className="subtitle-note">Focusing on a single rider's 4-hour afternoon shift in Pune (12 PM - 4 PM).</p>
        </div>
        <div className="clock-bar-new">
          <button onClick={() => setPlaying(v => !v)} className="play-btn">
            {playing ? <Pause size={16}/> : <Play size={16} fill="currentColor"/>}
            {playing ? "Pause" : "Play Sim"}
          </button>
          <button onClick={() => setTime(0)} className="scenario-btn">
            <RefreshCw size={14}/> Reset
          </button>
          <strong className="clock-time">{timeLabel}</strong>
          <span className="temp-chip">🌡 42.0°C Peak</span>
        </div>
      </div>

      <div className="hero-strip">
        <div className="hero-metric">
          <span className="metric-label"><ThermometerSun size={14} style={{verticalAlign:"middle", marginRight:4}}/> Heat Dose</span>
          <div className="hero-metric-values">
            <div className="b-val">
              <small>Baseline</small>
              <strong style={{color: doseColor(bDose)}}>{Math.round(bDose)}%</strong>
            </div>
            <div className="h-val">
              <small>HeatBudget</small>
              <strong style={{color: doseColor(hDose)}}>{Math.round(hDose)}%</strong>
            </div>
          </div>
        </div>

        <div className="hero-metric">
          <span className="metric-label"><Wallet size={14} style={{verticalAlign:"middle", marginRight:4}}/> Total Earnings</span>
          <div className="hero-metric-values">
            <div className="b-val"><small>Baseline</small><strong>₹{bEarnings}</strong></div>
            <div className="h-val"><small>HeatBudget (Inc. Pause Pay)</small><strong style={{color:"#16805f"}}>₹{hTotalEarnings}</strong></div>
          </div>
        </div>

        <div className="hero-metric">
          <span className="metric-label"><ShieldCheck size={14} style={{verticalAlign:"middle", marginRight:4}}/> Status</span>
          <div className="hero-metric-values">
            <div className="b-val"><small>Baseline</small><strong style={{fontSize:16, color: bDose >= 100 ? "#cf5543" : "#596b7f", marginTop:4}}>{bStatus}</strong></div>
            <div className="h-val"><small>HeatBudget</small><strong style={{fontSize:16, color: isResting ? "#1a73e8" : "#16805f", marginTop:4}}>{hStatus}</strong></div>
          </div>
        </div>
      </div>

      <div className="dual-map" style={{ gridTemplateColumns: "1fr 1fr", height: "400px", marginBottom: "20px" }}>
        <SingleSimMap mode="BASELINE" time={time} dose={bDose} isResting={false} routes={routes} />
        <SingleSimMap mode="HEATBUDGET" time={time} dose={hDose} isResting={isResting} routes={routes} awsStatus={awsStatus} />
      </div>

      <div className="live-bottom">
        <div className="chart-area">
          <p>Rider Heat Dose Over Shift (12 PM - 4 PM)</p>
          <svg viewBox="0 0 500 120" className="main-svg-chart" style={{ height: 160 }}>
            <line x1="30" y1="10" x2="480" y2="10" stroke="#f0f0f0" strokeWidth="1"/>
            <line x1="30" y1="60" x2="480" y2="60" stroke="#f0f0f0" strokeWidth="1"/>
            <line x1="30" y1="110" x2="480" y2="110" stroke="#eee" strokeWidth="1"/>
            <text x="25" y="14" fontSize="10" fill="#bbb" textAnchor="end">100%</text>
            <text x="25" y="64" fontSize="10" fill="#bbb" textAnchor="end">50%</text>
            <text x="25" y="114" fontSize="10" fill="#bbb" textAnchor="end">0%</text>
            
            <rect x="30" y="10" width="450" height="20" fill="#cf5543" opacity="0.05" />

            <polyline 
              points={`30,110 ${30 + (time/1000)*450},${Math.max(10, 110 - bDose)}`}
              fill="none" stroke="#8897a3" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 6"/>
            
            <path d={`M 30 110 
              ${time > 450 ? `L ${30 + 450/1000*450} ${110 - 40.5}` : `L ${30 + (time/1000)*450} ${110 - hDose}`}
              ${time > 650 ? `L ${30 + 650/1000*450} ${110 - 10.5}` : (time > 450 ? `L ${30 + (time/1000)*450} ${110 - hDose}` : '')}
              ${time > 650 ? `L ${30 + (time/1000)*450} ${110 - hDose}` : ''}
            `} fill="none" stroke="#16805f" strokeWidth="3" strokeLinecap="round" />
            
            {hasStarted && <circle cx={30 + (time/1000)*450} cy={Math.max(10, 110 - bDose)} r="4" fill="#8897a3" />}
            {hasStarted && <circle cx={30 + (time/1000)*450} cy={110 - hDose} r="4" fill="#16805f" />}
          </svg>
          <div className="chart-legend" style={{ marginTop: 12 }}>
            <span style={{color:"#8897a3"}}>— Baseline (Straight to Heatstroke)</span>
            <span style={{color:"#16805f"}}>— HeatBudget (Intervenes & Cools Down)</span>
          </div>
        </div>

        <aside className="event-feed">
          <p className="eyebrow">STORY LOG</p>
          {events.length > 0 ? events.map((ev, i) => (
            <p key={i} className={`event-${ev.type}`}>
              <i style={{ background: ev.type === "danger" ? "#cf5543" : ev.type === "safe" ? "#16805f" : ev.type === "aws" ? "#ff9900" : "#bbb" }}/>
              {ev.msg}
            </p>
          )) : <p className="event-idle">Press Play Sim to begin the story.</p>}
        </aside>
      </div>
    </section>
  );
};
