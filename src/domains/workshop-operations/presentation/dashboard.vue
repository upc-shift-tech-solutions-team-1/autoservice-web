<script setup>
/**
 * @file AdminDashboardPage.vue
 * @description Dashboard principal para administración de órdenes y métricas.
 */

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

import { useVehicleStore } from '../../fleet-management/application/vehicle.store';
import { useWorkOrderStore } from '../application/work-order.store.js';
import { useTaskStore } from '../application/task.store.js';
import { FinancialService } from '../infrastructure/financial.service.js';

import DashboardHeader from './components/dashboard/DashboardHeader.vue';
import DashboardMetricCard from './components/dashboard/DashboardMetricCard.vue';
import ActiveVehiclesPanel from './components/dashboard/ActiveVehiclesPanel.vue';
import WeeklyIncomePanel from './components/dashboard/WeeklyIncomePanel.vue';
import RecentOrdersPanel from './components/dashboard/RecentOrdersPanel.vue';
import FrequentServicesPanel from './components/dashboard/FrequentServicesPanel.vue';

// ── CONSTANTS FOR DOMAIN LOGIC ───────────────────────────
/** Standardized system work order states */
const ORDER_STATUS = {
  PENDING: 'PENDING',
  PENDING_DIAGNOSIS: 'PENDING_DIAGNOSIS',
  IN_PROGRESS: 'IN_PROGRESS',
  FINISHED: 'FINISHED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED'
};

/** Standardized system task states */
const TASK_STATUS = {
  COMPLETED: 'COMPLETED'
};

const { t, locale } = useI18n();

const router = useRouter();

const vehicleStore = useVehicleStore();
const workOrderStore = useWorkOrderStore();
const taskStore = useTaskStore();

const financialLoading = ref(false);
const financialError = ref(null);
const financialSummaryLoaded = ref(false);

const financialSummary = ref({
  projectedRevenue: 0,
  realizedRevenue: 0,
  pendingRevenue: 0,
  operatingCost: 0,
  grossProfit: 0,
  marginPercentage: 0,
  profitableOrders: 0,
  lossOrders: 0,
  averageTicket: 0,
  periodSeries: [],
  orderProfitability: []
});

const fallbackImage =
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=300&auto=format&fit=crop';

/**
 * Converts a value into a safe numeric value.
 *
 * @param {*} value
 * @param {number} fallback
 * @returns {number}
 */
const toNumber = (value, fallback = 0) => {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue)
      ? parsedValue
      : fallback;
};

/**
 * Formats a numeric value using the Peruvian currency.
 *
 * @param {*} value
 * @returns {string}
 */
