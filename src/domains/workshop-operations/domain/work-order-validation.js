export const qualityChecklistFields = [
    'tasksCompleted', 'sparePartsChecked', 'diagnosisValidated', 'cleaningDone', 'finalTestDone'
];

export const tasksApprovedForDelivery = (tasks) => tasks.length > 0 && tasks.every(
    task => task.status === 'COMPLETED' && task.adminReviewStatus === 'APPROVED'
);

export const qualityChecklistComplete = (checklist) => qualityChecklistFields.every(
    field => checklist?.[field] === true
);
