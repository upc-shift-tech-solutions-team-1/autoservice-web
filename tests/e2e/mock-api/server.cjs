const http = require('node:http');

const HOST = '127.0.0.1';
const PORT = 4001;

const accounts = {
    'admin.e2e@example.test': {
        id: 1,
        role: 'admin',
        workshopId: 'e2e-workshop',
        mechanicId: null
    },
    'mechanic.e2e@example.test': {
        id: 2,
        role: 'mechanic',
        workshopId: 'e2e-workshop',
        mechanicId: 1
    }
};

const customers = [
    {
        id: 1,
        workshopId: 'e2e-workshop',
        fullName: 'Carlos Ramirez E2E',
        dni: '00000001',
        email: 'carlos@example.test',
        phone: '900000001'
    },
    {
        id: 2,
        workshopId: 'e2e-workshop',
        fullName: 'Maria Torres E2E',
        dni: '00000002',
        email: 'maria@example.test',
        phone: '900000002'
    }
];

const vehicles = [
    {
        id: 1,
        plate: 'E2E-001',
        brand: 'Toyota',
        model: 'Corolla',
        year: 2022,
        color: 'Blanco',
        status: 'ACTIVE',
        customerId: 1,
        image: ''
    },
    {
        id: 2,
        plate: 'E2E-002',
        brand: 'Hyundai',
        model: 'Accent',
        year: 2021,
        color: 'Gris',
        status: 'ACTIVE',
        customerId: 2,
        image: ''
    }
];
const workOrders = [
    {
        id: 1,
        workshopId: 'e2e-workshop',
        trackingCode: 'E2E-WO-001',
        vehicleId: 1,
        customerId: 1,
        mechanicId: 1,
        description: 'Mantenimiento preventivo E2E',
        status: 'IN_PROGRESS',
        price: 250,
        estimatedDate: '2026-12-15',
        startDate: '2026-11-03',
        tasksCompleted: false,
        sparePartsChecked: false,
        diagnosisValidated: false,
        cleaningDone: false,
        finalTestDone: false
    },
    {
        id: 2,
        workshopId: 'e2e-workshop',
        trackingCode: 'E2E-WO-002',
        vehicleId: 2,
        customerId: 2,
        mechanicId: 1,
        description: 'Revision general E2E',
        status: 'IN_PROGRESS',
        price: 80,
        estimatedDate: '2026-12-16',
        startDate: '2026-11-03',
        tasksCompleted: false,
        sparePartsChecked: false,
        diagnosisValidated: false,
        cleaningDone: false,
        finalTestDone: false
    }
];

const tasks = [
    {
        id: 1,
        workOrderId: 1,
        mechanicId: 1,
        description: 'Cambio de aceite E2E',
        status: 'PENDING',
        priority: 'MEDIUM',
        estimatedTime: 60,
        laborPrice: 100,
        laborCost: 40,
        materialsCost: 50,
        materialsPurchaseCost: 25,
        technicalDiagnosis: '',
        customerExplanation: '',
        internalObservation: '',
        adminReviewStatus: 'PENDING',
        customerReportStatus: '',
        materialRequestStatus: '',
        completedAt: null,
        photo: null,
        parts: []
    },
    {
        id: 2,
        workOrderId: 2,
        mechanicId: 1,
        description: 'Inspeccion general E2E',
        status: 'COMPLETED',
        priority: 'LOW',
        estimatedTime: 45,
        laborPrice: 80,
        laborCost: 30,
        materialsCost: 0,
        materialsPurchaseCost: 0,
        technicalDiagnosis: '',
        customerExplanation: '',
        internalObservation: '',
        adminReviewStatus: 'APPROVED',
        customerReportStatus: '',
        materialRequestStatus: '',
        completedAt: null,
        photo: null,
        parts: []
    }
];

