<template>
  <v-card>
    <v-card-title class="justify-center">
      <v-icon left>
        mdi-chart-timeline-variant
      </v-icon>
      Historial de Períodos de Corte
    </v-card-title>

    <!-- Panel de estadísticas generales -->
    <v-card-text v-if="advancedStats">
      <v-row>
        <v-col cols="12" md="3">
          <v-card outlined class="text-center pa-2">
            <v-icon large color="primary">
              mdi-calendar-multiple
            </v-icon>
            <div class="text-h6">
              {{ advancedStats.totalPeriods }}
            </div>
            <div class="text-caption">
              Períodos Total
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card outlined class="text-center pa-2">
            <v-icon large color="success">
              mdi-account-multiple
            </v-icon>
            <div class="text-h6">
              {{ advancedStats.totalServices }}
            </div>
            <div class="text-caption">
              Servicios Cortados
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card outlined class="text-center pa-2">
            <v-icon large color="red">
              mdi-currency-usd
            </v-icon>
            <div class="text-h6">
              {{ formatCurrency(advancedStats.totalBalance) }}
            </div>
            <div class="text-caption">
              Saldo Total
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card outlined class="text-center pa-2">
            <v-icon large color="orange">
              mdi-chart-line
            </v-icon>
            <div class="text-h6">
              {{ advancedStats.averageServicesPerPeriod }}
            </div>
            <div class="text-caption">
              Promedio por Período
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Distribución de tipos de proceso -->
      <v-row class="mt-2">
        <v-col cols="12" md="6">
          <v-card outlined>
            <v-card-title class="text-h6">
              <v-icon left>
                mdi-chart-donut
              </v-icon>
              Tipos de Proceso
            </v-card-title>
            <v-card-text>
              <div class="d-flex justify-space-between mb-2">
                <span>Automático (Balance):</span>
                <v-chip color="primary">
                  {{ advancedStats.balanceProcesses }}
                </v-chip>
              </div>
              <div class="d-flex justify-space-between">
                <span>Manual (Códigos):</span>
                <v-chip color="secondary">
                  {{ advancedStats.manualProcesses }}
                </v-chip>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="6">
          <v-card outlined>
            <v-card-title class="text-h6">
              <v-icon left>
                mdi-progress-check
              </v-icon>
              Estado General
            </v-card-title>
            <v-card-text>
              <div class="d-flex justify-space-between mb-2">
                <span>Períodos Completados:</span>
                <v-chip color="success">
                  {{ advancedStats.finishedPeriods }}
                </v-chip>
              </div>
              <div class="d-flex justify-space-between">
                <span>En Proceso:</span>
                <v-chip color="warning">
                  {{ advancedStats.totalPeriods - advancedStats.finishedPeriods }}
                </v-chip>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>

    <v-card-text class="d-flex">
      <MiscPrintDx :services="selected" />
      <v-tooltip top>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            color="white black--text"
            class="rounded-xl"
            v-bind="attrs"
            :loading="loading"
            :disabled="loading"
            v-on="on"
            @click="getBillingPeriods"
          >
            <v-icon>mdi-reload</v-icon>
          </v-btn>
        </template>
        <span>Refrescar Estado</span>
      </v-tooltip>
      <v-spacer />
      <v-tooltip top>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            color="red darken-4"
            class="rounded-xl"
            v-bind="attrs"
            :loading="loading"
            :disabled="loading"
            v-on="on"
            @click="retire(selected)"
          >
            <v-icon>mdi-cancel</v-icon>
          </v-btn>
        </template>
        <span>Retirar Usuarios</span>
      </v-tooltip>
    </v-card-text>

    <v-card-text>
      <v-expansion-panels
        v-model="panel"
        variant="accordion"
      >
        <v-expansion-panel
          v-for="billingperiod in billingperiods"
          :key="billingperiod.id"
          @click="getServices(billingperiod)"
        >
          <v-expansion-panel-header v-if="billingperiods.length > 0" class="justify-center">
            <div class="d-flex align-items-center w-100">
              <div class="flex-grow-1">
                <div class="font-weight-medium">
                  {{ billingperiod.month ? months[billingperiod.month - 1].name + ' ' + billingperiod.year : 'No Definido' }}
                </div>
                <div v-if="billingperiod.processType === 'balance'" class="text-caption">
                  <v-icon small color="primary">
                    mdi-autorenew
                  </v-icon>
                  Automático - Balance ≥ {{ formatCurrency(billingperiod.minimumBalance) }}
                </div>
                <div v-else class="text-caption">
                  <v-icon small color="secondary">
                    mdi-pencil
                  </v-icon>
                  Manual - {{ billingperiod.successes || 0 }} códigos
                </div>
              </div>

              <div class="ml-4">
                <div v-if="billingperiod.finished === false">
                  <v-chip color="green darken-3" x-small class="mr-1">
                    ✓ {{ billingperiod.successes || 0 }}
                  </v-chip>
                  <v-chip color="red darken-3" x-small>
                    ✗ {{ billingperiod.errors || 0 }}
                  </v-chip>
                  <v-progress-linear class="mt-2" indeterminate />
                </div>
                <div v-else class="d-flex flex-column align-items-end">
                  <v-chip color="success" x-small class="mb-1">
                    <v-icon left x-small>
                      mdi-check
                    </v-icon>
                    Finalizado
                  </v-chip>
                  <div v-if="billingperiod.totalBalance" class="text-caption">
                    {{ formatCurrency(billingperiod.totalBalance) }}
                  </div>
                </div>
              </div>
            </div>
          </v-expansion-panel-header>

          <v-expansion-panel-content>
            <!-- Información adicional del período -->
            <v-row v-if="billingperiod.processType === 'balance'" class="mb-3">
              <v-col cols="12" md="6">
                <v-card outlined class="pa-2">
                  <div class="text-subtitle2 mb-2">
                    Información del Proceso Automático
                  </div>
                  <div class="d-flex justify-space-between mb-1">
                    <span>Saldo mínimo:</span>
                    <span class="font-weight-medium">{{ formatCurrency(billingperiod.minimumBalance) }}</span>
                  </div>
                  <div class="d-flex justify-space-between mb-1">
                    <span>Saldo promedio:</span>
                    <span class="font-weight-medium">{{ formatCurrency(billingperiod.averageBalance) }}</span>
                  </div>
                  <div class="d-flex justify-space-between">
                    <span>Total recuperado:</span>
                    <span class="font-weight-medium text-success">{{ formatCurrency(billingperiod.totalBalance) }}</span>
                  </div>
                </v-card>
              </v-col>
              <v-col cols="12" md="6">
                <v-card outlined class="pa-2">
                  <div class="text-subtitle2 mb-2">
                    Métricas de Eficiencia
                  </div>
                  <div class="d-flex justify-space-between mb-1">
                    <span>Tasa de éxito:</span>
                    <span class="font-weight-medium">{{ getSuccessRate(billingperiod) }}%</span>
                  </div>
                  <div class="d-flex justify-space-between mb-1">
                    <span>Servicios procesados:</span>
                    <span class="font-weight-medium">{{ (billingperiod.successes || 0) + (billingperiod.errors || 0) }}</span>
                  </div>
                  <div class="d-flex justify-space-between">
                    <span>Fecha de creación:</span>
                    <span class="font-weight-medium">{{ formatDate(billingperiod.createdAt) }}</span>
                  </div>
                </v-card>
              </v-col>
            </v-row>

            <v-text-field
              v-model="search"
              append-icon="mdi-magnify"
              label="Realizar Búsqueda"
              style="max-width:500px;"
              outlined
              dense
              hide-details
            />
            <v-data-table
              v-model="selected"
              :headers="enhancedHeaders"
              :items="services"
              :loading="loading"
              :search="search"
              show-select
            >
              <template v-slot:[`item.balance`]="{ item }">
                <v-chip :color="getBalanceColor(item.balance)" small>
                  {{ formatCurrency(item.balance || 0) }}
                </v-chip>
              </template>
              <template v-slot:[`item.address`]="{ item }">
                <span>{{ item.address }}</span>
              </template>
              <template v-slot:[`item.neighborhood`]="{ item }">
                <span>{{ item.neighborhood }}</span>
              </template>
              <template v-slot:[`item.normalized_client.name`]="{ item }">
                {{ item.normalized_client?.name || item.client_name || 'N/A' }}
              </template>
              <template v-slot:[`item.normalized_client.phone`]="{ item }">
                {{ item.normalized_client?.phone || item.phone || 'N/A' }}
              </template>
              <template v-slot:[`item.id`]="{ item }">
                <v-btn
                  small
                  color="red darken-4"
                  @click="retire([item])"
                >
                  <v-icon>mdi-cancel</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  data () {
    return {
      panel: [0, 1],
      prepare: false,
      loading: false,
      billingperiods: [],
      lastbillingperiod: {},
      services: [],
      search: '',
      selected: [],
      advancedStats: null,
      enhancedHeaders: [
        { text: 'Código', value: 'code', sortable: false },
        { text: 'Nombre', value: 'normalized_client.name', sortable: false },
        { text: 'Teléfono', value: 'normalized_client.phone', sortable: false },
        { text: 'Dirección', value: 'address', sortable: false },
        { text: 'Barrio', value: 'neighborhood', sortable: false },
        { text: 'Saldo', value: 'balance', sortable: true },
        { text: 'Acciones', value: 'id', sortable: false }
      ],
      months: [
        { id: 1, name: 'Enero' },
        { id: 2, name: 'Febrero' },
        { id: 3, name: 'Marzo' },
        { id: 4, name: 'Abril' },
        { id: 5, name: 'Mayo' },
        { id: 6, name: 'Junio' },
        { id: 7, name: 'Julio' },
        { id: 8, name: 'Agosto' },
        { id: 9, name: 'Septiembre' },
        { id: 10, name: 'Octubre' },
        { id: 11, name: 'Noviembre' },
        { id: 12, name: 'Diciembre' }
      ]
    }
  },
  computed: {
    city () {
      return this.$store.state.company.cities.find(city => city.name === this.$route.query.city)
    }
  },
  watch: {},
  mounted () {
    this.getBillingPeriods()
    this.getAdvancedStats()
  },
  methods: {
    async getServices (billingperiod) {
      this.lastbillingperiod = billingperiod
      this.loading = true
      await this.$store.dispatch('cuts/getServicesByBillingPeriod', {
        token: this.$store.state.auth.token,
        clienttype: this.$route.query.clienttype,
        city: this.$route.query.city,
        month: billingperiod.month,
        year: billingperiod.year,
        indebt: true,
        active: true
      }).then((services) => {
        if (services && services.length > 0) {
          services.forEach((service) => {
            service.service_addresses.sort((a, b) => {
              return new Date(b.createdAt) - new Date(a.createdAt)
            })
          })
        }
        this.services = services
        this.loading = false
      })
    },
    async getBillingPeriods () {
      await this.$store.dispatch('cuts/getBillingPeriods', {
        token: this.$store.state.auth.token,
        clienttype: this.$route.query.clienttype,
        city: this.$route.query.city
      }).then((billingperiods) => {
        this.billingperiods = billingperiods
      })
    },
    async getAdvancedStats () {
      try {
        const result = await this.$store.dispatch('cuts/getAdvancedBillingPeriodStats', {
          token: this.$store.state.auth.token,
          city: this.$route.query.city,
          clienttype: this.$route.query.clienttype
        })
        this.advancedStats = result.stats
      } catch (error) {
        console.error('Error al obtener estadísticas avanzadas:', error)
      }
    },
    async retire (services) {
      if (services.length < 1) {
        this.$toast.error('Selecciona los servicios antes de retirar', { position: 'bottom-center' })
        return
      }
      this.$toast.info('Aplicando cortes. Por favor espere...', { duration: 5000, position: 'bottom-center' })
      this.loading = true
      for (let i = 0; i < services.length; i++) {
        await this.$store.dispatch('cuts/retireService', {
          token: this.$store.state.auth.token,
          service: services[i],
          active: false,
          indebt: false
        })
        await this.$store.dispatch('offer/setNewDebt', {
          token: this.$store.state.auth.token,
          city: this.city,
          isindebt: false,
          isretired: true,
          isBulkDx: false,
          service: services[i],
          comment: 'RETIRO DESDE INTERFAZ SUSPENCIONES',
          technician: this.$store.state.auth
        })
      }
      this.getServices(this.lastbillingperiod)
      this.loading = false
      this.$toast.info('Proceso finalizado correctamente', { duration: 5000, position: 'bottom-center' })
    },
    formatCurrency (amount) {
      if (!amount || amount === 0) { return '$0' }
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
      }).format(amount)
    },
    formatDate (dateString) {
      if (!dateString) { return 'N/A' }
      return new Date(dateString).toLocaleDateString('es-CO')
    },
    getBalanceColor (balance) {
      if (balance >= 100000) { return 'red darken-2' }
      if (balance >= 60000) { return 'orange darken-2' }
      if (balance >= 30000) { return 'yellow darken-2' }
      return 'grey'
    },
    getSuccessRate (billingperiod) {
      const total = (billingperiod.successes || 0) + (billingperiod.errors || 0)
      if (total === 0) { return 0 }
      return Math.round(((billingperiod.successes || 0) / total) * 100)
    }
  }
}
</script>
