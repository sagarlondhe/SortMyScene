const SeatLegend = () => (
  <div className="legend">
    <div className="legend-item">
      <span className="legend-dot" style={{ background: 'var(--green)' }} />
      Available
    </div>
    <div className="legend-item">
      <span className="legend-dot" style={{ background: 'var(--yellow)' }} />
      Reserved
    </div>
    <div className="legend-item">
      <span className="legend-dot" style={{ background: 'var(--red)' }} />
      Booked
    </div>
    <div className="legend-item">
      <span className="legend-dot" style={{ background: 'var(--blue)' }} />
      Selected
    </div>
  </div>
);

export default SeatLegend;
