const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// Add to Company
if (!schema.includes('salesXInsights         SalesXInsight[]')) {
    schema = schema.replace(
        /model Company \{[\s\S]*?status\s+CompanyStatus\s+@default\(ACTIVE\)/,
        match => match + '\n  salesXInsights         SalesXInsight[]\n  salesXOpportunities    SalesXOpportunity[]\n  predictiveVisits       PredictiveVisit[]\n  routeSuggestions       RouteSuggestion[]'
    );
}

// Add to Customer
if (!schema.includes('salesXOpportunities    SalesXOpportunity[]')) {
    schema = schema.replace(
        /model Customer \{[\s\S]*?address\s+String\?/,
        match => match + '\n  salesXOpportunities    SalesXOpportunity[]\n  predictiveVisits       PredictiveVisit[]'
    );
}

// Add to Staff
if (!schema.includes('salesXInsights         SalesXInsight[]')) {
    schema = schema.replace(
        /model Staff \{[\s\S]*?permissions\s+String\[\]\s+@default\(\[\]\)/,
        match => match + '\n  salesXInsights         SalesXInsight[]\n  predictiveVisits       PredictiveVisit[]\n  routeSuggestions       RouteSuggestion[]'
    );
}

// Append models if not exist
const newModels = fs.readFileSync(path.join(__dirname, 'prisma', 'temp_salesx_models.prisma'), 'utf8');
if (!schema.includes('model SalesXInsight {')) {
    schema += '\n\n' + newModels;
}

fs.writeFileSync(schemaPath, schema);
console.log('Schema updated successfully for SalesX Intelligence');