const formatCurrency = (value) =>
    toNumber(value).toLocaleString('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    });

/**
 * Formats a percentage value.
 *
 * @param {*} value
 * @returns {string}
 */
const formatPercentage = (value) =>
    `${toNumber(value).toFixed(2)}%`;

/**
 * Loads the consolidated financial summary from the backend.
 */
const fetchFinancialSummary = async () => {
  financialLoading.value = true;
  financialError.value = null;

  try {
    const response = await FinancialService.getSummary();
    const data = response?.data || {};

    financialSummary.value = {
      projectedRevenue: toNumber(data.projectedRevenue),
      realizedRevenue: toNumber(data.realizedRevenue),
      pendingRevenue: toNumber(data.pendingRevenue),
      operatingCost: toNumber(data.operatingCost),
      grossProfit: toNumber(data.grossProfit),
      marginPercentage: toNumber(data.marginPercentage),
      profitableOrders: toNumber(data.profitableOrders),
      lossOrders: toNumber(data.lossOrders),
      averageTicket: toNumber(data.averageTicket),

      periodSeries: Array.isArray(data.periodSeries)
          ? data.periodSeries
          : [],

      orderProfitability: Array.isArray(data.orderProfitability)
          ? data.orderProfitability
          : []
    };

    financialSummaryLoaded.value = true;
  } catch (error) {
    financialError.value =
        error?.response?.data?.message ||
        error?.message ||
        t('dashboard.financial.fetchError');

    console.error(
        'Error cargando el resumen financiero:',
        error
    );
  } finally {
    financialLoading.value = false;
  }
};

onMounted(async () => {
  const results = await Promise.allSettled([
    vehicleStore.fetchVehicles(),
    workOrderStore.fetchWorkOrders(),
    taskStore.fetchAllTasks(),
    fetchFinancialSummary()
  ]);

  results
      .filter(result => result.status === 'rejected')
      .forEach(result => {
        console.error(result.reason);
      });
});

/**
 * Determina si una orden está activa basándose en constantes estándar.
 *
 * @param {string} status
 * @returns {boolean}
 */
const isStatusActive = (status) =>
    [
      ORDER_STATUS.PENDING,
      ORDER_STATUS.PENDING_DIAGNOSIS,
      ORDER_STATUS.IN_PROGRESS
    ].includes(status);

/**
 * Determina si una orden está completada u operacionalmente cerrada basándose en constantes estándar.
 *
 * @param {string} status
 * @returns {boolean}
 */
const isStatusCompleted = (status) =>
    [
      ORDER_STATUS.FINISHED,
      ORDER_STATUS.DELIVERED
    ].includes(status);

/**
 * Vehículos únicos actualmente en taller.
 */
const vehiclesInWorkshop = computed(() => {
  const activeOrders = workOrderStore.workOrders.filter((order) =>
      isStatusActive(order.status)
  );

  const uniqueVehicleIds = new Set(
      activeOrders.map((order) => order.vehicleId)
  );

  return uniqueVehicleIds.size;
});

/**
 * Cantidad de órdenes activas.
 */
const activeOrdersCount = computed(() =>
    workOrderStore.workOrders.filter((order) =>
        isStatusActive(order.status)
    ).length
);

/**
 * Cantidad de órdenes completadas.
 */
const completedOrdersCount = computed(() =>
    workOrderStore.workOrders.filter((order) =>
        isStatusCompleted(order.status)
    ).length
);

/**
 * Ingreso proyectado total.
 * Excluye los estados anulados/cancelados del sistema.
 *
 * Utiliza el resumen financiero del backend cuando está disponible.
 * Mantiene el cálculo local como respaldo.
 */
const projectedIncome = computed(() => {
  if (financialSummaryLoaded.value) {
    return financialSummary.value.projectedRevenue;
  }

  const validOrderIds = workOrderStore.workOrders
      .filter(order => order.status !== ORDER_STATUS.CANCELLED)
      .map(order => order.id);

  return taskStore.tasks
      .filter(task =>
          validOrderIds.some(
              orderId =>
                  String(orderId) ===
                  String(task.workOrderId)
          )
      )
      .reduce(
          (sum, task) =>
              sum +
              toNumber(task.laborPrice) +
              toNumber(task.materialsCost),
          0
      );
});

const ordersWithTotal = computed(() =>
    workOrderStore.workOrders.map(order => {
      const tasks = taskStore.tasks.filter(
          task =>
              String(task.workOrderId) ===
              String(order.id)
      );

      const calculatedTotal = tasks.reduce(
          (sum, task) =>
              sum +
              toNumber(task.laborPrice) +
              toNumber(task.materialsCost),
          0
      );

      return {
        ...order,
        calculatedTotal
      };
    })
);

/**
 * Calcula el progreso de tareas de una orden utilizando códigos globales.
 *
 * @param {string|number} orderId
 * @returns {number}
 */
const getOrderProgress = (orderId) => {
  const tasks = taskStore.tasks.filter(
      (task) =>
          String(task.workOrderId) ===
          String(orderId)
  );

  if (!tasks.length) {
    return 0;
  }

  const completedTasks = tasks.filter(
      (task) => task.status === TASK_STATUS.COMPLETED
  ).length;

  return Math.round(
      (completedTasks / tasks.length) * 100
  );
};

const activeVehiclePreview = computed(() => {
  const activeOrders = workOrderStore.workOrders.filter((order) =>
      isStatusActive(order.status)
  );

  return activeOrders
      .slice(0, 4)
      .map((order) => {
        const vehicle =
            vehicleStore.vehicles.find(
                (v) =>
                    String(v.id) ===
                    String(order.vehicleId)
            ) || {};

        const progress = getOrderProgress(order.id);

        return {
          id: vehicle.id || order.id,
          // CAMBIO: Ahora enviamos el código de la orden y la placa
          orderCode:
              order.trackingCode ||
              `WO-${order.id}`,

          plate:
              vehicle.plate ||
              t('dashboard.defaults.plate'),

          name:
              `${vehicle.brand ||
              t('dashboard.defaults.vehicle')} ` +
              `${vehicle.model || ''}`,

          status:
              progress === 100
                  ? t('dashboard.vehicleStatus.qaReady')
                  : t('dashboard.vehicleStatus.inRepair'),

          severity:
              progress === 100
                  ? 'success'
                  : 'info',

          progress,
          image: vehicle.image || fallbackImage
        };
      })
      .sort((a, b) => b.progress - a.progress);
});

/**
 * Servicios más frecuentes.
 */
const frequentServices = computed(() => {
  const taskMap = {};

  taskStore.tasks.forEach((task) => {
    const serviceName = task.description;

    if (!serviceName) {
      return;
    }

    if (!taskMap[serviceName]) {
      taskMap[serviceName] = {
        name: serviceName,
        count: 0,
        amount: 0
      };
    }

    taskMap[serviceName].count += 1;

    taskMap[serviceName].amount +=
        toNumber(task.laborPrice) +
        toNumber(task.materialsCost);
  });

  const sortedServices = Object.values(taskMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

  const maxCount = sortedServices[0]?.count || 1;

  const icons = [
    'pi pi-cog',
    'pi pi-wrench',
    'pi pi-bolt'
  ];

  return sortedServices.map((service, index) => ({
    ...service,
    progress: Math.round(
        (service.count / maxCount) * 100
    ),
    icon: icons[index % icons.length]
  }));
});

/**
 * Datos financieros semanales.
 * Utiliza la serie enviada por el backend y mantiene
 * el cálculo anterior como respaldo.
 */
const weeklyIncomeData = computed(() => {
  const backendSeries =
      financialSummary.value.periodSeries;

  if (
      financialSummaryLoaded.value &&
      backendSeries.length > 0
  ) {
    const labels = backendSeries.map(
        item => item.label
    );

    const revenues = backendSeries.map(
        item => toNumber(item.revenue)
    );

    const costs = backendSeries.map(
        item => toNumber(item.cost)
    );

    const profits = backendSeries.map(
        item => toNumber(item.profit)
    );

    const totalWeek = revenues.reduce(
        (sum, value) => sum + value,
        0
    );

    return {
      total: totalWeek,
      chartData: {
        labels,
        datasets: [
          {
            label: t('dashboard.financial.chart.income'),
            data: revenues,
            backgroundColor: '#0b1680',
            borderRadius: 10
          },
          {
            label: t('dashboard.financial.chart.costs'),
            data: costs,
            backgroundColor: '#f59e0b',
            borderRadius: 10
          },
          {
            label: t('dashboard.financial.chart.profit'),
            data: profits,
            backgroundColor: '#16a34a',
            borderRadius: 10
          }
        ]
      }
    };
  }

  const labels = [];
  const data = [];

  let totalWeek = 0;

  for (let i = 5; i >= 0; i -= 1) {
    const currentDate = new Date();

    currentDate.setDate(
        currentDate.getDate() - i
    );

    labels.push(
        currentDate
            .toLocaleDateString(locale.value, {
              weekday: 'short'
            })
            .replace('.', '')
            .toUpperCase()
    );

    const dateString =
        currentDate.toISOString().split('T')[0];

    const dayTotal = ordersWithTotal.value
        .filter(
            order =>
                order.startDate === dateString &&
                order.status !== ORDER_STATUS.CANCELLED
        )
        .reduce(
            (sum, order) =>
                sum + order.calculatedTotal,
            0
        );

    data.push(dayTotal);
    totalWeek += dayTotal;
  }

  return {
    total: totalWeek,
    chartData: {
      labels,
      datasets: [
        {
          label:
              t('dashboard.charts.weeklyIncomeLabel'),

          data,

          backgroundColor: [
            '#dbeafe',
            '#bfdbfe',
            '#dbeafe',
            '#bfdbfe',
            '#0b1680',
            '#e5e7eb'
          ],

          borderRadius: 12
        }
      ]
    }
  };
});

/**
 * Configuración del gráfico de barras.
 */
const barChartOptions = ref({
  maintainAspectRatio: false,

  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: {
        usePointStyle: true,
        boxWidth: 8,
        color: '#64748b'
      }
    },

    tooltip: {
      callbacks: {
        label: (context) =>
            `${context.dataset.label}: ` +
            `${formatCurrency(context.raw)}`
      }
    }
  },

  scales: {
    x: {
      grid: {
        display: false
      },

      ticks: {
        color: '#64748b',

        font: {
          weight: 'bold'
        }
      }
    },

    y: {
      beginAtZero: true,

      grid: {
        color: '#eef2f7',
        borderDash: [5, 5]
      },

      border: {
        display: false
      }
    }
  }
});

