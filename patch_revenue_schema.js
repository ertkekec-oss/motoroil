const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// Add to Company
if (!schema.includes('revenueInsights       RevenueInsight[]')) {
    schema = schema.replace(
        /model Company \{[\s\S]*?status\s+CompanyStatus\s+@default\(ACTIVE\)/,
        match => match + '\n  revenueInsights       RevenueInsight[]\n  salesForecasts        SalesForecast[]\n  salesOpportunities    SalesOpportunity[]\n  salesRiskAlerts       SalesRiskAlert[]'
    );
}

// Add to Staff
if (!schema.includes('salesPerformanceScores SalesPerformanceScore[]')) {
    schema = schema.replace(
        /model Staff \{[\s\S]*?permissions\s+String\[\]\s+@default\(\[\]\)/,
        match => match + '\n  salesPerformanceScores SalesPerformanceScore[]'
    );
}

// Append models if not exist
const newModels = fs.readFileSync(path.join(__dirname, 'prisma', 'temp_revenue_models.prisma'), 'utf8');
if (!schema.includes('model RevenueInsight {')) {
    schema += '\n\n' + newModels;
}

fs.writeFileSync(schemaPath, schema);
console.log('Schema updated successfully for Revenue Intelligence');
