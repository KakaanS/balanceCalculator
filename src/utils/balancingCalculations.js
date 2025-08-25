/**
 * Balancing Cost Calculation Engine
 *
 * This module calculates up and down balancing costs based on:
 * - Spot prices (SE3, SE4)
 * - Regulation prices (SE3, SE4)
 * - Production vs. Forecast data
 * - Balancing fees
 */

export const calculateBalancingCosts = (data) => {
  if (!data || data.length === 0) {
    return {
      upRegulation: [],
      downRegulation: [],
      totalCosts: {},
      summary: {},
    };
  }

  const results = {
    upRegulation: [],
    downRegulation: [],
    totalCosts: {},
    summary: {},
  };

  // Process each row of data
  data.forEach((row, index) => {
    const rowResults = calculateRowBalancingCost(row);

    if (rowResults.upRegulation.length > 0) {
      results.upRegulation.push({
        datetime: row.datetime,
        rowIndex: index,
        ...rowResults.upRegulation[0],
      });
    }

    if (rowResults.downRegulation.length > 0) {
      results.downRegulation.push({
        datetime: row.datetime,
        rowIndex: index,
        ...rowResults.downRegulation[0],
      });
    }
  });

  // Calculate summary statistics
  results.summary = calculateSummary(results, data);

  // Calculate total costs by production site
  results.totalCosts = calculateTotalCosts(results, data);

  return results;
};

const calculateRowBalancingCost = (row) => {
  const upRegulation = [];
  const downRegulation = [];

  if (!row.productionSites) {
    return { upRegulation, downRegulation };
  }

  // Process each production site
  Object.entries(row.productionSites).forEach(([siteName, siteData]) => {
    const { production, prognos } = siteData;

    // Calculate power imbalance (difference between actual and forecast)
    // Values are in kW, need to convert to kWh for 15-minute intervals
    const energyImbalance = production - prognos; // kW

    const imbalance = energyImbalance;

    if (imbalance > 0) {
      // Overproduction - down regulation needed
      const cost = calculateDownRegulationCost(imbalance, row);
      if (cost !== null) {
        downRegulation.push({
          site: siteName,
          imbalance: imbalance,
          cost: cost,
          type: "down",
          production: production,
          forecast: prognos,
        });
      }
    } else if (imbalance < 0) {
      // Underproduction - up regulation needed
      const cost = calculateUpRegulationCost(Math.abs(imbalance), row);
      if (cost !== null) {
        upRegulation.push({
          site: siteName,
          imbalance: Math.abs(imbalance),
          cost: cost,
          type: "up",
          production: production,
          forecast: prognos,
        });
      }
    }
  });

  return { upRegulation, downRegulation };
};

const calculateUpRegulationCost = (imbalance, row) => {
  // Up regulation cost calculation
  // When production < forecast, we need to buy energy at regulation price

  const reglerPrisOre = getRelevantRegulationPrice(row, "up");
  const spotPrisOre = getRelevantSpotPrice(row);
  const avgiftBalanskraftOre = row.avgiftBalanskraft || 0;

  if (reglerPrisOre === null || spotPrisOre === null) {
    return null;
  }

  // Convert öre to SEK for calculations
  const reglerPris = reglerPrisOre / 1000;
  const spotPris = spotPrisOre / 1000;
  const avgiftBalanskraft = avgiftBalanskraftOre / 1000;

  // Cost = imbalance * (regulation_price - spot_price + balancing_fee)
  const priceDiff = Math.max(0, reglerPris - spotPris);
  const regulationCost = imbalance * (priceDiff + avgiftBalanskraft);

  // What they would have paid at spot price (if they had to buy the missing energy)
  const spotCost = imbalance * spotPris;

  // What they actually paid (regulation price + balancing fee)
  const actualCost = imbalance * (reglerPris + avgiftBalanskraft);

  // Net result: negative means they paid more than spot, positive means they saved money
  const netResult = spotCost - actualCost;

  return {
    imbalanceVolume: imbalance,
    regulationPrice: reglerPris,
    spotPrice: spotPris,
    regulationPriceOre: reglerPrisOre,
    spotPriceOre: spotPrisOre,
    priceDifference: priceDiff,
    balancingFee: avgiftBalanskraft,
    balancingFeeOre: avgiftBalanskraftOre,
    totalCost: regulationCost,
    actualCost: actualCost,
    spotCost: spotCost,
    netResult: netResult,
    costPerUnit: priceDiff + avgiftBalanskraft,
  };
};

