import { useState } from "react";
import "./App.css";
import ExcelUploader from "./components/ExcelUploader";
import ResultsDisplay from "./components/ResultsDisplay";
import { calculateBalancingCosts } from "./utils/balancingCalculations";

function App() {
  const [excelData, setExcelData] = useState(null);
  const [balancingCosts, setBalancingCosts] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleDataParsed = (data) => {
    setExcelData(data);
    setIsCalculating(true);

    try {
      const costs = calculateBalancingCosts(data);
      setBalancingCosts(costs);
    } catch (error) {
      console.error("Error calculating balancing costs:", error);
      alert(
        "Error calculating balancing costs. Please check your data format."
      );
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Balancing Cost Calculator</h1>
        <p>Upload your Excel file to calculate up and down balancing costs</p>
      </header>

      <main className="app-main">
        <ExcelUploader onDataParsed={handleDataParsed} />

        {isCalculating && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
          </div>
        )}

        {balancingCosts && !isCalculating && (
          <ResultsDisplay data={excelData} costs={balancingCosts} />
        )}
      </main>
    </div>
  );
}

export default App;
