import { AlertTriangle, Clock3, MapPin, Pause, Play, Radio, RefreshCw, Settings, ShieldCheck, TrendingDown, TrendingUp } from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { CircleMarker, MapContainer, Polyline, Popup, Rectangle, TileLayer } from "react-leaflet";
import L from "leaflet";
import type { Comparison, ComparisonSummary, DeliveryRoute, DispatchMapData } from "./types";
import "leaflet/dist/leaflet.css";
import "./LiveComparison.css";

type Mode = "BASELINE" | "HEAT_AWARE";
const startTime = new Date("2026-05-01T05:30:00Z").getTime();
const endTime   = startTime + 16 * 60 * 60 * 1000;
const warningDose = 80;
const puneCenter: [number, number] = [18.527, 73.86];
const canvasRenderer = L.canvas({ padding: 0.5 });

const doseColor  = (dose: number) => dose >= warningDose ? "#cf5543" : dose >= 50 ? "#d99543" : "#16805f";
const completedAt= (r: DeliveryRoute, t: number) => new Date(r.completedAt).getTime() < t;

const riderDosesAt = (assignments: Comparison["baseline"]["assignments"], time: number) => {
  const latestByRider = new Map<string, Comparison["baseline"]["assignments"][number]>();
  for (const assignment of assignments) {
    if (new Date(assignment.completedAt).getTime() > time) continue;
    const previous = latestByRider.get(assignment.riderId);
    if (!previous || new Date(assignment.completedAt).getTime() > new Date(previous.completedAt).getTime()) {
      latestByRider.set(assignment.riderId, assignment);
    }
  }
  return new Map([...latestByRider].map(([riderId, assignment]) => [riderId, assignment.doseAfter]));
};

const ridersEverAtWarning = (assignments: Comparison["baseline"]["assignments"]) => {
  const maximumDoseByRider = new Map<string, number>();
  for (const assignment of assignments) {
    maximumDoseByRider.set(assignment.riderId, Math.max(maximumDoseByRider.get(assignment.riderId) ?? 0, assignment.doseAfter));
  }
  return [...maximumDoseByRider.values()].filter(dose => dose >= warningDose).length;
};

const getTemp = (time: number) => {
  const hour = (new Date(time).getUTCHours() + 5.5) % 24;
  if (hour < 9 || hour >= 20) return 25;
  if (hour < 11 || hour >= 17) return 29;
  return 34;
};