/**
 * Últimas órdenes registradas.
 */
const recentOrders = computed(() =>
    [...ordersWithTotal.value]
        .reverse()
        .slice(0, 5)
);

/**
 * Normalizes backend order profitability information
 * for dashboard visualization.
 */
const orderProfitability = computed(() =>
    financialSummary.value.orderProfitability
        .map(item => {
          const revenue = toNumber(
              item.revenue ??
              item.totalRevenue ??
              item.price
          );

          const cost = toNumber(
              item.cost ??
              item.totalCost ??
              item.operatingCost
          );

          const profit = toNumber(
              item.profit ??
              item.grossProfit,
              revenue - cost
          );

          const marginPercentage = toNumber(
              item.marginPercentage,
              revenue > 0
                  ? (profit / revenue) * 100
                  : 0
          );

          const workOrderId =
              item.workOrderId ??
              item.orderId ??
              item.id;

          return {
            ...item,
            workOrderId,

            trackingCode:
                item.trackingCode ||
                item.orderCode ||
                `WO-${workOrderId}`,

            revenue,
            cost,
            profit,
            marginPercentage
          };
        })
        .sort((firstOrder, secondOrder) =>
            secondOrder.profit -
            firstOrder.profit
        )
);

const financialResultLabel = computed(() =>
    financialSummary.value.grossProfit >= 0
        ? t('dashboard.financial.grossProfit')
        : t('dashboard.financial.grossLoss')
);
</script>

