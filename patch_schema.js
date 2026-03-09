const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// Add to Company
if (!schema.includes('targetPlans           TargetPlan[]')) {
    schema = schema.replace(
        /model Company \{[\s\S]*?status\s+CompanyStatus\s+@default\(ACTIVE\)/,
        match => match + '\n  targetPlans           TargetPlan[]'
    );
}

// Add to Staff
if (!schema.includes('targetAssignments   TargetAssignment[]')) {
    schema = schema.replace(
        /model Staff \{[\s\S]*?permissions\s+String\[\]\s+@default\(\[\]\)/,
        match => match + '\n  targetAssignments   TargetAssignment[]\n  achievementBadges   AchievementBadge[]\n  leaderboardScores   LeaderboardScore[]'
    );
}

// Append models if not exist
const newModels = fs.readFileSync(path.join(__dirname, 'prisma', 'temp_sales_perf_models.prisma'), 'utf8');
if (!schema.includes('model TargetPlan {')) {
    schema += '\n\n' + newModels;
}

fs.writeFileSync(schemaPath, schema);
console.log('Schema updated successfully');