const SimMap = memo(({ mode, data, selectRider,
}: {
  mode: Mode; data: DispatchMapData;
  selectRider: (id: string) => void;
}) => {
  const isBaseline = mode === "BASELINE";
  const wbgt       = getTemp(startTime);
  const heatColor  = wbgt >= 40 ? "#df7850" : wbgt >= 35 ? "#e6b44f" : "#76b994";
  const hasOsmSource = data.restPointStatus === "LIVE_OSM" || data.restPointStatus === "STALE_OSM";
  const restCandidates = hasOsmSource ? data.restPoints : [];
  const wards: [[number,number],[number,number]][] = [
    [[18.45,73.73],[18.53,73.82]], [[18.45,73.82],[18.53,73.91]],
    [[18.45,73.91],[18.53,74]],    [[18.53,73.73],[18.61,73.82]],
    [[18.53,73.82],[18.61,73.91]], [[18.53,73.91],[18.61,74]],
  ];

  const latestByRider   = new Map<string, DeliveryRoute>();
  data.deliveries.forEach(r => latestByRider.set(r.riderId, r));
  const visibleRiders = data.riders.slice(0, 50);
  const restLabel       = mode !== "HEAT_AWARE" ? "No heat-aware intervention"
    : !hasOsmSource ? "OSM candidates unavailable"
      : `${restCandidates.length} ${data.restPointStatus === "STALE_OSM" ? "cached " : ""}OSM candidates · unverified`;

  return (
    <article className={`sim-map-card ${isBaseline ? "baseline-card" : "heatbudget-card"}`}>
      {/* colour-coded header tells the story immediately */}
      <header className={isBaseline ? "map-header-baseline" : "map-header-heatbudget"}>
        <div className="map-header-left">
          {isBaseline
            ? <><AlertTriangle size={15}/> <span>Baseline — Nearest Rider</span></>
            : <><ShieldCheck   size={15}/> <span>Pause Pay — Heat-Aware Scoring</span></>}
        </div>
        <div className="map-header-right">
          <span className={isBaseline ? "danger-badge" : "safe-badge"}>
            {isBaseline ? "Nearest-rider strategy" : restLabel}
          </span>
          <span className="wbgt-pill">{wbgt.toFixed(1)}°C</span>
        </div>
      </header>

      <div style={{ position: "relative" }}>
        <MapContainer center={puneCenter} zoom={12} className="sim-map" scrollWheelZoom attributionControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {/* heat-zone ward overlays */}
          {wards.map((b, i) =>
            <Rectangle key={i} bounds={b} pathOptions={{ color: "transparent", fillColor: heatColor, fillOpacity: 0.12 + i * 0.02 }} />
          )}

          {/* ── BASELINE: direct routes (gray), no intervention ── */}
          {isBaseline && data.deliveries.map(r =>
            <Polyline key={r.orderId}
              positions={[[r.pickup.latitude, r.pickup.longitude],[r.dropoff.latitude, r.dropoff.longitude]]}
              pathOptions={{ color: "#8897a3", weight: 2.5, opacity: 0.55, dashArray: "4 4" }}
            />
          )}

          {/* Route lines show the generated pickup-to-dropoff assignment, not street geometry. */}
          {!isBaseline && data.deliveries.map(r => {
            const rider = data.riders.find(rd => rd.riderId === r.riderId);
            const col   = rider && rider.dose >= 80 ? "#cf5543" : "#16805f";
            return (
              <Polyline key={r.orderId}
                positions={[[r.pickup.latitude, r.pickup.longitude],[r.dropoff.latitude, r.dropoff.longitude]]}
                pathOptions={{ color: col, weight: 3.5, opacity: 0.88 }}
              />
            );
          })}

          {/* ── HEATBUDGET only: rest point markers ── */}
          {!isBaseline && restCandidates.map(p =>
            <CircleMarker key={p.id}
              center={[p.location.latitude, p.location.longitude]}
              radius={8}
              renderer={canvasRenderer}
              pathOptions={{ color: "#0b57d0", fillColor: "#7db5ea", fillOpacity: 1, weight: 3 }}
            >
              <Popup><strong>{p.name}</strong><br />{p.category} · OSM candidate, not verified<br /><a href={p.osmUrl} target="_blank" rel="noreferrer">OpenStreetMap</a></Popup>
            </CircleMarker>
          )}

          {/* rider dots — same logic both sides, judge sees colour difference */}
          {visibleRiders.map(rider => {
            const route  = latestByRider.get(rider.riderId);
            const dose = rider.dose;
            const center: [number,number] = route
              ? [route.dropoff.latitude, route.dropoff.longitude]
              : [rider.location.latitude, rider.location.longitude];
            const hot    = dose >= warningDose;
            return (
              <CircleMarker key={rider.riderId} center={center}
                radius={hot ? 8 : 5}
                renderer={canvasRenderer}
                eventHandlers={{ click: () => selectRider(rider.riderId) }}
                pathOptions={{ color: "#fff", fillColor: doseColor(dose), fillOpacity: 0.95, weight: hot ? 2.5 : 1 }}
              />
            );
          })}
        </MapContainer>

        {/* colour-coded legend */}
        <div className="map-legend">
          <span><i style={{ background: "#16805f" }}/> Safe</span>
          <span><i style={{ background: "#d99543" }}/> Warm</span>
          <span><i style={{ background: "#cf5543" }}/> Danger</span>
          {!isBaseline && <span><i style={{ background: "#1a73e8", borderRadius: 2 }}/> Rest point</span>}
        </div>
        {!isBaseline && <div className="rest-point-note">Blue markers are OSM-mapped candidates, not verified rider rest facilities.</div>}
      </div>
    </article>
  );
});

// ── delta pill: shows improvement direction clearly ───────────────────────────
const DeltaPill = ({ baseline, heat, lowerIsBetter }: { baseline: number; heat: number; lowerIsBetter: boolean }) => {
  const delta    = heat - baseline;
  const improved = lowerIsBetter ? delta < 0 : delta > 0;
  const pct      = baseline !== 0 ? Math.abs(delta / baseline * 100).toFixed(0) : "—";
  if (delta === 0) return <span className="delta-pill neutral">same</span>;
  return (
    <span className={`delta-pill ${improved ? "better" : "worse"}`}>
      {improved ? <TrendingDown size={12}/> : <TrendingUp size={12}/>}
      {baseline === 0 ? `${Math.abs(delta)} ${lowerIsBetter ? (improved ? "fewer" : "more") : (improved ? "more" : "less")}` : `${pct}% ${improved ? "better" : "worse"}`}
    </span>
  );
};

