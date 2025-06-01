<template>
  <v-container fluid>
    <v-card class="mb-4 rounded-xl mx-auto elevation-0">
      <v-card-title class="text-center justify-center">
        <strong class="mr-1">Preparación</strong> -
        <span v-if="!includeAlreadyBilled">
          Generar estados de cuenta para {{ activeServices.length }} servicios
        </span>
        <span v-else>
          Revisar/procesar {{ activeServices.length }} servicios (incluye ya facturados)
        </span>
      </v-card-title>

      <v-card-text>
        <v-alert
          v-if="loading"
          type="info"
          dense
          outlined
        >
          <v-row align="center">
            <v-col cols="12" sm="8">
              <div>
                Cargando servicios activos para el mes de {{ getMonthName() }} {{ year }}
                <span v-if="includeAlreadyBilled">(incluyendo ya facturados)</span>...
              </div>
              <div class="text-caption mt-1">
                Este proceso puede tardar unos momentos dependiendo de la cantidad de servicios.
              </div>
            </v-col>
            <v-col cols="12" sm="4" class="text-center">
              <v-progress-circular
                indeterminate
                color="primary"
                size="24"
              />
            </v-col>
          </v-row>
        </v-alert>

        <v-alert
          v-else-if="activeServices.length === 0"
          type="warning"
          dense
          outlined
        >
          <span v-if="!includeAlreadyBilled">
            No hay servicios activos para generar estados de cuenta. Regrese y seleccione otro período.
          </span>
          <span v-else>
            No hay servicios activos para el período seleccionado (incluyendo ya facturados).
          </span>
        </v-alert>

        <v-alert
          v-else
          type="info"
          dense
          outlined
        >
          <span v-if="!includeAlreadyBilled">
            Se generarán estados de cuenta para el mes de {{ getMonthName() }} {{ year }} con fecha límite {{ formatDate(limit) }}
          </span>
          <span v-else>
            Revisando servicios del mes de {{ getMonthName() }} {{ year }} (incluyendo ya facturados) para generar imágenes faltantes o reenvíos
          </span>
        </v-alert>

        <!-- Switch para incluir servicios ya facturados -->
        <v-row class="mt-4">
          <v-col>
            <v-switch
              v-model="includeAlreadyBilled"
              :loading="loading"
              color="orange darken-2"
              label="Incluir servicios ya facturados del mes (para generar imágenes faltantes)"
              hide-details
              @change="onIncludeAlreadyBilledChange"
            />
            <div v-if="includeAlreadyBilled" class="text-caption orange--text text--darken-2 mt-1">
              <v-icon small color="orange darken-2">
                mdi-information-outline
              </v-icon>
              Los servicios ya facturados se mostrarán para poder generar imágenes faltantes o reenvíos.
            </div>
          </v-col>
        </v-row>

        <!-- Progress Console -->
        <v-row class="mt-4">
          <v-col>
            <v-card outlined>
              <v-card-title class="d-flex align-center py-2">
                <v-icon left color="blue darken-2">
                  mdi-console
                </v-icon>
                <span class="subtitle-1">Consola de Progreso</span>
                <v-spacer />
                <v-btn
                  small
                  outlined
                  color="grey darken-1"
                  @click="clearConsole"
                >
                  <v-icon small left>
                    mdi-delete-sweep
                  </v-icon>
                  Limpiar
                </v-btn>
              </v-card-title>
              <v-divider />
              <v-card-text class="pa-0">
                <div
                  ref="consoleContainer"
                  class="console-container"
                  style="height: 200px; overflow-y: auto; background-color: #1e1e1e; color: #ffffff; font-family: 'Courier New', monospace; font-size: 13px;"
                >
                  <div
                    v-for="(log, index) in consoleLogs"
                    :key="index"
                    class="console-line"
                    :class="`console-${log.type}`"
                    style="padding: 4px 12px; border-left: 3px solid transparent;"
                  >
                    <span class="console-timestamp" style="color: #888; margin-right: 8px;">
                      {{ log.timestamp }}
                    </span>
                    <span class="console-message">{{ log.message }}</span>
                  </div>
                  <div v-if="consoleLogs.length === 0" class="console-empty" style="padding: 20px; text-align: center; color: #666;">
                    La consola está vacía. Los mensajes de progreso aparecerán aquí...
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <div class="d-flex justify-space-between flex-wrap mt-4">
          <v-btn
            color="primary"
            class="mr-2 mb-2"
            :disabled="loading"
            @click="$router.push('/billing/generate')"
          >
            <v-icon left>
              mdi-arrow-left
            </v-icon>
            Regresar
          </v-btn>

          <div>
            <v-btn
              color="info"
              class="mr-2"
              :disabled="loading || activeServices.length === 0"
              @click="selectAll(!allSelected)"
            >
              <v-icon left>
                {{ allSelected ? 'mdi-checkbox-blank-outline' : 'mdi-checkbox-marked' }}
              </v-icon>
              {{ allSelected ? 'Deseleccionar todos' : 'Seleccionar todos' }}
            </v-btn>

            <v-btn
              color="success"
              :loading="processingLoading"
              :disabled="loading || selectedServices.length === 0"
              @click="continueToProcess"
            >
              <span v-if="!includeAlreadyBilled">
                Procesar {{ selectedServices.length }} facturas
              </span>
              <span v-else>
                Revisar {{ selectedServices.length }} servicios
              </span>
              <v-icon right>
                mdi-arrow-right
              </v-icon>
            </v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <v-skeleton-loader
      v-if="loading"
      type="table"
      class="rounded-xl elevation-0 mt-3"
    />
    <v-card v-else-if="activeServices.length > 0" class="rounded-xl elevation-0">
      <v-card-title class="d-flex align-center">
        <span v-if="!includeAlreadyBilled">Lista de servicios a facturar</span>
        <span v-else>Lista de servicios (incluye ya facturados)</span>
        <v-spacer />
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="Buscar"
          single-line
          hide-details
          dense
          outlined
          class="ml-2"
          style="max-width: 300px"
        />
      </v-card-title>

      <v-data-table
        v-model="selectedServices"
        :headers="headers"
        :items="activeServices"
        :items-per-page="10"
        :search="search"
        item-key="code"
        show-select
        class="elevation-0"
        @item-selected="updateSelection"
      >
        <template v-slot:[`item.offer.price`]="{ item }">
          <span v-if="item.offer">{{ formatCurrency(item.offer.price) }}</span>
          <v-chip v-else color="red" small text-color="white">
            Sin Tarifa
          </v-chip>
        </template>
        <template v-slot:[`item.active`]="{ item }">
          <v-chip
            :color="item.active ? 'green' : 'red'"
            small
            text-color="white"
          >
            {{ item.active ? 'Activo' : 'Inactivo' }}
          </v-chip>
        </template>
        <template v-slot:[`item.invoiceStatus`]="{ item }">
          <v-chip
            :color="item.existingInvoiceId ? 'blue lighten-3' : 'green lighten-3'"
            small
            :text-color="item.existingInvoiceId ? 'blue darken-3' : 'green darken-3'"
          >
            <strong>{{ item.existingInvoiceId ? 'YA GENERADA' : 'POR GENERAR' }}</strong>
          </v-chip>
        </template>
        <template v-slot:[`item.imageStatus`]="{ item }">
          <v-chip
            :color="getImageStatusColor(item)"
            small
            text-color="white"
          >
            <v-icon small left>
              {{ getImageStatusIcon(item) }}
            </v-icon>
            <strong>{{ getImageStatusText(item) }}</strong>
          </v-chip>
        </template>
        <template v-slot:footer>
          <div class="d-flex justify-end pa-2">
            <span class="text-subtitle-1">
              <strong>{{ selectedServices.length }}</strong> servicios seleccionados de <strong>{{ activeServices.length }}</strong>
            </span>
          </div>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script>