<template>
  <section class="admin-dashboard">
    <DashboardHeader
        @create-order="router.push('/work-orders/new')"
        @view-orders="router.push('/work-orders')"
    />

    <div class="kpi-grid">
      <DashboardMetricCard
          :title="t('dashboard.metrics.activeVehicles')"
          :value="vehiclesInWorkshop"
          :subtitle="t('dashboard.metrics.activeVehiclesSub')"
          icon="pi pi-car"
          color="blue"
      />

      <DashboardMetricCard
          :title="t('dashboard.metrics.activeOrders')"
          :value="activeOrdersCount"
          :subtitle="t('dashboard.metrics.activeOrdersSub')"
          icon="pi pi-file-edit"
          color="indigo"
      />

      <DashboardMetricCard
          :title="t('dashboard.metrics.completed')"
          :value="completedOrdersCount"
          :subtitle="t('dashboard.metrics.completedSub')"
          icon="pi pi-check-circle"
          color="green"
      />

      <DashboardMetricCard
          :title="t('dashboard.metrics.projectedRevenue')"
          :value="formatCurrency(projectedIncome)"
          :subtitle="t('dashboard.metrics.projectedRevenueSub')"
          icon="pi pi-wallet"
          color="violet"
      />
    </div>

    <section class="financial-overview">
      <div class="section-heading">
        <div>
          <span class="section-eyebrow">
            {{ $t('dashboard.financial.eyebrow') }}
          </span>

          <h2>{{ $t('dashboard.financial.title') }}</h2>

          <p>
            {{ $t('dashboard.financial.description') }}
          </p>
        </div>

        <button
            type="button"
            class="refresh-financial-button"
            :disabled="financialLoading"
            @click="fetchFinancialSummary"
        >
          <i
              class="pi"
              :class="
                financialLoading
                  ? 'pi-spin pi-spinner'
                  : 'pi-refresh'
              "
          ></i>

          {{ $t('dashboard.financial.refresh') }}
        </button>
      </div>

      <div
          v-if="financialError"
          class="financial-error"
      >
        <i class="pi pi-exclamation-triangle"></i>
        {{ financialError }}
      </div>

      <div class="financial-kpi-grid">
        <article class="financial-card">
          <div class="financial-icon blue">
            <i class="pi pi-chart-line"></i>
          </div>

          <div>
            <span>{{ $t('dashboard.financial.projectedRevenue') }}</span>
            <strong>
              {{
                formatCurrency(
                    financialSummary.projectedRevenue
                )
              }}
            </strong>

            <small>
              {{ $t('dashboard.financial.projectedRevenueDesc') }}
            </small>
          </div>
        </article>

        <article class="financial-card">
          <div class="financial-icon green">
            <i class="pi pi-check-circle"></i>
          </div>

          <div>
            <span>{{ $t('dashboard.financial.realizedRevenue') }}</span>
            <strong>
              {{
                formatCurrency(
                    financialSummary.realizedRevenue
                )
              }}
            </strong>

            <small>
              {{ $t('dashboard.financial.realizedRevenueDesc') }}
            </small>
          </div>
        </article>

        <article class="financial-card">
          <div class="financial-icon orange">
            <i class="pi pi-clock"></i>
          </div>

          <div>
            <span>{{ $t('dashboard.financial.pendingRevenue') }}</span>
            <strong>
              {{
                formatCurrency(
                    financialSummary.pendingRevenue
                )
              }}
            </strong>

            <small>
              {{ $t('dashboard.financial.pendingRevenueDesc') }}
            </small>
          </div>
        </article>

        <article class="financial-card">
          <div class="financial-icon red">
            <i class="pi pi-arrow-down"></i>
          </div>

          <div>
            <span>{{ $t('dashboard.financial.operatingCost') }}</span>
            <strong>
              {{
                formatCurrency(
                    financialSummary.operatingCost
                )
              }}
            </strong>

            <small>
              {{ $t('dashboard.financial.operatingCostDesc') }}
            </small>
          </div>
        </article>

        <article
            class="financial-card result-card"
            :class="{
              positive:
                financialSummary.grossProfit >= 0,
              negative:
                financialSummary.grossProfit < 0
            }"
        >
          <div
              class="financial-icon"
              :class="
                financialSummary.grossProfit >= 0
                  ? 'green'
                  : 'red'
              "
          >
            <i
                class="pi"
                :class="
                  financialSummary.grossProfit >= 0
                    ? 'pi-arrow-up'
                    : 'pi-arrow-down'
                "
            ></i>
          </div>

          <div>
            <span>{{ financialResultLabel }}</span>

            <strong>
              {{
                formatCurrency(
                    financialSummary.grossProfit
                )
              }}
            </strong>

            <small>
              {{ $t('dashboard.financial.margin') }}
              {{
                formatPercentage(
                    financialSummary.marginPercentage
                )
              }}
            </small>
          </div>
        </article>

        <article class="financial-card">
          <div class="financial-icon violet">
            <i class="pi pi-receipt"></i>
          </div>

          <div>
            <span>{{ $t('dashboard.financial.averageTicket') }}</span>

            <strong>
              {{
                formatCurrency(
                    financialSummary.averageTicket
                )
              }}
            </strong>

            <small>
              {{ $t('dashboard.financial.ticketStats', { profitable: financialSummary.profitableOrders, loss: financialSummary.lossOrders }) }}
            </small>
          </div>
        </article>
      </div>
    </section>

    <div class="dashboard-grid">
      <ActiveVehiclesPanel
          :vehicles="activeVehiclePreview"
          @view-vehicles="router.push('/vehicles')"
      />

      <WeeklyIncomePanel
          :weeklyIncome="weeklyIncomeData.total"
          :chartData="weeklyIncomeData.chartData"
          :chartOptions="barChartOptions"
      />

      <RecentOrdersPanel
          :orders="recentOrders"
          @view-orders="router.push('/work-orders')"
      />

      <FrequentServicesPanel
          :services="frequentServices"
      />
    </div>

    <section class="profitability-panel">
      <div class="section-heading">
        <div>
          <span class="section-eyebrow">
            {{ $t('dashboard.profitability.eyebrow') }}
          </span>

          <h2>{{ $t('dashboard.profitability.title') }}</h2>

          <p>
            {{ $t('dashboard.profitability.description') }}
          </p>
        </div>
      </div>

      <div
          v-if="orderProfitability.length > 0"
          class="profitability-table-wrapper"
      >
        <table class="profitability-table">
          <thead>
          <tr>
            <th>{{ $t('dashboard.profitability.columns.order') }}</th>
            <th>{{ $t('dashboard.profitability.columns.income') }}</th>
            <th>{{ $t('dashboard.profitability.columns.costs') }}</th>
            <th>{{ $t('dashboard.profitability.columns.result') }}</th>
            <th>{{ $t('dashboard.profitability.columns.margin') }}</th>
            <th>{{ $t('dashboard.profitability.columns.status') }}</th>
          </tr>
          </thead>

          <tbody>
          <tr
              v-for="order in orderProfitability"
              :key="order.workOrderId"
          >
            <td>
              <strong>
                {{ order.trackingCode }}
              </strong>
            </td>

            <td>
              {{ formatCurrency(order.revenue) }}
            </td>

            <td>
              {{ formatCurrency(order.cost) }}
            </td>

            <td
                :class="{
                    'positive-value':
                        order.profit >= 0,

                    'negative-value':
                        order.profit < 0
                  }"
            >
              {{ formatCurrency(order.profit) }}
            </td>

            <td>
              {{
                formatPercentage(
                    order.marginPercentage
                )
              }}
            </td>

            <td>
                <span
                    class="profitability-status"
                    :class="
                      order.profit >= 0
                        ? 'profitable'
                        : 'loss'
                    "
                >
                  {{
                    order.profit >= 0
                        ? $t('dashboard.profitability.status.profitable')
                        : $t('dashboard.profitability.status.loss')
                  }}
                </span>
            </td>
          </tr>
          </tbody>
        </table>
      </div>

      <div
          v-else
          class="profitability-empty"
      >
        <i class="pi pi-chart-bar"></i>

        <h3>{{ $t('dashboard.profitability.empty.title') }}</h3>

        <p>
          {{ $t('dashboard.profitability.empty.description') }}
        </p>
      </div>
    </section>
  </section>