const inventoryItems = [
    {
        id: 1,
        sku: 'E2E-FILTRO-001',
        name: 'Filtro de Aire E2E',
        category: 'Filtros',
        brand: 'AutoService Test',
        purchasePrice: 40,
        unitPrice: 75,
        unitProfit: 35,
        marginPercentage: 46.67,
        qualityTier: 'STANDARD',
        specification: 'Filtro compatible de prueba',
        presentation: 'Unidad',
        unitMeasure: 'UN',
        stock: 12,
        minStock: 5,
        image: ''
    },
    {
        id: 2,
        sku: 'E2E-ACEITE-002',
        name: 'Aceite Sintetico E2E',
        category: 'Lubricantes',
        brand: 'AutoService Test',
        purchasePrice: 60,
        unitPrice: 100,
        unitProfit: 40,
        marginPercentage: 40,
        qualityTier: 'PREMIUM',
        specification: 'Aceite sintetico de prueba',
        presentation: 'Botella',
        unitMeasure: 'UN',
        stock: 8,
        minStock: 3,
        image: ''
    }
];

const mechanics = [
    {
        id: 1,
        fullName: 'Luis Mendoza E2E',
        specialty: 'Mecanica general',
        maxCapacity: 5,
        email: 'mechanic.e2e@example.test'
    }
];

const sendJson = (res, status, data) => {
    res.writeHead(status, {
        'Content-Type': 'application/json'
    });
    res.end(JSON.stringify(data));
};