export const LiveComparison = ({
  language, setPage, setSelectedRiderId,
}: {
  language: "en" | "hi"; setPage: (p: "compare" | "rider" | "reports" | "map") => void; setSelectedRiderId: (id: string) => void;
}) => {
  const [seed,          setSeed]          = useState("440026");
  const [speed,         setSpeed]         = useState(60);
  const [playing,       setPlaying]       = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [time,          setTime]          = useState(startTime);
  const [baseline,      setBaseline]      = useState<DispatchMapData | null>(null);
  const [heatAware,     setHeatAware]     = useState<DispatchMapData | null>(null);
  const [comparison,    setComparison]    = useState<Comparison | null>(null);
  const [error,         setError]         = useState<string | null>(null);
  const [streamStatus,  setStreamStatus]  = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [lastUpdated,   setLastUpdated]   = useState<string | null>(null);
  const [showScenario,  setShowScenario]  = useState(false);
  const [handledActions,setHandledActions]= useState<Record<string, "break" | "keep">>({});
  const [actionNotice,  setActionNotice]  = useState<string | null>(null);
  const timeRef = useRef(time);
  timeRef.current = time;

  const reset = async () => {
    const parsedSeed = Number(seed);
    if (!Number.isSafeInteger(parsedSeed) || parsedSeed < 0) {
      setError("Enter a non-negative whole-number seed.");
      return;
    }
    setError(null); setLoading(true); setPlaying(false); setTime(startTime); setHandledActions({}); setActionNotice(null);
    try {
      const [br, hr, cr] = await Promise.all([
        fetch(`/api/v1/dispatch/map?seed=${parsedSeed}&mode=BASELINE&limit=100`),
        fetch(`/api/v1/dispatch/map?seed=${parsedSeed}&mode=HEAT_AWARE&limit=100`),
        fetch(`/api/v1/dispatch/compare?seed=${parsedSeed}`, { method: "POST" }),
      ]);
      if (![br,hr,cr].every(r => r.ok)) throw new Error("The dispatch API could not load this comparison.");
      setBaseline(await br.json() as DispatchMapData);
      setHeatAware(await hr.json() as DispatchMapData);
      setComparison(await cr.json() as Comparison);
      setLastUpdated(new Date().toISOString());
    } catch (e) { setError(e instanceof Error ? e.message : "The dispatch API could not load this comparison."); }
    finally { setLoading(false); }
  };

  useEffect(() => { void reset(); }, []);
  useEffect(() => {
    const stream = new EventSource("/api/v1/dispatch/events");
    stream.addEventListener("connected", () => setStreamStatus("connected"));
    stream.addEventListener("dispatch-comparison", (event) => {
      try {
        const update = JSON.parse((event as MessageEvent<string>).data) as ComparisonSummary;
        setComparison(current => current ? {
          baseline: { ...current.baseline, seed: update.seed, metrics: update.baseline },
          heatAware: { ...current.heatAware, seed: update.seed, metrics: update.heatAware },
        } : current);
        setLastUpdated(update.generatedAt);
        setStreamStatus("connected");
      } catch {
        setStreamStatus("disconnected");
      }
    });
    stream.onerror = () => setStreamStatus("disconnected");
    return () => stream.close();
  }, []);
  useEffect(() => {
    if (!playing) return;
    const startedAt = Date.now();
    const startSimulationAt = timeRef.current;
    const replayDuration = endTime - startTime;
    const id = window.setInterval(() => {
      const simulatedElapsed = (Date.now() - startedAt) / 700 * speed * 60_000;
      const position = (startSimulationAt - startTime + simulatedElapsed) % replayDuration;
      setTime(startTime + position);
    }, 250);
    return () => window.clearInterval(id);
  }, [playing, speed]);

  const doneBaseline  = baseline?.deliveries.filter(r  => completedAt(r, time)) ?? [];
  const doneHeat      = heatAware?.deliveries.filter(r => completedAt(r, time)) ?? [];
  const hasOsmSource = heatAware?.restPointStatus === "LIVE_OSM" || heatAware?.restPointStatus === "STALE_OSM";
  const restCandidates = hasOsmSource ? heatAware?.restPoints ?? [] : [];
  const baselineDoseAt = comparison ? riderDosesAt(comparison.baseline.assignments, time) : new Map<string, number>();
  const heatDoseAt = comparison ? riderDosesAt(comparison.heatAware.assignments, time) : new Map<string, number>();
  const overBaseline = [...baselineDoseAt.values()].filter(dose => dose >= warningDose).length;
  const overHeat = [...heatDoseAt.values()].filter(dose => dose >= warningDose).length;
  const baselinePeak = comparison ? ridersEverAtWarning(comparison.baseline.assignments) : 0;
  const heatPeak = comparison ? ridersEverAtWarning(comparison.heatAware.assignments) : 0;
  const events        = doneHeat.slice(-5).reverse();
  const timeLabel     = new Date(time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
  const hasStarted    = time > startTime;

  const bEarn  = comparison?.baseline.metrics.deliveryEarnings ?? 0;
  const hEarn  = comparison?.heatAware.metrics.deliveryEarnings ?? 0;
  const bLate  = comparison?.baseline.metrics.completedOrders
    ? comparison.baseline.metrics.lateDeliveries / comparison.baseline.metrics.completedOrders * 100 : 0;
  const hLate  = comparison?.heatAware.metrics.completedOrders
    ? comparison.heatAware.metrics.lateDeliveries / comparison.heatAware.metrics.completedOrders * 100 : 0;
  const timeline = Array.from({ length: 17 }, (_, hour) => {
    const checkpoint = startTime + hour * 60 * 60 * 1000;
    return {
      label: new Date(checkpoint).toLocaleTimeString("en-IN", { hour: "2-digit", timeZone: "Asia/Kolkata" }),
      baseline: baseline?.deliveries.filter(route => new Date(route.completedAt).getTime() <= checkpoint).length ?? 0,
      heatAware: heatAware?.deliveries.filter(route => new Date(route.completedAt).getTime() <= checkpoint).length ?? 0,
    };
  });
  const maxTimeline = Math.max(1, ...timeline.flatMap(point => [point.baseline, point.heatAware]));
  const timelinePoints = (key: "baseline" | "heatAware") => timeline.map((point, index) =>
    `${(index / (timeline.length - 1)) * 400},${90 - point[key] / maxTimeline * 78}`
  ).join(" ");
  const interventionQueue = (heatAware?.deliveries ?? [])
    .filter(route => route.doseAfter >= 80 || route.heatLimitOverride)
    .sort((a, b) => b.doseAfter - a.doseAfter)
    .slice(0, 4);
  const takeAction = (route: DeliveryRoute, action: "break" | "keep") => {
    setHandledActions(current => ({ ...current, [route.orderId]: action }));
    setActionNotice(action === "break"
      ? `Demo rest request recorded for rider ${route.riderId.slice(0, 6)}. No notification was sent.`
      : `Demo review recorded for order ${route.orderId.slice(0, 6)}. No dispatch action was sent.`);
  };
  const selectRider = useCallback((id: string) => {
    setSelectedRiderId(id);
    setPage("rider");
  }, [setPage, setSelectedRiderId]);

  return (
    <section className="live-comparison">
      {/* ── toolbar ── */}
      <div className="top-bar-new">
        <div className="title-area">
          <h2>Seeded dispatch replay</h2>
          <p className="subtitle-note">Pune · Spring Boot dispatch results · Seed {seed}{lastUpdated ? ` · Updated ${new Date(lastUpdated).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })}` : ""}</p>
        </div>
        <div className="clock-bar-new">
          <button onClick={() => setPlaying(v => !v)} className="play-btn" disabled={loading || !baseline || !heatAware}>
            {playing ? <Pause size={16}/> : <Play size={16} fill="currentColor"/>}
            {playing ? "Pause replay" : "Replay API results"}
          </button>
          <button onClick={() => { void reset(); }} className="rerun-btn" disabled={loading}>
            <RefreshCw size={15} className={loading ? "refresh-spinning" : ""} />
            {loading ? "Running API comparison…" : "Run comparison"}
          </button>
          <div className="speed-ctrls">
            {[1,10,60].map(v => <button key={v} className={speed===v?"active":""} onClick={()=>setSpeed(v)}>{v}×</button>)}
          </div>
          <strong className="clock-time">{timeLabel}</strong>
          <span className="temp-chip">Simulated WBGT {getTemp(time)}°C</span>
          <span className={`stream-status ${streamStatus}`}><i /> API stream {streamStatus}</span>
          <div className="scenario-popover-container">
            <button className="scenario-btn" onClick={() => setShowScenario(s => !s)}>
              <Settings size={15}/> Seed
            </button>
            {showScenario && (
              <div className="scenario-popover">
                <label>Scenario seed<input inputMode="numeric" value={seed} onChange={e => setSeed(e.target.value)}/></label>
                <button onClick={() => { void reset(); setShowScenario(false); }}>Load seed</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── hero metrics ── */}
      <div className="hero-strip">
        <div className="hero-metric">
          <span className="metric-label">🔴 Riders at 80% warning dose · replay time</span>
          <div className="hero-metric-values">
            <div className="b-val">
              <small>Baseline</small>
              <strong>{comparison ? overBaseline : "—"}</strong>
            </div>
            <div className="h-val">
              <small>Pause Pay</small>
              <strong>{comparison ? overHeat : "—"}</strong>
            </div>
          </div>
          {comparison && <DeltaPill baseline={overBaseline} heat={overHeat} lowerIsBetter/>}
          <p className="risk-metric-note">Current count follows replay time. Peak this run: Baseline {baselinePeak} · Pause Pay {heatPeak}</p>
        </div>

        <div className="hero-metric">
          <span className="metric-label">💰 Delivery earnings · full run</span>
          <div className="hero-metric-values">
            <div className="b-val"><small>Baseline total</small><strong>{comparison ? `₹${Math.round(bEarn).toLocaleString("en-IN")}` : "—"}</strong></div>
            <div className="h-val"><small>Pause Pay total</small><strong>{comparison ? `₹${Math.round(hEarn).toLocaleString("en-IN")}` : "—"}</strong></div>
          </div>
          {comparison && <DeltaPill baseline={bEarn} heat={hEarn} lowerIsBetter={false}/>}
        </div>

        <div className="hero-metric">
          <span className="metric-label">⏰ Late deliveries</span>
          <div className="hero-metric-values">
              <div className="b-val"><small>Baseline</small><strong>{comparison ? `${bLate.toFixed(1)}%` : "—"}</strong></div>
              <div className="h-val"><small>Pause Pay</small><strong>{comparison ? `${hLate.toFixed(1)}%` : "—"}</strong></div>
          </div>
            {comparison && <DeltaPill baseline={bLate} heat={hLate} lowerIsBetter/>}
        </div>
      </div>

      {/* ── pre-play explainer (only shown before play) ── */}
      {!hasStarted && (
        <div className="explainer-strip">
          <div className="explainer-item baseline-ex">
            <AlertTriangle size={16}/> <strong>Baseline:</strong> Direct nearest-rider assignments from the API; no heat-aware intervention.
          </div>
          <div className="explainer-item heatbudget-ex">
            <ShieldCheck size={16}/> <strong>Pause Pay:</strong> API assignments scored against estimated heat dose, with pause credits and soft-limit tracking.
          </div>
        </div>
      )}

      {error && <p className="error">{error}</p>}

      {heatAware && (
        <section className="operations-board" aria-label="Live dispatch actions">
          <div className="operations-heading">
            <div>
              <p className="eyebrow"><Radio size={13}/> SEEDED API SIMULATION</p>
              <h3>Replay-derived intervention review</h3>
              <p>Flagged routes come from the first 100 API assignments. Review actions below stay in this browser demo and do not contact riders.</p>
            </div>
            <span className={`sync-status ${streamStatus}`}><span/> Comparison stream: {streamStatus}</span>
          </div>
          {actionNotice && <div className="action-notice">{actionNotice}</div>}
          <div className="operations-grid">
            <div className="intervention-queue">
              <div className="panel-title"><strong>Flagged in replay preview</strong><span>{interventionQueue.length} flagged</span></div>
              {interventionQueue.length ? interventionQueue.map(route => {
                const action = handledActions[route.orderId];
                return <article className={action ? "queue-row handled" : "queue-row"} key={route.orderId}>
                  <div className="risk-score">{Math.round(route.doseAfter)}<small>dose</small></div>
                  <div className="queue-copy">
                    <strong>Rider {route.riderId.slice(0, 6)} · Order {route.orderId.slice(0, 6)}</strong>
                    <span><Clock3 size={12}/> {Math.round(route.deliveryFee)} min value · heat limit {route.heatLimitOverride ? "overridden" : "reached"}</span>
                  </div>
                  {action ? <span className={`action-state ${action}`}>{action === "break" ? "Break sent" : "Reviewed"}</span> : <div className="queue-actions">
                    <button className="send-break" onClick={() => takeAction(route, "break")}>Record demo rest request</button>
                    <button className="keep-assignment" onClick={() => takeAction(route, "keep")}>Mark reviewed</button>
                  </div>}
                </article>;
              }) : <p className="queue-empty">No riders are above the intervention threshold.</p>}
            </div>
            <aside className="hub-roster">
              <div className="panel-title"><strong>OSM candidates · not verified</strong><span>{!hasOsmSource ? "unavailable" : heatAware.restPointStatus === "STALE_OSM" ? "cached" : `${restCandidates.length} mapped`}</span></div>
              {restCandidates.map(point => <div className="hub-row" key={point.id}>
                <MapPin size={14}/><span><strong>{point.name}</strong><small>{point.category} · <a href={point.osmUrl} target="_blank" rel="noreferrer">OpenStreetMap</a></small></span>
              </div>)}
              {!restCandidates.length && <p className="queue-empty">No mapped candidate points available right now. These locations are not verified rider facilities.</p>}
            </aside>
          </div>
        </section>
      )}

      {baseline && heatAware && comparison ? (
        <>
          {/* ── dual maps ── */}
          <div className="dual-map">
            <SimMap mode="BASELINE" data={baseline} selectRider={selectRider} />
            <SimMap mode="HEAT_AWARE" data={heatAware} selectRider={selectRider} />
          </div>

          {/* ── map key below maps ── */}
          <div className="map-key-row">
            <span><i style={{background:"#8897a3", display:"inline-block", width:20, height:3, borderRadius:2, verticalAlign:"middle"}}/> Baseline direct route</span>
            <span><i style={{background:"#16805f", display:"inline-block", width:20, height:3, borderRadius:2, verticalAlign:"middle"}}/> Pause Pay assignment</span>
            <span>Lines are straight assignment previews, not road routes.</span>
            <span>Maps show API route samples and 50 rider markers. Warning counts and charts follow the replay clock.</span>
          </div>

          {/* ── bottom: chart + event feed ── */}
          <div className="live-bottom">
            <div className="chart-area">
              <p>Cumulative completed assignments · API map preview (up to 100 per strategy)</p>
              <svg viewBox="0 0 400 100" className="main-svg-chart" role="img" aria-label="Cumulative completed assignments by hour, calculated from API route timestamps">
                <line x1="0" y1="90" x2="400" y2="90" stroke="#e5ece8" strokeWidth="1"/>
                <line x1="0" y1="51" x2="400" y2="51" stroke="#e5ece8" strokeWidth="1" strokeDasharray="3 4"/>
                <line x1="0" y1="12" x2="400" y2="12" stroke="#e5ece8" strokeWidth="1" strokeDasharray="3 4"/>
                <polyline points={timelinePoints("baseline")} fill="none" stroke="#596b7f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points={timelinePoints("heatAware")} fill="none" stroke="#16805f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                {timeline.filter((_, index) => index % 4 === 0).map((point, index) => <text key={point.label} x={index * 100} y="99" fontSize="8" fill="#70847b">{point.label}</text>)}
              </svg>
              <div className="chart-legend">
                <span style={{color:"#596b7f"}}>— Baseline completed</span>
                <span style={{color:"#16805f"}}>— Pause Pay completed</span>
              </div>
              <p className="chart-footnote">Playback time: {timeLabel} · {doneBaseline.length} baseline and {doneHeat.length} Pause Pay routes completed in the visible preview.</p>
            </div>

            <aside className="event-feed">
              <p className="eyebrow">REPLAY EVENTS</p>
              {hasStarted
                ? events.map(r => (
                    <p key={r.orderId} className={r.doseAfter >= 80 ? "event-danger" : "event-ok"}>
                      <i/>
                      {r.doseAfter >= 80
                        ? `Rider #${r.riderId.slice(0,5)} reached ${Math.round(r.doseAfter)}% dose in the API result.`
                        : `Order #${r.orderId.slice(0,5)} completed at ${new Date(r.completedAt).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })}.`}
                    </p>
                  ))
                : <p className="event-idle">Start replay to inspect timestamped API assignments.</p>
              }
            </aside>
          </div>
        </>
      ) : (
        <div className="map-loading">Loading simulation data…</div>
      )}
    </section>
  );
};
