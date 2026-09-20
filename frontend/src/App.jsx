import L from "leaflet";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";

const FUNCTION_URL =
  "https://k2m2gxex4ccsttgrpspspljq5m0ypfyq.lambda-url.us-east-1.on.aws/";
const DEED_BASE_URL =
  "https://gis-land-parcels-gayatri.s3.us-east-1.amazonaws.com/deeds_docs";

// Map IDs shown on the map -> file IDs used in S3 / Lambda
// AP-MAR-006 -> 28065010041006 (works for every parcel number)
function toS3Id(id) {
  const match = /^AP-MAR-(\d+)$/i.exec(String(id).trim());
  return match ? "28065010041" + match[1].padStart(3, "0") : String(id);
}

function FitParcels({ data }) {
  const map = useMap();

  useEffect(() => {
    if (!data?.features?.length) return;

    const layer = L.geoJSON(data);
    const bounds = layer.getBounds();

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [data, map]);

  return null;
}

// Deed PDF link + AI scan. Has its own state so the map does not reset.
function ParcelTools({ ulpin: mapUlpin }) {
  const ulpin = toS3Id(mapUlpin);
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanError, setScanError] = useState("");

  async function runScan() {
    setLoading(true);
    setScan(null);
    setScanError("");

    try {
      const res = await fetch(
        `${FUNCTION_URL}?ulpin=${encodeURIComponent(ulpin)}`
      );
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Scan failed");
      }
      setScan(data.scan_result);
    } catch (err) {
      setScanError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: "16px" }}>
      <p>
        <a
          href={`${DEED_BASE_URL}/${ulpin}_deed.pdf`}
          target="_blank"
          rel="noreferrer"
        >
          📄 View deed PDF
        </a>
      </p>

      <button className="btn-primary" onClick={runScan} disabled={loading}>
        {loading ? "Scanning imagery..." : "Run AI encroachment scan"}
      </button>

      {scanError && <p className="error">{scanError}</p>}

      {scan && (
        <div style={{ marginTop: "12px" }}>
          <p>
            <strong>
              {scan.encroachment_detected
                ? "⚠️ Encroachment detected"
                : "✅ No encroachment detected"}
            </strong>{" "}
            (confidence: {scan.confidence})
          </p>
          <p>{scan.summary}</p>
        </div>
      )}
    </div>
  );
}