const server = http.createServer(async (req, res) => {
    const origin = req.headers.origin;

    if (
        origin === 'http://localhost:5173' ||
        origin === 'http://127.0.0.1:5173'
    ) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader(
            'Access-Control-Allow-Headers',
            'Content-Type, Authorization'
        );
        res.setHeader(
            'Access-Control-Allow-Methods',
            'GET, POST, PUT, PATCH, DELETE, OPTIONS'
        );
    }

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'GET' && req.url === '/health') {
        sendJson(res, 200, {
            status: 'ok',
            environment: 'e2e-mock'
        });
        return;
    }

    if (
        req.method === 'POST' &&
        req.url === '/api/v1/auth/sign-in'
    ) {
        try {
            let body = '';

            for await (const chunk of req) {
                body += chunk;

                if (body.length > 10000) {
                    sendJson(res, 413, {
                        message: 'Request too large'
                    });
                    return;
                }
            }

            const credentials = JSON.parse(body);
            const email = credentials.email;
            const password = credentials.password;
            const account = accounts[email];

            if (
                !account ||
                password !== 'e2e-only-password'
            ) {
                sendJson(res, 401, {
                    message: 'Email or password is incorrect'
                });
                return;
            }

            sendJson(res, 200, {
                ...account,
                email,
                token: 'e2e-mock-token'
            });
        } catch {
            sendJson(res, 400, {
                message: 'Invalid JSON request'
            });
        }

        return;
    }

    if (req.method === 'GET' && req.url === '/api/v1/customers') {
        sendJson(res, 200, customers);
        return;
    }

    if (req.method === 'GET' && req.url === '/api/v1/vehicles') {
        sendJson(res, 200, vehicles);
        return;
    }
    if (req.method === 'GET' && req.url === '/api/v1/workorders') {
        sendJson(res, 200, workOrders);
        return;
    }

    if (req.method === 'PUT' && /^\/api\/v1\/workorders\/\d+$/.test(req.url)) {
        let raw = '';
        for await (const chunk of req) raw += chunk;
        const body = JSON.parse(raw);
        const order = workOrders.find(item => item.id === Number(req.url.split('/').pop()));
        if (!order) { sendJson(res, 404, {}); return; }
        if (body.estimatedDate > order.estimatedDate && !body.delayReason?.trim()) {
            sendJson(res, 400, { message: 'Debe indicar el motivo cuando se retrasa la fecha estimada.' }); return;
        }
        Object.assign(order, body);
        sendJson(res, 200, order);
        return;
    }

    // Stateful fixtures for UI persistence assertions. Never connected to production.
    if (req.method === 'POST' && ['/api/v1/workorders', '/api/v1/tasks'].includes(req.url)) {
        let raw = '';
        for await (const chunk of req) raw += chunk;
        const body = JSON.parse(raw);
        if (req.url === '/api/v1/workorders') {
            const order = { ...body, id: Math.max(...workOrders.map(o => o.id)) + 1,
                workshopId: 'e2e-workshop', status: 'PENDING', price: 0,
                trackingCode: `E2E-CREATED-${workOrders.length + 1}` };
            workOrders.push(order);
            sendJson(res, 201, order);
        } else {
            const parts = (body.parts || []).map(part => ({ ...inventoryItems.find(item => item.id === part.inventoryItemId), ...part }));
            const task = { ...body, id: Math.max(...tasks.map(t => t.id)) + 1,
                status: 'PENDING', adminReviewStatus: 'SUBMITTED', parts,
                materialsCost: parts.reduce((sum, part) => sum + part.quantity * part.unitPrice, 0) };
            tasks.push(task);
            sendJson(res, 201, task);
        }
        return;
    }

    if (req.method === 'GET' && req.url.startsWith('/api/v1/tracking/')) {
        const url = new URL(req.url, `http://${HOST}:${PORT}`);
        const order = workOrders.find(item => item.trackingCode === url.searchParams.get('trackingCode'));
        if (url.pathname.endsWith('/summary')) {
            if (!order) { sendJson(res, 404, { message: 'Order not found' }); return; }
            sendJson(res, 200, {
                trackingCode: order.trackingCode, status: order.status, estimatedDate: '2026-12-20',
                progressPercentage: 50, tasks: [], costs: { laborSubtotal: 100, materialsSubtotal: 50, total: 150 },
                history: [{ status: 'IN_PROGRESS', changedAtUtc: '2026-11-01T12:00:00Z' }],
                estimatedDateHistory: [
                    { previousEstimatedDate: null, estimatedDate: '2026-12-15', reason: null, changedAtUtc: '2026-11-01T12:00:00Z' },
                    { previousEstimatedDate: '2026-12-15', estimatedDate: '2026-12-20', reason: 'Repuesto en traslado', changedAtUtc: '2026-11-02T12:00:00Z' }
                ],
                primaryMechanic: { fullName: mechanics[0].fullName, specialty: mechanics[0].specialty }
            });
        } else if (url.pathname.endsWith('/workorders')) {
            sendJson(res, 200, order ? [{ trackingCode: order.trackingCode, status: order.status, estimatedDate: order.estimatedDate,
                vehicleId: order.vehicleId, customerId: order.customerId, workshopId: order.workshopId }] : []);
        } else if (url.pathname.includes('/vehicles/')) sendJson(res, 200, vehicles[0]);
        else if (url.pathname.includes('/customers/')) sendJson(res, 200, customers[0]);
        else if (url.pathname.includes('/workshops/')) sendJson(res, 200, { name: 'Taller E2E' });
        else sendJson(res, 404, {});
        return;
    }

    if (req.method === 'GET' && req.url.startsWith('/api/v1/tasks')) {
        const url = new URL(req.url, `http://${HOST}:${PORT}`);
        const mechanicId = url.searchParams.get('mechanicId');
        const workOrderId = url.searchParams.get('workOrderId');

        let result = tasks;

        if (mechanicId !== null) {
            result = result.filter(
                task => String(task.mechanicId) === mechanicId
            );
        }

        if (workOrderId !== null) {
            result = result.filter(
                task => String(task.workOrderId) === workOrderId
            );
        }

        sendJson(res, 200, result);
        return;
    }

    if (req.method === 'GET' && req.url === '/api/v1/inventoryitems') {
        sendJson(res, 200, inventoryItems);
        return;
    }

    if (req.method === 'GET' && req.url === '/api/v1/mechanics') {
        sendJson(res, 200, mechanics);
        return;
    }

    if (req.method === 'GET' && req.url === '/api/v1/financial-summary') {
        sendJson(res, 200, {
            projectedRevenue: 430,
            realizedRevenue: 0,
            pendingRevenue: 430,
            operatingCost: 95,
            grossProfit: 335,
            marginPercentage: 77.91,
            profitableOrders: 2,
            lossOrders: 0,
            averageTicket: 215,
            periodSeries: [],
            orderProfitability: []
        });
        return;
    }

    sendJson(res, 404, {
        message: 'Mock endpoint not implemented'
    });
});

server.listen(PORT, HOST, () => {
    console.log(
        `E2E Mock API listening on ${HOST}:${PORT}`
    );
});