</template>

<style scoped>
.admin-dashboard {
  min-height: 100%;
  padding-bottom: 2rem;
}

.kpi-grid {
  display: grid;
  grid-template-columns:
      repeat(4, minmax(0, 1fr));
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1.35fr 0.9fr;
  gap: 1.5rem;
}

.financial-overview,
.profitability-panel {
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  border: 1px solid #e8edf5;
  border-radius: 24px;
  background: #ffffff;
  box-shadow:
      0 12px 28px rgba(15, 23, 42, 0.05);
}

.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.4rem;
}

.section-eyebrow {
  display: block;
  margin-bottom: 0.35rem;
  color: #0b1680;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.section-heading h2 {
  margin: 0;
  color: #0f172a;
  font-size: 1.35rem;
}

.section-heading p {
  max-width: 680px;
  margin: 0.4rem 0 0;
  color: #64748b;
  line-height: 1.5;
}

.refresh-financial-button {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1rem;
  border: 1px solid #c7d2fe;
  border-radius: 12px;
  background: #eef2ff;
  color: #0b1680;
  font-weight: 700;
  cursor: pointer;
}

.refresh-financial-button:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.financial-error {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1rem;
  padding: 0.9rem 1rem;
  border: 1px solid #fecaca;
  border-radius: 14px;
  background: #fef2f2;
  color: #b91c1c;
  font-weight: 600;
}

