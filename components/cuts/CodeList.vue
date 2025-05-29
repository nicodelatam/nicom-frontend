<template>
  <div>
    <!-- Selector de método -->
    <v-card outlined class="mb-4">
      <v-card-title>
        <v-icon left>
          mdi-cog
        </v-icon>
        Método de Selección de Servicios
      </v-card-title>
      <v-card-text>
        <v-radio-group v-model="selectionMethod" row>
          <v-radio
            label="Automático por Saldo"
            value="balance"
            color="primary"
          >
            <template v-slot:label>
              <div>
                <span class="font-weight-medium">Automático por Saldo</span>
                <br>
                <small class="text--secondary">Buscar servicios con saldo mínimo específico</small>
              </div>
            </template>
          </v-radio>
          <v-radio
            label="Manual por Códigos"
            value="manual"
            color="secondary"
          >
            <template v-slot:label>
              <div>
                <span class="font-weight-medium">Manual por Códigos</span>
                <br>
                <small class="text--secondary">Ingresar códigos específicos manualmente</small>
              </div>
            </template>
          </v-radio>
        </v-radio-group>
      </v-card-text>
    </v-card>

    <!-- Método automático por balance -->
    <div v-if="selectionMethod === 'balance'">
      <v-row>
        <v-col cols="12" md="6">
          <v-text-field
            v-model.number="minimumBalance"
            outlined
            type="number"
            label="Saldo mínimo para corte (COP)"
            hint="Servicios con este saldo o mayor serán incluidos en el corte"
            persistent-hint
            :rules="[rules.required, rules.positive]"
            prepend-inner-icon="mdi-currency-usd"
          />

          <!-- Filtros avanzados -->
          <v-expansion-panels class="mt-3" flat>
            <v-expansion-panel>
              <v-expansion-panel-header>
                <template v-slot:default="{ open }">
                  <v-row no-gutters>
                    <v-col cols="4" class="d-flex align-center">
                      <v-icon color="primary">
                        mdi-filter-variant
                      </v-icon>
                      <span class="ml-2">Filtros Avanzados</span>
                    </v-col>
                    <v-col cols="8" class="text--secondary">
                      <v-fade-transition leave-absolute>
                        <span v-if="open">Configurar filtros adicionales</span>
                        <span v-else>{{ getActiveFiltersText() }}</span>
                      </v-fade-transition>
                    </v-col>
                  </v-row>
                </template>
              </v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model.number="filters.maxBalance"
                      outlined
                      type="number"
                      label="Saldo máximo (opcional)"
                      hint="Limitar búsqueda hasta este saldo"
                      persistent-hint
                      prepend-inner-icon="mdi-currency-usd-off"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="filters.stratum"
                      :items="stratumOptions"
                      outlined
                      label="Estrato (opcional)"
                      hint="Filtrar por estrato socioeconómico"
                      persistent-hint
                      clearable
                      prepend-inner-icon="mdi-home-variant"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="filters.neighborhood"
                      outlined
                      label="Barrio (opcional)"
                      hint="Filtrar por nombre de barrio"
                      persistent-hint
                      clearable
                      prepend-inner-icon="mdi-map-marker"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="filters.monthsInDebt"
                      :items="monthsInDebtOptions"
                      outlined
                      label="Meses en mora (opcional)"
                      hint="Basado en el período de facturación"
                      persistent-hint
                      clearable
                      prepend-inner-icon="mdi-calendar-clock"
                    />
                  </v-col>
                </v-row>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-switch
                      v-model="incluirCortados"
                      color="warning"
                      label="Incluir servicios ya cortados"
                      hint="Para revisión o re-proceso"
                      persistent-hint
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-switch
                      v-model="permitirDuplicados"
                      color="error"
                      label="Permitir proceso duplicado"
                      hint="Crear nuevo período aunque ya exista uno"
                      persistent-hint
                    />
                  </v-col>
                </v-row>
                <v-row>
                  <v-col>
                    <v-btn
                      color="secondary"
                      outlined
                      small
                      @click="clearFilters"
                    >
                      <v-icon left>
                        mdi-filter-remove
                      </v-icon>
                      Limpiar Filtros
                    </v-btn>
                  </v-col>
                </v-row>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>

          <v-btn
            color="primary"
            :disabled="!minimumBalance || loadingServices"
            :loading="loadingServices"
            class="mt-3"
            @click="searchServices"
          >
            <v-icon left>
              mdi-magnify
            </v-icon>
            Buscar Servicios
          </v-btn>
        </v-col>
        <v-col cols="12" md="6">
          <v-card outlined>
            <v-card-title class="text-h6">
              <v-icon left>
                mdi-chart-line
              </v-icon>
              Estadísticas
            </v-card-title>
            <v-card-text>
              <div class="d-flex justify-space-between mb-2">
                <span>Servicios encontrados:</span>
                <v-chip :color="foundServices.length > 0 ? 'primary' : 'grey'">
                  {{ foundServices.length }}
                </v-chip>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span>Saldo total:</span>
                <v-chip :color="totalBalance > 0 ? 'red' : 'grey'">
                  {{ formatCurrency(totalBalance) }}
                </v-chip>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span>Promedio por servicio:</span>
                <v-chip :color="averageBalance > 0 ? 'orange' : 'grey'">
                  {{ formatCurrency(averageBalance) }}
                </v-chip>
              </div>
              <div v-if="foundServices.length > 0" class="d-flex justify-space-between">
                <span>Rango de saldo:</span>
                <v-chip color="info" small>
                  {{ formatCurrency(minBalance) }} - {{ formatCurrency(maxBalance) }}
                </v-chip>
              </div>
            </v-card-text>
          </v-card>

          <!-- Distribución por estrato -->
          <v-card v-if="foundServices.length > 0" outlined class="mt-3">
            <v-card-title class="text-h6">
              <v-icon left>
                mdi-chart-pie
              </v-icon>
              Distribución
            </v-card-title>
            <v-card-text>
              <div v-for="(distribution, key) in serviceDistribution" :key="key" class="d-flex justify-space-between mb-1">
                <span class="text-capitalize">{{ key }}:</span>
                <v-chip small :color="getDistributionColor(key)">
                  {{ distribution.count }} ({{ distribution.percentage }}%)
                </v-chip>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-card v-if="foundServices.length > 0" class="mt-4" outlined>
        <v-card-title>
          <v-icon left>
            mdi-account-multiple
          </v-icon>
          Servicios a Cortar
          <v-spacer />
          <v-text-field
            v-model="search"
            append-icon="mdi-magnify"
            label="Buscar en servicios"
            single-line
            hide-details
            dense
            style="max-width: 300px;"
          />
        </v-card-title>
        <v-card-text>
          <v-data-table
            :headers="serviceHeaders"
            :items="foundServices"
            :search="search"
            :loading="loadingServices"
            :items-per-page="10"
            class="elevation-1"
            no-data-text="No hay servicios para mostrar"
            loading-text="Buscando servicios..."
            hide-default-footer
            disable-pagination
            dense
          >
            <template v-slot:top>
              <v-toolbar flat>
                <v-toolbar-title>Servicios Encontrados</v-toolbar-title>
                <v-spacer />
                <v-btn
                  color="success"
                  small
                  outlined
                  :disabled="foundServices.length === 0"
                  @click="exportToExcel"
                >
                  <v-icon left>
                    mdi-file-excel
                  </v-icon>
                  Exportar Excel
                </v-btn>
                <v-btn
                  color="info"
                  small
                  outlined
                  class="ml-2"
                  :disabled="foundServices.length === 0"
                  @click="openSimulationDialog"
                >
                  <v-icon left>
                    mdi-eye
                  </v-icon>
                  Simular
                </v-btn>
              </v-toolbar>
            </template>
            <template #item.balance="{ item }">
              <v-chip
                :color="getBalanceColor(item.balance)"
                dark
                small
              >
                {{ formatCurrency(item.balance) }}
              </v-chip>
            </template>
            <template #item.estadoCorte="{ item }">
              <v-chip
                :color="item.estadoCorte === 'cortado' ? 'error' : 'success'"
                dark
                small
              >
                <v-icon left small>
                  {{ item.estadoCorte === 'cortado' ? 'mdi-power-plug-off' : 'mdi-power-plug' }}
                </v-icon>
                {{ item.estadoCorte === 'cortado' ? 'Cortado' : 'Pendiente' }}
              </v-chip>
            </template>
            <template #item.client_name="{ item }">
              {{ getClientName(item) }}
            </template>
            <template #item.address="{ item }">
              {{ getServiceAddress(item) }}
            </template>
            <template #item.neighborhood="{ item }">
              {{ getServiceNeighborhood(item) }}
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </div>

    <!-- Método manual por códigos -->
    <div v-if="selectionMethod === 'manual'">
      <v-textarea
        v-model="codes"
        outlined
        class="mt-2"
        label="Ingrese los Códigos, Uno por Línea"
        rows="10"
        hint="Ingrese cada código de servicio en una línea separada"
        persistent-hint
      />
    </div>

    <!-- Diálogo de simulación -->
    <v-dialog v-model="simulationDialog" max-width="800px">
      <v-card>
        <v-card-title>
          <v-icon left>
            mdi-play-circle-outline
          </v-icon>
          Simulación de Proceso de Corte
        </v-card-title>
        <v-card-text>
          <v-alert type="info" outlined class="mb-4">
            <v-icon left>
              mdi-information
            </v-icon>
            Esta es una simulación del proceso. No se realizarán cortes reales.
          </v-alert>

          <v-row>
            <v-col cols="12" md="6">
              <v-card outlined>
                <v-card-title class="text-h6">
                  Resumen del Proceso
                </v-card-title>
                <v-card-text>
                  <div class="d-flex justify-space-between mb-2">
                    <span>Servicios a procesar:</span>
                    <v-chip color="primary">
                      {{ foundServices.length }}
                    </v-chip>
                  </div>
                  <div class="d-flex justify-space-between mb-2">
                    <span>Saldo total a recuperar:</span>
                    <v-chip color="red">
                      {{ formatCurrency(totalBalance) }}
                    </v-chip>
                  </div>
                  <div class="d-flex justify-space-between mb-2">
                    <span>Tiempo estimado:</span>
                    <v-chip color="orange">
                      {{ getEstimatedTime() }}
                    </v-chip>
                  </div>
                  <div class="d-flex justify-space-between">
                    <span>Tipo de proceso:</span>
                    <v-chip :color="selectionMethod === 'balance' ? 'primary' : 'secondary'">
                      {{ selectionMethod === 'balance' ? 'Automático' : 'Manual' }}
                    </v-chip>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="6">
              <v-card outlined>
                <v-card-title class="text-h6">
                  Impacto Estimado
                </v-card-title>
                <v-card-text>
                  <div class="d-flex justify-space-between mb-2">
                    <span>Tasa de éxito esperada:</span>
                    <v-chip color="success">
                      ≥ 95%
                    </v-chip>
                  </div>
                  <div class="d-flex justify-space-between mb-2">
                    <span>Servicios exitosos:</span>
                    <v-chip color="green">
                      ≈ {{ Math.ceil(foundServices.length * 0.95) }}
                    </v-chip>
                  </div>
                  <div class="d-flex justify-space-between mb-2">
                    <span>Errores estimados:</span>
                    <v-chip color="red">
                      ≈ {{ Math.floor(foundServices.length * 0.05) }}
                    </v-chip>
                  </div>
                  <div class="d-flex justify-space-between">
                    <span>Saldo a recuperar:</span>
                    <v-chip color="success">
                      {{ formatCurrency(totalBalance * 0.95) }}
                    </v-chip>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <v-alert type="warning" outlined class="mt-4">
            <strong>Importante:</strong> Verifique que todos los servicios mostrados sean correctos antes de proceder con el corte real.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="grey" text @click="simulationDialog = false">
            Cerrar
          </v-btn>
          <v-btn color="primary" @click="confirmFromSimulation">
            Proceder con Corte Real
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Diálogo de confirmación para procesos duplicados -->
    <v-dialog v-model="duplicateProcessDialog" max-width="600px" persistent>
      <v-card>
        <v-card-title class="warning white--text">
          <v-icon left color="white">
            mdi-alert
          </v-icon>
          Proceso Duplicado Detectado
        </v-card-title>
        <v-card-text class="pt-4">
          <v-alert type="warning" outlined class="mb-4">
            Ya existe un proceso de corte automático para este mes
          </v-alert>

          <v-card v-if="existingProcess" outlined>
            <v-card-title class="text-h6">
              Proceso Existente
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="6">
                  <div class="d-flex justify-space-between">
                    <span><strong>Servicios:</strong></span>
                    <v-chip color="primary" small>
                      {{ existingProcess.successes || 0 }}
                    </v-chip>
                  </div>
                </v-col>
                <v-col cols="6">
                  <div class="d-flex justify-space-between">
                    <span><strong>Saldo mínimo:</strong></span>
                    <v-chip color="orange" small>
                      {{ formatCurrency(existingProcess.minimumBalance || 0) }}
                    </v-chip>
                  </div>
                </v-col>
                <v-col cols="12">
                  <div class="d-flex justify-space-between">
                    <span><strong>Total:</strong></span>
                    <v-chip color="red" small>
                      {{ formatCurrency(existingProcess.totalBalance || 0) }}
                    </v-chip>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <p class="mt-3 mb-0">
            ¿Desea continuar creando un nuevo proceso?
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="grey" text @click="cancelDuplicateProcess">
            Cancelar
          </v-btn>
          <v-btn color="warning" @click="proceedWithDuplicate">
            Sí, continuar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-row class="mt-4">
      <v-col>
        <v-btn
          v-if="selectionMethod === 'balance'"
          color="primary"
          large
          :disabled="foundServices.length === 0"
          @click="confirmServices"
        >
          <v-icon left>
            mdi-check
          </v-icon>
          Continuar con {{ foundServices.length }} servicios
        </v-btn>
        <v-btn
          v-if="selectionMethod === 'manual'"
          color="primary"
          large
          :disabled="!codes"
          @click="confirmCodes"
        >
          <v-icon left>
            mdi-check
          </v-icon>
          Continuar
        </v-btn>
        <v-btn
          class="ml-2"
          @click="$store.commit('cuts/e1', '1')"
        >
          <v-icon left>
            mdi-arrow-left
          </v-icon>
          Cancelar
        </v-btn>
      </v-col>
    </v-row>
  </div>