const calculateDownRegulationCost = (imbalance, row) => {
  // Down regulation cost calculation
  // When production > forecast, we sell excess energy at regulation price

  const reglerPrisOre = getRelevantRegulationPrice(row, "down");
  const spotPrisOre = getRelevantSpotPrice(row);
  const avgiftBalanskraftOre = row.avgiftBalanskraft || 0;

  if (reglerPrisOre === null || spotPrisOre === null) {
    return null;
  }

  // Convert öre to SEK for calculations
  const reglerPris = reglerPrisOre / 1000;
  const spotPris = spotPrisOre / 1000;
  const avgiftBalanskraft = avgiftBalanskraftOre / 1000;

  // Revenue loss = imbalance * (spot_price - regulation_price) + balancing_fee
  const priceDiff = Math.max(0, spotPris - reglerPris);
  const regulationCost = imbalance * (priceDiff + avgiftBalanskraft);

  // What they would have earned at spot price
  const spotRevenue = imbalance * spotPris;

  // What they actually earned (regulation price minus balancing fee)
  const actualRevenue = imbalance * reglerPris - imbalance * avgiftBalanskraft;

  // Net result: negative means they earned less than spot, positive means they earned more
  const netResult = actualRevenue - spotRevenue;

  return {
    imbalanceVolume: imbalance,
    regulationPrice: reglerPris,
    spotPrice: spotPris,
    regulationPriceOre: reglerPrisOre,
    spotPriceOre: spotPrisOre,
    priceDifference: priceDiff,
    balancingFee: avgiftBalanskraft,
    balancingFeeOre: avgiftBalanskraftOre,
    totalCost: regulationCost,
    actualRevenue: actualRevenue,
    spotRevenue: spotRevenue,
    netResult: netResult,
    costPerUnit: priceDiff + avgiftBalanskraft,
  };
};

const getRelevantRegulationPrice = (row) => {
  // Use SE3 regulation price as primary, fallback to SE4
  // Filter out extreme prices that are likely data errors
  const maxReasonablePrice = 500000;
  const minReasonablePrice = -100000;

  const isValidPrice = (price) => {
    return (
      price !== null &&
      price !== undefined &&
      typeof price === "number" &&
      price >= minReasonablePrice &&
      price <= maxReasonablePrice
    );
  };

  if (isValidPrice(row.reglerPrisSE3)) {
    return row.reglerPrisSE3;
  }
  if (isValidPrice(row.reglerPrisSE4)) {
    return row.reglerPrisSE4;
  }
  return null;
};

const getRelevantSpotPrice = (row) => {
  // Use SE3 spot price as primary, fallback to SE4
  if (row.spotSE3 && row.spotSE3 > 0) {
    return row.spotSE3;
  }
  if (row.spotSE4 && row.spotSE4 > 0) {
    return row.spotSE4;
  }
  return null;
};

const calculateSummary = (results) => {
  const totalUpRegulationCost = results.upRegulation.reduce((sum, item) => {
    return sum + (item.cost?.totalCost || 0);
  }, 0);

  const totalDownRegulationCost = results.downRegulation.reduce((sum, item) => {
    return sum + (item.cost?.totalCost || 0);
  }, 0);

  const totalUpVolume = results.upRegulation.reduce((sum, item) => {
    return sum + (item.imbalance || 0);
  }, 0);

  const totalDownVolume = results.downRegulation.reduce((sum, item) => {
    return sum + (item.imbalance || 0);
  }, 0);

  return {
    totalUpRegulationCost,
    totalDownRegulationCost,
    totalCost: totalUpRegulationCost + totalDownRegulationCost,
    totalUpVolume,
    totalDownVolume,
    avgUpCostPerUnit:
      totalUpVolume > 0 ? totalUpRegulationCost / totalUpVolume : 0,
    avgDownCostPerUnit:
      totalDownVolume > 0 ? totalDownRegulationCost / totalDownVolume : 0,
    numberOfUpRegulations: results.upRegulation.length,
    numberOfDownRegulations: results.downRegulation.length,
  };
};

const calculateTotalCosts = (results, data) => {
  const costsBySite = {};

  // Initialize sites
  if (data.length > 0 && data[0].productionSites) {
    Object.keys(data[0].productionSites).forEach((siteName) => {
      costsBySite[siteName] = {
        upRegulationCost: 0,
        downRegulationCost: 0,
        totalCost: 0,
        upRegulationVolume: 0,
        downRegulationVolume: 0,
      };
    });
  }

  // Sum up regulation costs
  results.upRegulation.forEach((item) => {
    if (costsBySite[item.site]) {
      costsBySite[item.site].upRegulationCost += item.cost?.totalCost || 0;
      costsBySite[item.site].upRegulationVolume += item.imbalance || 0;
    }
  });

  results.downRegulation.forEach((item) => {
    if (costsBySite[item.site]) {
      costsBySite[item.site].downRegulationCost += item.cost?.totalCost || 0;
      costsBySite[item.site].downRegulationVolume += item.imbalance || 0;
    }
  });

  // Calculate total costs
  Object.keys(costsBySite).forEach((site) => {
    costsBySite[site].totalCost =
      costsBySite[site].upRegulationCost + costsBySite[site].downRegulationCost;
  });

  return costsBySite;
};

export default calculateBalancingCosts;
