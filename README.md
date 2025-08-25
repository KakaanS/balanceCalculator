# Balancing Cost Calculator

A React-based web application for calculating up and down balancing costs from Excel files containing energy production data.

## Features

- **Drag-and-Drop Excel Upload**: Simply drop your Excel (.xlsx/.xls) files into the application
- **Automatic Data Parsing**: Extracts required columns including spot prices, regulation prices, production data, and forecasts
- **Balancing Cost Calculations**: Calculates up and down regulation costs based on:
  - Spot prices (SE3, SE4)
  - Regulation prices (SE3, SE4)
  - Production vs. Forecast imbalances
  - Balancing fees
- **Comprehensive Results Display**: 
  - Summary dashboard with total costs
  - Detailed breakdown by production site
  - Separate views for up and down regulation events
- **Export Functionality**: Print/export results for reporting

## Expected Excel File Format

The application expects a specific Excel file structure with **two header rows**:

### File Structure:
- **Row 1 (Header Row 0)**: Contains `Produktion`, `Prognos`, `Enhet` labels for each production site
- **Row 2 (Header Row 1)**: Contains the actual column names and production site names
- **Row 3+**: Actual data rows

### Column Layout:
| Column | Row 1 Header | Row 2 Header | Description |
|--------|--------------|--------------|-------------|
| A (0) | | `Datum och tid` | Date and time (Excel serial number) |
| B (1) | | `Minut` | Minute value |
| C (2) | | `Spot SE3` | Spot price for SE3 region |
| D (3) | | `Spot SE4` | Spot price for SE4 region |
| E (4) | | `Reglerpris SE3` | Regulation price for SE3 region |
| F (5) | | `Reglerpris SE4` | Regulation price for SE4 region |
| G (6) | | `Avgift_Balanskraft` | Balancing fee |
| H (7) | | (empty) | |
| I (8) | `Produktion` | `Gunnarby` | Gunnarby production values |
| J (9) | `Prognos` | `234333` | Gunnarby forecast values |
| K (10) | `Enhet` | `kWh` | Unit for Gunnarby |
| L (11) | | (empty) | |
| M (12) | `Produktion` | `Tommared` | Tommared production values |
| N (13) | `Prognos` | `230309` | Tommared forecast values |
| O (14) | `Enhet` | `kWh` | Unit for Tommared |

### Example File Structure:
```
Row 1: [empty×8] | Produktion | Prognos | Enhet | [empty] | Produktion | Prognos | Enhet
Row 2: Datum och tid | Minut | Spot SE3 | Spot SE4 | Reglerpris SE3 | Reglerpris SE4 | Avgift_Balanskraft | [empty] | Gunnarby | 234333 | kWh | [empty] | Tommared | 230309 | kWh
Row 3: 45748 | 0 | 325.43 | 612.35 | 181.1616 | 181.1616 | 12.4752 | [empty] | 745 | 166.8 | [empty] | [empty] | 614 | 300
```

**Note**: The numbers `234333` and `230309` appear to be site identifiers or capacity values for Gunnarby and Tommared respectively.

## Installation & Usage

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Setup
1. Clone or download the project
2. Navigate to the project directory:
   ```bash
   cd balancing-cost-calculator
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open your browser to `http://localhost:5173`

### Usage
1. **Upload File**: Drag and drop your Excel file into the upload area, or click to browse
2. **Processing**: The application will automatically parse your data and calculate balancing costs
3. **View Results**: Navigate through the tabs to see:
   - **Summary**: Overview of total costs and statistics
   - **Up Regulation**: Detailed breakdown of underproduction costs
   - **Down Regulation**: Detailed breakdown of overproduction costs
4. **Export**: Use the export button to print or save results

### How Balancing Costs Are Calculated

**Important Note**: All prices in the Excel file are in **öre/kWh** (Swedish öre per kilowatt-hour), but final costs are calculated and displayed in **SEK** (Swedish kronor).

*Conversion: 1 SEK = 100 öre*

### Up Regulation (Underproduction)
When actual production < forecast:
- **Cost (SEK)** = Imbalance × ((Regulation Price - Spot Price + Balancing Fee) ÷ 100)
- This represents the cost of buying additional energy at regulation prices
- Prices are converted from öre/kWh to SEK/kWh for calculation

### Down Regulation (Overproduction)
When actual production > forecast:
- **Cost (SEK)** = Imbalance × ((Spot Price - Regulation Price + Balancing Fee) ÷ 100)
- This represents the revenue loss from selling excess energy at lower regulation prices
- Prices are converted from öre/kWh to SEK/kWh for calculation

### Key Metrics
- **Total Balancing Cost**: Sum of all up and down regulation costs
- **Volume**: Total energy imbalance (kWh)
- **Average Cost per kWh**: Total cost divided by total volume
- **Number of Events**: Count of regulation events

## Technologies Used

- **React 18**: Frontend framework
- **Vite**: Build tool and development server
- **XLSX**: Excel file parsing library
- **React Dropzone**: Drag-and-drop file upload
- **CSS3**: Modern styling with gradients and responsive design

## Project Structure

```
src/
├── components/
│   ├── ExcelUploader.jsx     # File upload component
│   ├── ExcelUploader.css     # Upload component styles
│   ├── ResultsDisplay.jsx    # Results display component
│   └── ResultsDisplay.css    # Results display styles
├── utils/
│   └── balancingCalculations.js  # Core calculation logic
├── App.jsx                   # Main application component
├── App.css                   # Main application styles
└── main.jsx                  # Application entry point
```

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the [MIT License](LICENSE).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
