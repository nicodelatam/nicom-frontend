<template>
  <div>
    <v-card>
      <v-card-text v-if="!prepare" class="justify-center d-flex">
        <v-btn
          color="error"
          large
          @click="prepareServices"
        >
          <v-icon>mdi-account</v-icon>
          <span>Realizar Cortes</span>
        </v-btn>
      </v-card-text>
      <v-card-text v-else>
        <h4>Proceso iniciado correctamente. Ya puedes salir de la pagina (El proceso seguira en segundo plano)</h4>
        <v-btn
          color="primary"
          @click="$store.commit('cuts/e1', '1')"
        >
          Ver progreso
        </v-btn>
      </v-card-text>
      <v-card-text v-if="!prepare">
        <v-btn
          @click="$store.commit('cuts/e1', '1')"
        >
          Cancelar
        </v-btn>
      </v-card-text>
      <v-card-text>
        <!-- Alertas contextuales -->
        <v-alert
          v-if="serviciosYaCortados.length > 0"
          type="warning"
          border="left"
          colored-border
          class="mb-4"
        >
          <h4>⚠️ Servicios Ya Cortados Detectados</h4>
          <p class="mb-1">
            Se encontraron <strong>{{ serviciosYaCortados.length }}</strong> servicios que ya están cortados.
          </p>
          <p class="mb-0">
            <strong>Pendientes:</strong> {{ serviciosPendientes.length }} |
            <strong>Ya cortados:</strong> {{ serviciosYaCortados.length }}
          </p>
        </v-alert>

        <v-alert
          v-if="$store.state.cuts.servicesData.services.length === 0"
          type="info"
          border="left"
          colored-border
          class="mb-4"
        >
          <h4>📋 Sin Servicios Seleccionados</h4>
          <p class="mb-0">
            No hay servicios seleccionados para el proceso de corte.
            Regrese al paso anterior para seleccionar servicios.
          </p>
        </v-alert>

        <!-- Panel de información existente -->
        <v-card outlined class="mb-4">
          <v-card-title class="primary white--text">
            <v-icon left color="white">mdi-information</v-icon>
            Información del Proceso
          </v-card-title>
          <v-card-text class="py-3">
            <v-row>
              <v-col cols="12" md="4">
                <div class="d-flex align-center">
                  <v-icon color="primary" class="mr-2">mdi-account-group</v-icon>
                  <div>
                    <div class="text-caption text--secondary">Total Servicios</div>
                    <div class="text-h6 font-weight-bold">{{ totalServicios }}</div>
                  </div>
                </div>
              </v-col>
              <v-col cols="12" md="4">
                <div class="d-flex align-center">
                  <v-icon color="success" class="mr-2">mdi-power-plug</v-icon>
                  <div>
                    <div class="text-caption text--secondary">Pendientes</div>
                    <div class="text-h6 font-weight-bold text-success">{{ serviciosPendientes.length }}</div>
                  </div>
                </div>
              </v-col>
              <v-col cols="12" md="4">
                <div class="d-flex align-center">
                  <v-icon color="error" class="mr-2">mdi-power-plug-off</v-icon>
                  <div>
                    <div class="text-caption text--secondary">Ya Cortados</div>
                    <div class="text-h6 font-weight-bold text-error">{{ serviciosYaCortados.length }}</div>
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-card-text>
    </v-card>
  </div>
</template>
<script>
export default {
  data () {
    return {
      headers: [
        { text: 'Codigo', value: 'code' },
        { text: 'Nombre', value: 'normalized_client.name' },
        { text: 'Direccion', value: 'address' },
        { text: 'Barrio', value: 'neighborhood' },
        { text: 'Telefono', value: 'normalized_client.phone' },
        { text: 'Plan', value: 'plan.name' }
      ]
    }
  },
  computed: {
    prepare () {
      return this.$store.state.cuts.prepare
    },
    ready () {
      return this.$store.state.cuts.ready
    },
    validServices () {
      return this.$store.state.cuts.validServices
    },
    services () {
      return this.$store.state.cuts.services
    },
    loading () {
      return this.$store.state.cuts.loading
    },
    currentBillingPeriod () {
      return this.$store.state.cuts.currentBillingPeriod
    },
    billingmonth () {
      return this.$store.state.cuts.month
    },
    billingyear () {
      return this.$store.state.cuts.year
    },
    serviciosYaCortados () {
      return this.$store.getters['cuts/serviciosYaCortados']
    },
    serviciosPendientes () {
      return this.$store.getters['cuts/serviciosPendientes']
    },
    totalServicios () {
      return this.$store.getters['cuts/totalServicios']
    }
  },
  methods: {
    prepareServices () {
      if (!this.ready) {
        this.$toast.error('No hay servicios para preparar')
        return
      }
      this.$store.commit('cuts/prepare', true)
      this.$store.commit('cuts/reset')

      this.beginServerSideProcess()
    },
    beginServerSideProcess () {
      this.$store.dispatch('cuts/beginServerSideProcess', {
        token: this.$store.state.auth.token,
        city: this.$route.query.city,
        kick: this.$store.state.cuts.kick,
        services: this.ready,
        currentBillingPeriod: this.currentBillingPeriod,
        billingmonth: this.billingmonth,
        billingyear: this.billingyear,
        operator: this.$store.state.auth.id
      })
    },
    getcolor (item) {
      if (item.valid) {
        return 'success--text'
      } else {
        return 'error--text'
      }
    }
  }
}
</script>
