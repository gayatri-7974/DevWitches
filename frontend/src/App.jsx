
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";

function App() {
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

        <div className="header-right">
          <span className="status-dot"></span>
          Demo Mode
        </div>
      </header>

      <main className="main">
        <section className="intro">
          <div>
            <p className="eyebrow">LAND MANAGEMENT SYSTEM</p>
            <h2>Explore Land Parcels</h2>
            <p className="subtitle">
              View land locations and access parcel information
              through an interactive map.
            </p>
          </div>
        </section>

        <section className="dashboard">
          <div className="map-heading">
            <div>
              <h3>Land Parcel Map</h3>
              <p>Vijayawada, Andhra Pradesh</p>
            </div>

            <span className="map-badge">Live Map</span>
          </div>

          <div className="map-wrapper">
            <MapContainer
              center={[16.5062, 80.648]}
              zoom={13}
              scrollWheelZoom={true}
              className="map"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <Marker position={[16.5062, 80.648]}>
                <Popup>
                  <strong>Sample Land Parcel</strong>
                  <br />
                  ULPIN: TEST123
                  <br />
                  Area: 2.5 acres
                </Popup>
              </Marker>
            </MapContainer>
          </div>

          <div className="map-footer">
            <span>
              <span className="legend-dot"></span>
              Sample parcel location
            </span>
            <span>Map data © OpenStreetMap</span>
          </div>
        </section>
      </main>

      <footer className="footer">
        SIH26014 · Land Governance GIS
      </footer>
    </div>
  );
}

export default App;