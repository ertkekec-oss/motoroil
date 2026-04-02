const fs = require('fs');

function patchApiForNotes() {
    const file = 'c:/Users/ertke/OneDrive/Masaüstü/periodya/muhasebeapp/motoroil/src/app/api/services/work-orders/[id]/route.ts';
    let code = fs.readFileSync(file, 'utf8');

    const oldLogic = `        const { status, nextKm_or_Use, nextMaintenanceAt } = body;

        const updateData: any = {};
        if (status) updateData.status = status;
        if (nextKm_or_Use !== undefined) updateData.nextKm_or_Use = nextKm_or_Use;
        if (nextMaintenanceAt !== undefined) updateData.nextMaintenanceAt = nextMaintenanceAt;`;

    const newLogic = `        const { status, nextKm_or_Use, nextMaintenanceAt, technicianNotes } = body;

        const updateData: any = {};
        if (status) updateData.status = status;
        if (nextKm_or_Use !== undefined) updateData.nextKm_or_Use = nextKm_or_Use;
        if (nextMaintenanceAt !== undefined) updateData.nextMaintenanceAt = nextMaintenanceAt;
        if (technicianNotes !== undefined) updateData.technicianNotes = technicianNotes;`;

    code = code.replace(oldLogic, newLogic);
    fs.writeFileSync(file, code, 'utf8');
}

patchApiForNotes();
