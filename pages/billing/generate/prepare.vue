<template>
  <v-container fluid>
    <v-card class="mb-4 rounded-xl mx-auto elevation-0">
      <v-card-title class="text-center justify-center">
        <strong class="mr-1">Preparación</strong> - Generar estados de cuenta para {{ activeServices.length }} servicios
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
              <div>Cargando servicios activos para el mes de {{ getMonthName() }} {{ year }}...</div>
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
          No hay servicios activos para generar estados de cuenta. Regrese y seleccione otro período.
        </v-alert>

        <v-alert
          v-else
          type="info"
          dense
          outlined
        >
          Se generarán estados de cuenta para el mes de {{ getMonthName() }} {{ year }} con fecha límite {{ formatDate(limit) }}
        </v-alert>

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
              Procesar {{ selectedServices.length }} facturas
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
        <span>Lista de servicios a facturar</span>
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
        { text: 'Estado Factura', value: 'invoiceStatus', sortable: false }
      ]
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
      this.$router.push('/billing/generate')
      return
    }

    // Siempre cargar los servicios activos al montar el componente
    // para asegurar que se actualicen según el mes/año seleccionado
    await this.getListOfActiveServices()

    // Seleccionar todos los servicios por defecto que tengan tarifa
    this.selectAll(true)
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
      try {
        await this.$store.dispatch('billing/getListOfActiveServices', {
          token: this.$store.state.auth.token,
          city: this.$route.query.city,
          clienttype: this.$route.query.clienttype,
          company: this.$route.query.company,
          active: true,
          indebt: false,
          month: this.month.value,
          year: this.year
        })
      } catch (error) {
        console.error('Error cargando servicios:', error)
        this.$toast.error('Error cargando servicios activos', { duration: 2000 })
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
    }
  }
}
</script>