export default {
  middleware: 'authenticated',

  data () {
    return {
      loading: false,
      processingLoading: false,
      search: '',
      selectedServices: [],
      headers: [
        { text: 'Código', value: 'code', sortable: true },
        { text: 'Cliente', value: 'client_name', sortable: true },
        { text: 'Plan', value: 'offer.name', sortable: true },
        { text: 'Valor', value: 'offer.price', sortable: true },
        { text: 'Estado Servicio', value: 'active', sortable: false },
        { text: 'Estado Factura', value: 'invoiceStatus', sortable: false },
        { text: 'Estado Imagen', value: 'imageStatus', sortable: false }
      ],
      includeAlreadyBilled: false,
      consoleLogs: []
    }
  },

  computed: {
    activeServices () {
      return this.$store.state.billing.activeServices
    },
    month () {
      return this.$store.state.billing.month
    },
    year () {
      return this.$store.state.billing.year
    },
    limit () {
      return this.$store.state.billing.limit
    },
    allSelected () {
      return this.activeServices.length > 0 && this.selectedServices.length === this.activeServices.length
    }
  },
  watch: {
    // Observar cambios en el mes o año seleccionado
    async 'month.value' () {
      await this.getListOfActiveServices()
      this.selectAll(true)
    },
    async year () {
      await this.getListOfActiveServices()
      this.selectAll(true)
    }
  },

  async mounted () {
    // Verificar si tenemos los datos necesarios
    if (!this.month || !this.year || !this.limit) {
      this.logError('Faltan datos de período. Regresando al selector inicial...')
      this.$router.push('/billing/generate')
      return
    }

    this.logInfo(`Iniciando preparación para generar facturas del período ${this.month.text} ${this.year}`)

    // Siempre cargar los servicios activos al montar el componente
    // para asegurar que se actualicen según el mes/año seleccionado
    await this.getListOfActiveServices()

    // Seleccionar todos los servicios por defecto que tengan tarifa
    this.selectAll(true)
    this.logInfo(`Seleccionados automáticamente ${this.selectedServices.length} servicios con tarifa`)
  },

  methods: {
    formatCurrency (value) {
      return `$${value.toLocaleString('es-CO')}`
    },

    formatDate (dateString) {
      return new Date(dateString).toLocaleDateString('es-ES')
    },

    getMonthName () {
      const monthNames = [
        'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
        'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
      ]
      return monthNames[this.month.value - 1]
    },

    async getListOfActiveServices () {
      this.loading = true
      this.logInfo(`Cargando servicios ${this.includeAlreadyBilled ? '(incluyendo ya facturados)' : ''} para ${this.month.text} ${this.year}...`)
      try {
        await this.$store.dispatch('billing/getListOfActiveServices', {
          token: this.$store.state.auth.token,
          city: this.$route.query.city,
          clienttype: this.$route.query.clienttype,
          company: this.$route.query.company,
          active: true,
          indebt: false,
          month: this.month.value,
          year: this.year,
          includeAlreadyBilled: this.includeAlreadyBilled
        })
        this.logSuccess(`Cargados ${this.activeServices.length} servicios activos`)
      } catch (error) {
        console.error('Error cargando servicios:', error)
        this.logError('Error cargando servicios activos')
      } finally {
        this.loading = false
      }
    },

    selectAll (value) {
      this.selectedServices = value
        ? this.activeServices.filter(service => service.offer !== null).slice()
        : []
    },

    updateSelection ({ item, value }) {
      // Manually update selectedServices based on checkbox changes
      // This is needed because v-data-table v-model might behave unexpectedly
      // when items are dynamically updated or filtered.
      const index = this.selectedServices.findIndex(s => s.code === item.code)
      if (value && index === -1) {
        // Add item if selected and not already in the array
        this.selectedServices.push(item)
      } else if (!value && index !== -1) {
        // Remove item if deselected and present in the array
        this.selectedServices.splice(index, 1)
      }
      // Ensure reactivity if needed, though direct push/splice is usually reactive
      // this.selectedServices = [...this.selectedServices];
    },

    continueToProcess () {
      this.processingLoading = true
      // Commit the final list of selected services to the store
      this.$store.commit('billing/setSelectedServices', this.selectedServices)
      this.$router.push({
        path: '/billing/generate/process',
        query: this.$route.query // Pass along query params
      })
      // No need to set processingLoading back to false, as we are navigating away
    },

    onIncludeAlreadyBilledChange () {
      // Reload services when the switch changes
      this.logInfo(`Cambiando modo: ${this.includeAlreadyBilled ? 'Incluir servicios ya facturados' : 'Solo servicios pendientes'}`)
      this.getListOfActiveServices()
    },

    getImageStatusColor (item) {
      const hasImage = this.hasInvoiceImage(item)
      if (!item.existingInvoiceId) {
        return 'grey' // No tiene factura aún
      }
      return hasImage ? 'success' : 'warning'
    },

    getImageStatusIcon (item) {
      const hasImage = this.hasInvoiceImage(item)
      if (!item.existingInvoiceId) {
        return 'mdi-minus-circle' // No aplica
      }
      return hasImage ? 'mdi-check-circle' : 'mdi-alert-circle'
    },

    getImageStatusText (item) {
      const hasImage = this.hasInvoiceImage(item)
      if (!item.existingInvoiceId) {
        return 'N/A' // No tiene factura
      }
      return hasImage ? 'CON IMAGEN' : 'SIN IMAGEN'
    },

    hasInvoiceImage (item) {
      if (!item.existingInvoiceId || !item.invoices) {
        return false
      }
      // Buscar la factura específica del mes/año actual
      const targetInvoice = item.invoices.find(invoice =>
        invoice.month === this.month.value &&
        invoice.year === this.year &&
        invoice.id === item.existingInvoiceId
      )
      return targetInvoice && targetInvoice.image && targetInvoice.image.url
    },

    clearConsole () {
      this.consoleLogs = []
    },

    logToConsole (message, type = 'info') {
      const timestamp = new Date().toLocaleTimeString('es-ES', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })

      this.consoleLogs.push({
        timestamp,
        message,
        type
      })

      // Auto-scroll to bottom
      this.$nextTick(() => {
        if (this.$refs.consoleContainer) {
          this.$refs.consoleContainer.scrollTop = this.$refs.consoleContainer.scrollHeight
        }
      })

      // Limit console logs to prevent memory issues (keep last 200 logs)
      if (this.consoleLogs.length > 200) {
        this.consoleLogs = this.consoleLogs.slice(-200)
      }
    },

    logInfo (message) {
      this.logToConsole(message, 'info')
    },

    logSuccess (message) {
      this.logToConsole(message, 'success')
    },

    logWarning (message) {
      this.logToConsole(message, 'warning')
    },

    logError (message) {
      this.logToConsole(message, 'error')
    }
  }
}
</script>

<style scoped>
/* Console Styles */
.console-container {
  line-height: 1.4;
}

.console-line {
  white-space: pre-wrap;
  word-break: break-word;
}

.console-info {
  border-left-color: #2196F3 !important;
  background-color: rgba(33, 150, 243, 0.05);
}

.console-success {
  border-left-color: #4CAF50 !important;
  background-color: rgba(76, 175, 80, 0.05);
  color: #4CAF50 !important;
}

.console-warning {
  border-left-color: #FF9800 !important;
  background-color: rgba(255, 152, 0, 0.05);
  color: #FF9800 !important;
}

.console-error {
  border-left-color: #F44336 !important;
  background-color: rgba(244, 67, 54, 0.05);
  color: #F44336 !important;
}

.console-container::-webkit-scrollbar {
  width: 8px;
}

.console-container::-webkit-scrollbar-track {
  background: #2e2e2e;
}

.console-container::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 4px;
}

.console-container::-webkit-scrollbar-thumb:hover {
  background: #777;
}
</style>