</template>

<script>
export default {
  data () {
    return {
      selectionMethod: 'balance', // Default al método automatizado
      minimumBalance: 60000,
      foundServices: [],
      loadingServices: false,
      search: '',
      codes: null, // Para el método manual
      serviceHeaders: [
        { text: 'Código', value: 'code', width: '100px' },
        { text: 'Cliente', value: 'client_name', width: '200px' },
        { text: 'Balance', value: 'balance', width: '120px', align: 'center' },
        { text: 'Estado', value: 'estadoCorte', width: '120px', align: 'center' },
        { text: 'Dirección', value: 'address', width: '200px' },
        { text: 'Barrio', value: 'neighborhood', width: '150px' },
        { text: 'Estrato', value: 'stratum', width: '80px', align: 'center' }
      ],
      rules: {
        required: value => !!value || 'Este campo es requerido',
        positive: value => value > 0 || 'El valor debe ser mayor a 0'
      },
      months: [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ],
      filters: {
        maxBalance: null,
        stratum: null,
        neighborhood: '',
        monthsInDebt: null
      },
      stratumOptions: [
        { text: 'Estrato 1', value: '1' },
        { text: 'Estrato 2', value: '2' },
        { text: 'Estrato 3', value: '3' },
        { text: 'Estrato 4', value: '4' },
        { text: 'Estrato 5', value: '5' },
        { text: 'Estrato 6', value: '6' }
      ],
      monthsInDebtOptions: [
        { text: '0 meses', value: '0' },
        { text: '1 mes', value: '1' },
        { text: '2 meses', value: '2' },
        { text: '3 meses', value: '3' },
        { text: '4 meses', value: '4' },
        { text: '5 meses', value: '5' },
        { text: '6 meses', value: '6' },
        { text: '7 meses', value: '7' },
        { text: '8 meses', value: '8' },
        { text: '9 meses', value: '9' },
        { text: '10 meses', value: '10' },
        { text: '11 meses', value: '11' },
        { text: '12 meses', value: '12' }
      ],
      simulationDialog: false,
      incluirCortados: false,
      permitirDuplicados: false,
      existingProcess: null,
      duplicateProcessDialog: false
    }
  },
  computed: {
    loading () {
      return this.$store.state.cuts.loading
    },
    e1 () {
      return this.$store.state.cuts.e1
    },
    totalBalance () {
      return this.foundServices.reduce((sum, service) => sum + (service.balance || 0), 0)
    },
    averageBalance () {
      return this.foundServices.length > 0 ? Math.round(this.totalBalance / this.foundServices.length) : 0
    },
    minBalance () {
      return this.foundServices.length > 0 ? Math.min(...this.foundServices.map(service => service.balance)) : 0
    },
    maxBalance () {
      return this.foundServices.length > 0 ? Math.max(...this.foundServices.map(service => service.balance)) : 0
    },
    serviceDistribution () {
      const distribution = {}
      this.foundServices.forEach((service) => {
        const balance = service.balance.toString()
        if (!distribution[balance]) {
          distribution[balance] = { count: 0, percentage: 0 }
        }
        distribution[balance].count++
      })
      const totalServices = this.foundServices.length
      Object.keys(distribution).forEach((balance) => {
        distribution[balance].percentage = Math.round((distribution[balance].count / totalServices) * 100)
      })
      return distribution
    }
  },
  methods: {
    async searchServices () {
      if (!this.minimumBalance || this.minimumBalance <= 0) {
        this.$toast.error('Ingrese un saldo mínimo válido')
        return
      }

      this.loadingServices = true
      try {
        // Verificar si ya existe un proceso del mismo mes (si no se permite duplicados)
        if (!this.permitirDuplicados) {
          const currentDate = new Date()
          const existingCheck = await this.$store.dispatch('cuts/checkExistingBillingPeriod', {
            token: this.$store.state.auth.token,
            city: this.$route.query.city,
            clienttype: this.$route.query.clienttype,
            month: currentDate.getMonth() + 1,
            year: currentDate.getFullYear(),
            processType: 'balance'
          })

          if (existingCheck.exists) {
            this.existingProcess = existingCheck.latest
            this.duplicateProcessDialog = true
            this.loadingServices = false
            return
          }
        }

        await this.fetchServices()
      } catch (error) {
        this.$toast.error('Error al buscar servicios: ' + error.message)
        this.foundServices = []
      } finally {
        this.loadingServices = false
      }
    },

    async fetchServices () {
      const services = await this.$store.dispatch('cuts/getServicesByBalance', {
        token: this.$store.state.auth.token,
        city: this.$route.query.city,
        clienttype: this.$route.query.clienttype,
        minimumBalance: this.minimumBalance,
        incluirCortados: this.incluirCortados,
        filters: this.filters
      })

      this.foundServices = services || []

      if (this.foundServices.length === 0) {
        const mensaje = this.incluirCortados
          ? 'No se encontraron servicios con el saldo especificado'
          : 'No se encontraron servicios pendientes de corte con el saldo especificado. Active "Incluir servicios ya cortados" si desea revisarlos.'
        this.$toast.info(mensaje)
      } else {
        const cortados = this.foundServices.filter(s => s.estadoCorte === 'cortado').length
        const pendientes = this.foundServices.filter(s => s.estadoCorte === 'pendiente').length

        let mensaje = `Se encontraron ${this.foundServices.length} servicios`
        if (cortados > 0) {
          mensaje += ` (${pendientes} pendientes, ${cortados} ya cortados)`
        }
        this.$toast.success(mensaje)
      }
    },
    async confirmServices () {
      if (this.foundServices.length === 0) {
        this.$toast.error('No hay servicios seleccionados')
        return
      }

      // Extraer solo los códigos para mantener compatibilidad con el flujo existente
      const codes = this.foundServices.map(service => service.code)

      this.$store.commit('cuts/setType', 'balance')
      this.$store.commit('cuts/setCodes', codes)

      // Guardar información adicional para el proceso
      this.$store.commit('cuts/setServicesData', {
        services: this.foundServices,
        minimumBalance: this.minimumBalance,
        totalBalance: this.totalBalance
      })

      // Crear billing period automáticamente para procesos por balance
      try {
        const currentDate = new Date()
        const monthNames = [
          'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ]

        // Obtener los IDs de ciudad y clienttype
        const cityData = this.$store.state.company.cities.find(c => c.name === this.$route.query.city)
        const clienttypeData = this.$store.state.company.clienttypes.find(ct => ct.name === this.$route.query.clienttype)

        if (!cityData || !clienttypeData) {
          throw new Error('No se pudo encontrar la información de ciudad o tipo de cliente')
        }

        const billingPeriod = await this.$store.dispatch('cuts/createBillingPeriodWithBalance', {
          token: this.$store.state.auth.token,
          name: monthNames[currentDate.getMonth()],
          cityId: cityData.id,
          clienttypeId: clienttypeData.id,
          month: currentDate.getMonth() + 1,
          year: currentDate.getFullYear(),
          minimumBalance: this.minimumBalance,
          totalBalance: this.totalBalance,
          servicesCount: this.foundServices.length,
          servicesCodes: codes
        })

        // Guardar el ID del billing period para futuras actualizaciones
        this.$store.commit('cuts/currentBillingPeriod', billingPeriod.id)
      } catch (error) {
        this.$toast.info('Servicios preparados, pero no se pudo crear el período de facturación: ' + error.message)
      }

      this.$store.commit('cuts/e1', '3')
    },
    confirmCodes () {
      if (this.codes === null || this.codes.trim() === '') {
        this.$toast.error('Ingrese los códigos antes de continuar')
        return
      }

      this.$store.commit('cuts/setType', 'manual')
      const codeArray = this.codes.trim().split('\n').filter(code => code.trim() !== '')
      this.$store.commit('cuts/setCodes', codeArray)
      this.$store.commit('cuts/e1', '3')
    },
    formatCurrency (amount) {
      if (!amount || amount === 0) { return '$0' }
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
      }).format(amount)
    },
    getBalanceColor (balance) {
      if (balance >= 100000) { return 'red darken-2' }
      if (balance >= 60000) { return 'orange darken-2' }
      if (balance >= 30000) { return 'yellow darken-2' }
      return 'grey'
    },
    getMonthName (monthNumber) {
      return this.months[monthNumber - 1] || 'N/A'
    },
    getActiveFiltersText () {
      const filters = []
      if (this.filters.maxBalance) {
        filters.push(`Saldo máximo: ${this.formatCurrency(this.filters.maxBalance)}`)
      }
      if (this.filters.stratum) {
        filters.push(`Estrato: ${this.filters.stratum}`)
      }
      if (this.filters.neighborhood) {
        filters.push(`Barrio: ${this.filters.neighborhood}`)
      }
      if (this.filters.monthsInDebt) {
        filters.push(`Meses en mora: ${this.filters.monthsInDebt}`)
      }
      return filters.join(', ')
    },
    clearFilters () {
      this.filters = {
        maxBalance: null,
        stratum: null,
        neighborhood: '',
        monthsInDebt: null
      }
      this.incluirCortados = false
      this.permitirDuplicados = false
      this.foundServices = []
      this.$toast.info('Filtros limpiados')
    },
    getDistributionColor (balance) {
      if (balance >= 100000) { return 'red darken-2' }
      if (balance >= 60000) { return 'orange darken-2' }
      if (balance >= 30000) { return 'yellow darken-2' }
      return 'grey'
    },
    exportToExcel () {
      // Crear datos para exportar
      const exportData = this.foundServices.map(service => ({
        Código: service.code,
        Cliente: service.normalized_client?.name || service.client_name || 'N/A',
        Teléfono: service.normalized_client?.phone || service.phone || 'N/A',
        Dirección: service.address || 'N/A',
        Barrio: service.neighborhood || 'N/A',
        Saldo: service.balance || 0,
        Estrato: service.stratum || 'N/A',
        Plan: service.plan?.name || 'N/A',
        'Último Período': service.billingmonth && service.billingyear
          ? `${this.getMonthName(service.billingmonth)} ${service.billingyear}` : 'No definido'
      }))

      // Crear metadata del proceso
      const metadata = [
        ['REPORTE DE SERVICIOS PARA CORTE'],
        [''],
        ['Fecha de generación:', new Date().toLocaleString('es-CO')],
        ['Ciudad:', this.$route.query.city],
        ['Tipo de cliente:', this.$route.query.clienttype],
        ['Método:', this.selectionMethod === 'balance' ? 'Automático por Balance' : 'Manual por Códigos'],
        [''],
        ['RESUMEN:'],
        ['Total de servicios:', this.foundServices.length],
        ['Saldo mínimo:', this.formatCurrency(this.minimumBalance)],
        ['Saldo total:', this.formatCurrency(this.totalBalance)],
        ['Promedio por servicio:', this.formatCurrency(this.averageBalance)],
        [''],
        ['FILTROS APLICADOS:']
      ]

      // Agregar filtros activos a la metadata
      if (this.filters.maxBalance) {
        metadata.push(['Saldo máximo:', this.formatCurrency(this.filters.maxBalance)])
      }
      if (this.filters.stratum) {
        metadata.push(['Estrato:', this.filters.stratum])
      }
      if (this.filters.neighborhood) {
        metadata.push(['Barrio:', this.filters.neighborhood])
      }
      if (this.filters.monthsInDebt) {
        metadata.push(['Meses en mora:', this.filters.monthsInDebt])
      }

      metadata.push([''], ['LISTADO DE SERVICIOS:'])

      // Combinar metadata con datos
      const finalData = [
        ...metadata,
        Object.keys(exportData[0] || {}), // Headers
        ...exportData.map(row => Object.values(row)) // Data rows
      ]

      // Crear y descargar archivo CSV
      const csvContent = finalData.map(row =>
        Array.isArray(row) ? row.join(',') : row
      ).join('\n')

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      link.setAttribute('href', url)
      link.setAttribute('download', `servicios_corte_${this.$route.query.city}_${new Date().toISOString().slice(0, 10)}.csv`)
      link.style.visibility = 'hidden'

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      this.$toast.success(`Archivo exportado: ${this.foundServices.length} servicios`)
    },
    openSimulationDialog () {
      this.simulationDialog = true
    },
    confirmFromSimulation () {
      this.simulationDialog = false
      // Proceder directamente con la confirmación normal
      if (this.selectionMethod === 'balance') {
        this.confirmServices()
      } else {
        this.confirmCodes()
      }
    },
    getEstimatedTime () {
      // Calcular tiempo estimado basado en número de servicios
      // Asumiendo ~30 servicios por minuto
      const servicesPerMinute = 30
      const totalMinutes = Math.ceil(this.foundServices.length / servicesPerMinute)

      if (totalMinutes < 60) {
        return `${totalMinutes} minutos`
      } else {
        const hours = Math.floor(totalMinutes / 60)
        const minutes = totalMinutes % 60
        return `${hours}h ${minutes}m`
      }
    },
    getClientName (item) {
      return item.normalized_client?.name || item.client_name || 'N/A'
    },
    getServiceAddress (item) {
      return item.address || 'N/A'
    },
    getServiceNeighborhood (item) {
      return item.neighborhood || 'N/A'
    },
    async proceedWithDuplicate () {
      this.duplicateProcessDialog = false
      this.loadingServices = true
      try {
        await this.fetchServices()
      } catch (error) {
        this.$toast.error('Error al buscar servicios: ' + error.message)
        this.foundServices = []
      } finally {
        this.loadingServices = false
      }
    },
    cancelDuplicateProcess () {
      this.duplicateProcessDialog = false
    }
  }
}
</script>