.financial-kpi-grid {
  display: grid;
  grid-template-columns:
      repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.financial-card {
  display: flex;
  min-width: 0;
  align-items: flex-start;
  gap: 0.9rem;
  padding: 1rem;
  border: 1px solid #e8edf5;
  border-radius: 18px;
  background: #f8fafc;
}

.financial-icon {
  display: flex;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  font-size: 1.1rem;
}

.financial-icon.blue {
  background: #dbeafe;
  color: #2563eb;
}

.financial-icon.green {
  background: #dcfce7;
  color: #16a34a;
}

.financial-icon.orange {
  background: #ffedd5;
  color: #ea580c;
}

.financial-icon.red {
  background: #fee2e2;
  color: #dc2626;
}

.financial-icon.violet {
  background: #ede9fe;
  color: #7c3aed;
}

.financial-card > div:last-child {
  min-width: 0;
}

.financial-card span {
  display: block;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 700;
}

.financial-card strong {
  display: block;
  margin-top: 0.3rem;
  overflow-wrap: anywhere;
  color: #0f172a;
  font-size: 1.3rem;
}

.financial-card small {
  display: block;
  margin-top: 0.35rem;
  color: #94a3b8;
  line-height: 1.35;
}

.financial-card.result-card.positive strong {
  color: #15803d;
}

.financial-card.result-card.negative strong {
  color: #dc2626;
}

.profitability-table-wrapper {
  overflow-x: auto;
}

.profitability-table {
  width: 100%;
  border-collapse: collapse;
}

.profitability-table th,
.profitability-table td {
  padding: 0.9rem 1rem;
  border-bottom: 1px solid #eef2f7;
  text-align: left;
  white-space: nowrap;
}

.profitability-table th {
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.profitability-table td {
  color: #334155;
  font-size: 0.9rem;
}

.profitability-table td strong {
  color: #0f172a;
}

.positive-value {
  color: #15803d !important;
  font-weight: 800;
}

.negative-value {
  color: #dc2626 !important;
  font-weight: 800;
}

.profitability-status {
  display: inline-flex;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 800;
}

.profitability-status.profitable {
  background: #dcfce7;
  color: #15803d;
}

.profitability-status.loss {
  background: #fee2e2;
  color: #dc2626;
}

.profitability-empty {
  display: flex;
  min-height: 220px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: #64748b;
}

.profitability-empty > i {
  margin-bottom: 0.8rem;
  color: #94a3b8;
  font-size: 2.5rem;
}

.profitability-empty h3 {
  margin: 0;
  color: #334155;
}

.profitability-empty p {
  max-width: 520px;
  margin: 0.5rem 0 0;
  line-height: 1.5;
}

@media (max-width: 1200px) {
  .kpi-grid {
    grid-template-columns:
        repeat(2, minmax(0, 1fr));
  }

  .financial-kpi-grid {
    grid-template-columns:
        repeat(2, minmax(0, 1fr));
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .kpi-grid,
  .financial-kpi-grid {
    grid-template-columns: 1fr;
  }

  .section-heading {
    flex-direction: column;
  }

  .refresh-financial-button {
    width: 100%;
    justify-content: center;
  }

  .financial-overview,
  .profitability-panel {
    padding: 1rem;
  }
}
</style>