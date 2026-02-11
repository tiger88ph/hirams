/**
 * Tax Calculation Utility
 * 
 * Formula: (Total Selling Price - Total Capital) / 1.12 * (0.12 + 0.3)
 * 
 * Where:
 * - 1.12 represents the VAT divisor (12% VAT)
 * - 0.12 represents VAT rate (12%)
 * - 0.3 represents income tax rate (30%)
 * - Total calculation: 0.12 + 0.3 = 0.42 (42% combined tax rate on net profit)
 */

/**
 * Calculate tax based on total selling price and total capital
 * 
 * @param {number} totalSellingPrice - The total selling price (unit price * quantity)
 * @param {number} totalCapital - The total capital/cost (included total)
 * @returns {number} The calculated tax amount
 */
export const calculateTax = (totalSellingPrice, totalCapital) => {
  const sellingPrice = Number(totalSellingPrice) || 0;
  const capital = Number(totalCapital) || 0;
  
  // Formula: (Total Selling Price - Total Capital) / 1.12 * (0.12 + 0.3)
  const tax = (sellingPrice - capital) / 1.12 * (0.12 + 0.3);
  
  return tax;
};

/**
 * Calculate tax for a single item
 * 
 * @param {number} unitSellingPrice - The unit selling price
 * @param {number} quantity - The item quantity
 * @param {number} includedTotal - The total capital (sum of included purchase options)
 * @returns {number} The calculated tax amount
 */
export const calculateItemTax = (unitSellingPrice, quantity, includedTotal) => {
  const totalSellingPrice = Number(unitSellingPrice) * Number(quantity);
  const totalCapital = Number(includedTotal);
  
  return calculateTax(totalSellingPrice, totalCapital);
};

/**
 * Calculate tax per unit
 * 
 * @param {number} unitSellingPrice - The unit selling price
 * @param {number} quantity - The item quantity
 * @param {number} includedTotal - The total capital (sum of included purchase options)
 * @returns {number} The calculated tax amount per unit
 */
export const calculateTaxPerUnit = (unitSellingPrice, quantity, includedTotal) => {
  const tax = calculateItemTax(unitSellingPrice, quantity, includedTotal);
  const qty = Number(quantity) || 1;
  
  return tax / qty;
};

/**
 * Calculate profit after tax for a single item
 * 
 * @param {number} unitSellingPrice - The unit selling price
 * @param {number} capital - The capital/cost per unit
 * @param {number} quantity - The item quantity
 * @param {number} includedTotal - The total capital (sum of included purchase options)
 * @returns {number} The profit per unit after tax
 */
export const calculateProfitAfterTax = (unitSellingPrice, capital, quantity, includedTotal) => {
  const profitBeforeTax = Number(unitSellingPrice) - Number(capital);
  const taxPerUnit = calculateTaxPerUnit(unitSellingPrice, quantity, includedTotal);
  
  return profitBeforeTax - taxPerUnit;
};

/**
 * Calculate total profit after tax (profit per unit * quantity)
 * 
 * @param {number} unitSellingPrice - The unit selling price
 * @param {number} capital - The capital/cost per unit
 * @param {number} quantity - The item quantity
 * @param {number} includedTotal - The total capital (sum of included purchase options)
 * @returns {number} The total profit after tax
 */
export const calculateTotalProfitAfterTax = (unitSellingPrice, capital, quantity, includedTotal) => {
  const profitPerUnit = calculateProfitAfterTax(unitSellingPrice, capital, quantity, includedTotal);
  
  return profitPerUnit * Number(quantity);
};

export default {
  calculateTax,
  calculateItemTax,
  calculateTaxPerUnit,
  calculateProfitAfterTax,
  calculateTotalProfitAfterTax,
};