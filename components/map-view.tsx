"use client"

export default function MapView() {
  return (
    <div className="map-container">
      <div className="map-placeholder">
        <svg
          className="w-full h-full max-w-4xl max-h-4xl opacity-20"
          viewBox="0 0 400 500"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Main Route Line */}
          <path d="M 50 100 Q 100 80 150 120 T 250 140 T 350 200" className="route-line" />

          {/* Alternative Route */}
          <path d="M 50 100 Q 120 150 180 160 T 300 180 T 350 200" className="route-line-alt" />

          {/* Location Marker */}
          <circle cx="50" cy="100" r="8" className="fill-secondary ring-4 ring-secondary/30" />

          {/* Destination Marker */}
          <circle cx="350" cy="200" r="8" className="fill-accent ring-4 ring-accent/30" />

          {/* Road network */}
          <path d="M 0 150 L 400 150" stroke="rgba(148, 163, 184, 0.2)" strokeWidth="3" />
          <path d="M 0 250 L 400 250" stroke="rgba(148, 163, 184, 0.2)" strokeWidth="3" />
          <path d="M 100 0 L 100 500" stroke="rgba(148, 163, 184, 0.2)" strokeWidth="3" />
          <path d="M 300 0 L 300 500" stroke="rgba(148, 163, 184, 0.2)" strokeWidth="3" />
        </svg>
      </div>
    </div>
  )
}
