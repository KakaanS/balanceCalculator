import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import "./ExcelUploader.css";

const ExcelUploader = ({ onDataParsed }) => {
  const parseExcelFile = useCallback(
    (file) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });

          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (jsonData.length < 2) {
            throw new Error(
              "Excel file must contain at least a header row and one data row"
            );
          }

          const columnMap = findColumnIndices(jsonData);
          const dataRows = jsonData.slice(2);

          const parsedData = parseDataRows(dataRows, columnMap);

          onDataParsed(parsedData);
        } catch (error) {
          console.error("Error parsing Excel file:", error);
          alert(`Error parsing Excel file: ${error.message}`);
        }
      };

      reader.readAsArrayBuffer(file);
    },
    [onDataParsed]
  );

  const findColumnIndices = (allRows) => {
    if (allRows.length < 2) {
      throw new Error("Excel file must have at least 2 header rows");
    }

    const headerRow0 = allRows[0] || [];
    const headerRow1 = allRows[1] || [];

    const columnMap = {};

    const basicColumnMap = {
      "Datum och tid": 0,
      Minut: 1,
      "Spot SE3": 2,
      "Spot SE4": 3,
      "Reglerpris SE3": 4,
      "Reglerpris SE4": 5,
      Avgift_Balanskraft: 6,
    };

    Object.entries(basicColumnMap).forEach(([colName, expectedIndex]) => {
      const actualHeader = headerRow1[expectedIndex];
      if (actualHeader && actualHeader.toString().trim() === colName) {
        columnMap[colName] = expectedIndex;
      } else {
        console.warn(
          `Expected column '${colName}' at index ${expectedIndex}, but found '${actualHeader}'`
        );

        const foundIndex = headerRow1.findIndex(
          (header) => header && header.toString().trim() === colName
        );
        if (foundIndex !== -1) {
          columnMap[colName] = foundIndex;
        }
      }
    });

    const productionSites = [];

    for (let i = 0; i < headerRow0.length; i++) {
      if (
        headerRow0[i] === "Produktion" &&
        i + 1 < headerRow0.length &&
        headerRow0[i + 1] === "Prognos"
      ) {
        const siteName = headerRow1[i];
        if (siteName && siteName !== "Produktion") {
          productionSites.push({
            name: siteName.toString().trim(),
            productionIndex: i,
            prognosIndex: i + 1,
            unitIndex:
              i + 2 < headerRow0.length && headerRow0[i + 2] === "Enhet"
                ? i + 2
                : null,
          });
        }
      }
    }

    columnMap.productionSites = productionSites;

    console.log("Column mapping result:", columnMap);
    return columnMap;
  };

  const parseDataRows = (rows, columnMap) => {
    return rows
      .map((row) => {
        const parsedRow = {};

        if (columnMap["Datum och tid"] !== undefined) {
          const dateValue = row[columnMap["Datum och tid"]];

          if (typeof dateValue === "number") {
            const excelEpoch = new Date(1899, 11, 30);
            const jsDate = new Date(
              excelEpoch.getTime() + dateValue * 86400000
            );
            parsedRow.datetime = jsDate;
          } else {
            parsedRow.datetime = dateValue;
          }
        }
        if (columnMap["Minut"] !== undefined) {
          parsedRow.minute = parseFloat(row[columnMap["Minut"]]) || 0;
        }
        if (columnMap["Spot SE3"] !== undefined) {
          parsedRow.spotSE3 = parseFloat(row[columnMap["Spot SE3"]]) || 0;
        }
        if (columnMap["Spot SE4"] !== undefined) {
          parsedRow.spotSE4 = parseFloat(row[columnMap["Spot SE4"]]) || 0;
        }
        if (columnMap["Reglerpris SE3"] !== undefined) {
          parsedRow.reglerPrisSE3 =
            parseFloat(row[columnMap["Reglerpris SE3"]]) || 0;
        }
        if (columnMap["Reglerpris SE4"] !== undefined) {
          parsedRow.reglerPrisSE4 =
            parseFloat(row[columnMap["Reglerpris SE4"]]) || 0;
        }
        if (columnMap["Avgift_Balanskraft"] !== undefined) {
          parsedRow.avgiftBalanskraft =
            parseFloat(row[columnMap["Avgift_Balanskraft"]]) || 0;
        }

        parsedRow.productionSites = {};
        columnMap.productionSites.forEach((site) => {
          parsedRow.productionSites[site.name] = {
            production: parseFloat(row[site.productionIndex]) || 0,
            prognos: parseFloat(row[site.prognosIndex]) || 0,
            unit: site.unitIndex ? row[site.unitIndex] : "kWh",
          };
        });

        return parsedRow;
      })
      .filter((row) => row.datetime);
  };

  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        parseExcelFile(acceptedFiles[0]);
      }
    },
    [parseExcelFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
    },
    multiple: false,
  });

  return (
    <div className="excel-uploader">
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? "active" : ""}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the Excel file here...</p>
        ) : (
          <div className="upload-content">
            <div className="upload-icon">📊</div>
            <h3>Drop your Excel file here</h3>
            <p>or click to browse</p>
            <div className="supported-formats">
              <small>Supported formats: .xlsx, .xls</small>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExcelUploader;
