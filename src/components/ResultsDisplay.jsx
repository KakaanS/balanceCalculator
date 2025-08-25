import React, { useState } from "react";
import "./ResultsDisplay.css";

const ResultsDisplay = ({ costs }) => {
  const [activeTab, setActiveTab] = useState("summary");

  if (!costs) {
    return null;
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: "SEK",
    }).format(value || 0);
  };

  const formatNumber = (value, decimals = 2) => {
    return new Intl.NumberFormat("sv-SE", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value || 0);
  };

  const formatDateTime = (datetime) => {
    if (!datetime) return "N/A";
    try {
      return new Date(datetime).toLocaleString("sv-SE");
    } catch {
      return datetime.toString();
    }
  };

  const renderSummary = () => (
    <div className="summary-section">
      <h3>Summary</h3>
      <div className="summary-grid">
        <div className="summary-card">
          <h4>Total Balancing Cost</h4>
          <div className="summary-value">
            {formatCurrency(costs.summary.totalCost)}
          </div>
        </div>

        <div className="summary-card">
          <h4>Up Regulation</h4>
          <div className="summary-details">
            <div>
              Cost: {formatCurrency(costs.summary.totalUpRegulationCost)}
            </div>
            <div>Volume: {formatNumber(costs.summary.totalUpVolume)} kWh</div>
            <div>Events: {costs.summary.numberOfUpRegulations}</div>
            <div>
              Avg Cost/kWh: {formatCurrency(costs.summary.avgUpCostPerUnit)}
            </div>
          </div>
        </div>

        <div className="summary-card">
          <h4>Down Regulation</h4>
          <div className="summary-details">
            <div>
              Cost: {formatCurrency(costs.summary.totalDownRegulationCost)}
            </div>
            <div>Volume: {formatNumber(costs.summary.totalDownVolume)} kWh</div>
            <div>Events: {costs.summary.numberOfDownRegulations}</div>
            <div>
              Avg Cost/kWh: {formatCurrency(costs.summary.avgDownCostPerUnit)}
            </div>
          </div>
        </div>
      </div>

      <h3>Costs by Production Site</h3>
      <div className="sites-table">
        <table>
          <thead>
            <tr>
              <th>Site</th>
              <th>Up Regulation Cost</th>
              <th>Down Regulation Cost</th>
              <th>Total Cost</th>
              <th>Up Volume (kWh)</th>
              <th>Down Volume (kWh)</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(costs.totalCosts).map(([site, siteCosts]) => (
              <tr key={site}>
                <td>{site}</td>
                <td>{formatCurrency(siteCosts.upRegulationCost)}</td>
                <td>{formatCurrency(siteCosts.downRegulationCost)}</td>
                <td className="total-cost">
                  {formatCurrency(siteCosts.totalCost)}
                </td>
                <td>{formatNumber(siteCosts.upRegulationVolume)}</td>
                <td>{formatNumber(siteCosts.downRegulationVolume)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderUpRegulation = () => (
    <div className="regulation-section">
      <h3>Up Regulation Details</h3>
      <div className="price-note">
        <small>
          💡 <strong>Note:</strong> Raw prices are in öre/kWh, calculations
          shown in SEK. Production values are power (kW) converted to energy
          (kWh) for 15-minute intervals.
        </small>
      </div>
      <div className="regulation-table">
        <table>
          <thead>
            <tr>
              <th>Date/Time</th>
              <th>Site</th>
              <th>Production</th>
              <th>Forecast</th>
              <th>Imbalance</th>
              <th>
                Spot Price
                <br />
                <small>(öre/kWh → SEK/kWh)</small>
              </th>
              <th>
                Regulation Price
                <br />
                <small>(öre/kWh → SEK/kWh)</small>
              </th>
              <th>
                Price Diff
                <br />
                <small>(SEK/kWh)</small>
              </th>
              <th>
                Balancing Fee
                <br />
                <small>(öre/kWh → SEK/kWh)</small>
              </th>
              <th>
                Total Cost
                <br />
                <small>(SEK)</small>
              </th>
            </tr>
          </thead>
          <tbody>
            {costs.upRegulation.map((item, index) => (
              <tr key={index}>
                <td>{formatDateTime(item.datetime)}</td>
                <td>{item.site}</td>
                <td>{formatNumber(item.production)} kWh</td>
                <td>{formatNumber(item.forecast)} kWh</td>
                <td className="imbalance">
                  {formatNumber(item.imbalance)} kWh
                </td>
                <td>
                  <div className="price-conversion">
                    <span className="ore-price">
                      {formatNumber(item.cost.spotPriceOre, 2)} öre
                    </span>
                    <span className="sek-price">
                      → {formatCurrency(item.cost.spotPrice)}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="price-conversion">
                    <span className="ore-price">
                      {formatNumber(item.cost.regulationPriceOre, 2)} öre
                    </span>
                    <span className="sek-price">
                      → {formatCurrency(item.cost.regulationPrice)}
                    </span>
                  </div>
                </td>
                <td>{formatCurrency(item.cost.priceDifference)}</td>
                <td>
                  <div className="price-conversion">
                    <span className="ore-price">
                      {formatNumber(item.cost.balancingFeeOre, 2)} öre
                    </span>
                    <span className="sek-price">
                      → {formatCurrency(item.cost.balancingFee)}
                    </span>
                  </div>
                </td>
                <td className="cost">{formatCurrency(item.cost.totalCost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {costs.upRegulation.length === 0 && (
          <div className="no-data">No up regulation events found</div>
        )}
      </div>
    </div>
  );

  const renderDownRegulation = () => (
    <div className="regulation-section">
      <h3>Down Regulation Details</h3>
      <div className="price-note">
        <small>
          💡 <strong>Note:</strong> Raw prices are in öre/kWh, calculations
          shown in SEK. Production values are power (kW) converted to energy
          (kWh) for 15-minute intervals.
        </small>
      </div>
      <div className="regulation-table">
        <table>
          <thead>
            <tr>
              <th>Date/Time</th>
              <th>Site</th>
              <th>Production</th>
              <th>Forecast</th>
              <th>Imbalance</th>
              <th>
                Spot Price
                <br />
                <small>(öre/kWh → SEK/kWh)</small>
              </th>
              <th>
                Regulation Price
                <br />
                <small>(öre/kWh → SEK/kWh)</small>
              </th>
              <th>
                Price Diff
                <br />
                <small>(SEK/kWh)</small>
              </th>
              <th>
                Balancing Fee
                <br />
                <small>(öre/kWh → SEK/kWh)</small>
              </th>
              <th>
                Total Cost
                <br />
                <small>(SEK)</small>
              </th>
            </tr>
          </thead>
          <tbody>
            {costs.downRegulation.map((item, index) => (
              <tr key={index}>
                <td>{formatDateTime(item.datetime)}</td>
                <td>{item.site}</td>
                <td>{formatNumber(item.production)} kWh</td>
                <td>{formatNumber(item.forecast)} kWh</td>
                <td className="imbalance">
                  {formatNumber(item.imbalance)} kWh
                </td>
                <td>
                  <div className="price-conversion">
                    <span className="ore-price">
                      {formatNumber(item.cost.spotPriceOre, 2)} öre
                    </span>
                    <span className="sek-price">
                      → {formatCurrency(item.cost.spotPrice)}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="price-conversion">
                    <span className="ore-price">
                      {formatNumber(item.cost.regulationPriceOre, 2)} öre
                    </span>
                    <span className="sek-price">
                      → {formatCurrency(item.cost.regulationPrice)}
                    </span>
                  </div>
                </td>
                <td>{formatCurrency(item.cost.priceDifference)}</td>
                <td>
                  <div className="price-conversion">
                    <span className="ore-price">
                      {formatNumber(item.cost.balancingFeeOre, 2)} öre
                    </span>
                    <span className="sek-price">
                      → {formatCurrency(item.cost.balancingFee)}
                    </span>
                  </div>
                </td>
                <td className="cost">{formatCurrency(item.cost.totalCost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {costs.downRegulation.length === 0 && (
          <div className="no-data">No down regulation events found</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="results-display">
      <div className="results-header">
        <h2>Balancing Cost Analysis Results</h2>
        <div className="tabs">
          <button
            className={`tab ${activeTab === "summary" ? "active" : ""}`}
            onClick={() => setActiveTab("summary")}
          >
            Summary
          </button>
          <button
            className={`tab ${activeTab === "up" ? "active" : ""}`}
            onClick={() => setActiveTab("up")}
          >
            Up Regulation ({costs.upRegulation.length})
          </button>
          <button
            className={`tab ${activeTab === "down" ? "active" : ""}`}
            onClick={() => setActiveTab("down")}
          >
            Down Regulation ({costs.downRegulation.length})
          </button>
        </div>
      </div>

      <div className="results-content">
        {activeTab === "summary" && renderSummary()}
        {activeTab === "up" && renderUpRegulation()}
        {activeTab === "down" && renderDownRegulation()}
      </div>

      <div className="export-section">
        <button className="export-btn" onClick={() => window.print()}>
          📄 Export Results
        </button>
      </div>
    </div>
  );
};

export default ResultsDisplay;