function App() {
  const [page, setPage] = useState("home");
  const [role, setRole] = useState("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [parcels, setParcels] = useState(null);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/parcels.geojson")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Could not load parcels.geojson");
        }
        return response.json();
      })
      .then(setParcels)
      .catch((err) => setError(err.message));
  }, []);

  const features = parcels?.features || [];

  const filtered = features.filter((feature) =>
    JSON.stringify(feature.properties || {})
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  function login(event) {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    setError("");
    setPage(role === "officer" ? "officer" : "user");
  }

  function logout() {
    setEmail("");
    setPassword("");
    setSelected(null);
    setPage("home");
  }

  function getValue(properties, keys) {
    for (const key of keys) {
      if (properties?.[key] != null) {
        return properties[key];
      }
    }
    return "Not available";
  }

  function MapView() {
    return (
      <div className="map-wrapper">
        <MapContainer
          center={[16.5062, 80.648]}
          zoom={13}
          scrollWheelZoom
          className="map"
        >
          <TileLayer
            attribution="Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />

          {parcels && (
            <>
              <GeoJSON
                key={search}
                data={{
                  ...parcels,
                  features: filtered,
                }}
                style={{
                  color: "#facc15",
                  weight: 2,
                  fillColor: "#22c55e",
                  fillOpacity: 0.25,
                }}
                onEachFeature={(feature, layer) => {
                  const properties = feature.properties || {};

                  layer.bindTooltip(
                    String(
                      getValue(properties, [
                        "ULPIN",
                        "ulpin",
                        "parcel_id",
                        "id",
                      ])
                    )
                  );

                  layer.on("click", (e) => {
                    const clickedLayer = e.target;
                    const map = clickedLayer._map;

                    setSelected(clickedLayer.feature?.properties || {});

                    if (map && clickedLayer.getBounds) {
                      const bounds = clickedLayer.getBounds();

                      map.fitBounds(bounds, {
                        padding: [20, 20],
                        maxZoom: 22,
                        animate: true,
                      });

                      map.once("moveend", () => {
                        if (map.getZoom() < 18) {
                          map.setZoom(18);
                        }
                      });
                    }
                  });
                }}
              />

              <FitParcels data={parcels} />
            </>
          )}
        </MapContainer>
      </div>
    );
  }

  function Dashboard({ officer = false }) {
    const selectedUlpin = selected
      ? getValue(selected, ["ULPIN", "ulpin", "parcel_id", "id"])
      : null;

    return (
      <div className="app">
        <header className="header">
          <div className="brand">
            <span className="brand-icon">B</span>
            <div>
              <h1>Bhoomi Setu</h1>
              <p>{officer ? "Officer Portal" : "Citizen Portal"}</p>
            </div>
          </div>
          <button onClick={logout} className="btn-outline">
            Log out
          </button>
        </header>

        <main className="main">
          <section className="intro">
            <p className="eyebrow">
              {officer ? "ADMINISTRATION" : "CITIZEN SERVICES"}
            </p>
            <h2>{officer ? "Officer Dashboard" : "User Dashboard"}</h2>
            <p className="subtitle">
              {officer
                ? "Explore parcels and review land information."
                : "Explore land parcels and view available information."}
            </p>
          </section>

          <section className="stats">
            <div className="stat-card">
              <span>Total parcels</span>
              <strong>{features.length}</strong>
            </div>
            <div className="stat-card">
              <span>Matching parcels</span>
              <strong>{filtered.length}</strong>
            </div>
            <div className="stat-card">
              <span>Portal</span>
              <strong>{officer ? "Officer" : "Citizen"}</strong>
            </div>
          </section>

          <section className="dashboard">
            <div className="map-heading">
              <div>
                <h3>Satellite Land Map</h3>
                <p>Vijayawada, Andhra Pradesh</p>
              </div>
              <span className="map-badge">Satellite imagery</span>
            </div>

            <div className="map-toolbar">
              <input
                placeholder="Search parcel details..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setSelected(null);
                }}
              />
              <span>{filtered.length} parcels</span>
            </div>

            {error && <p className="error">{error}</p>}
            {!parcels && !error && <p>Loading parcel data...</p>}

            <MapView />

            {selected && (
              <div className="parcel-details">
                {selectedUlpin !== "Not available" && (
                  <ParcelTools
                    key={String(selectedUlpin)}
                    ulpin={String(selectedUlpin)}
                  />
                )}
              </div>
            )}
          </section>
        </main>
      </div>
    );
  }

  if (page === "user") return <Dashboard />;
  if (page === "officer") return <Dashboard officer />;

  if (page === "login") {
    return (
      <div className="auth-page">
        <header className="header">
          <h1 onClick={() => setPage("home")}>Bhoomi Setu</h1>
          <button className="btn-outline" onClick={() => setPage("home")}>
            Back home
          </button>
        </header>

        <form className="login-card" onSubmit={login}>
          <p className="eyebrow">SECURE PORTAL</p>
          <h2>Welcome back</h2>
          <p>Choose your portal and enter your login details.</p>

          <label>Login as</label>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            <option value="user">Citizen / User</option>
            <option value="officer">Government Officer</option>
          </select>

          <label>Email address</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {error && <p className="error">{error}</p>}

          <button className="btn-primary" type="submit">
            Sign in
          </button>

          <p className="demo-note">
            Demo only: this frontend does not verify accounts yet.
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <span className="brand-icon">B</span>
          <div>
            <h1>Bhoomi Setu</h1>
            <p>Land Governance GIS</p>
          </div>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setError("");
            setPage("login");
          }}
        >
          Login
        </button>
      </header>

      <main className="hero">
        <p className="eyebrow">SMART LAND GOVERNANCE</p>
        <h2>Connecting people to their land.</h2>
        <p>
          Explore land parcels through satellite imagery and access land
          information through a unified digital platform.
        </p>

        <div className="hero-actions">
          <button
            className="btn-primary"
            onClick={() => {
              setRole("user");
              setPage("login");
            }}
          >
            Citizen Portal
          </button>
          <button
            className="btn-outline"
            onClick={() => {
              setRole("officer");
              setPage("login");
            }}
          >
            Officer Portal
          </button>
        </div>

        <div className="home-preview">
          <div className="map-heading">
            <div>
              <h3>Land Parcel Preview</h3>
              <p>Satellite view</p>
            </div>
          </div>
          <div className="map-wrapper">
            <MapContainer
              center={[16.5062, 80.648]}
              zoom={12}
              scrollWheelZoom
              className="map"
            >
              <TileLayer
                attribution="Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
            </MapContainer>
          </div>
          <p className="map-caption">
            Sign in to access your dashboard and parcel tools.
          </p>
        </div>
      </main>

      <footer className="footer">
        SIH26014 · Bhoomi Setu · Land Governance GIS
      </footer>
    </div>
  );
}

export default App;