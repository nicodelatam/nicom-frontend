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
          v-if="serviciosEnMora.length > 0 || serviciosRetirados.length > 0"
          type="warning"
          border="left"
          colored-border
          class="mb-4"
        >
          <h4>⚠️ Servicios No Disponibles Detectados</h4>
          <p class="mb-1">
            Se encontraron servicios que no están disponibles para corte:
          </p>
          <p class="mb-0">
            <strong>Disponibles:</strong> {{ serviciosDisponibles.length }} |
            <strong>En mora:</strong> {{ serviciosEnMora.length }} |
            <strong>Retirados:</strong> {{ serviciosRetirados.length }}
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
            <v-icon left color="white">
              mdi-information
            </v-icon>
            Información del Proceso
          </v-card-title>
          <v-card-text class="py-3">
            <v-row>
              <v-col cols="12" md="3">
                <div class="d-flex align-center">
                  <v-icon color="primary" class="mr-2">
                    mdi-account-group
                  </v-icon>
                  <div>
                    <div class="text-caption text--secondary">
                      Total Servicios
                    </div>
                    <div class="text-h6 font-weight-bold">
                      {{ totalServicios }}
                    </div>
                  </div>
                </div>
              </v-col>
              <v-col cols="12" md="3">
                <div class="d-flex align-center">
                  <v-icon color="success" class="mr-2">
                    mdi-check-circle
                  </v-icon>
                  <div>
                    <div class="text-caption text--secondary">
                      Disponibles
                    </div>
                    <div class="text-h6 font-weight-bold text-success">
                      {{ serviciosDisponibles.length }}
                    </div>
                  </div>
                </div>
              </v-col>
              <v-col cols="12" md="3">
                <div class="d-flex align-center">
                  <v-icon color="error" class="mr-2">
                    mdi-alert-circle
                  </v-icon>
                  <div>
                    <div class="text-caption text--secondary">
                      En Mora
                    </div>
                    <div class="text-h6 font-weight-bold text-error">
                      {{ serviciosEnMora.length }}
                    </div>
                  </div>
                </div>
              </v-col>
              <v-col cols="12" md="3">
                <div class="d-flex align-center">
                  <v-icon color="grey" class="mr-2">
                    mdi-account-off
                  </v-icon>
                  <div>
                    <div class="text-caption text--secondary">
                      Retirados
                    </div>
                    <div class="text-h6 font-weight-bold text--secondary">
                      {{ serviciosRetirados.length }}
                    </div>
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
    totalServicios () {
      return this.$store.getters['cuts/totalServicios']
    },
    serviciosRetirados () {
      return this.$store.getters['cuts/serviciosRetirados']
    },
    serviciosEnMora () {
      return this.$store.getters['cuts/serviciosEnMora']
    },
    serviciosDisponibles () {
      return this.$store.getters['cuts/serviciosDisponibles']
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
