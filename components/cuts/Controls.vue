<template>
  <div>
    <v-card>
      <v-card-title class="px-0">
        <v-icon left color="primary">
          mdi-information
        </v-icon>
        Información del Proceso
      </v-card-title>
      <v-card-text class="px-0">
        <v-row>
          <v-col cols="12" md="6">
            <v-card outlined class="pa-3">
              <div class="d-flex align-center mb-2">
                <v-icon left color="success">
                  mdi-account-multiple
                </v-icon>
                <span class="font-weight-medium">Servicios en cola:</span>
                <v-chip color="primary" class="ml-2">
                  {{ $store.state.cuts.ready.length }}
                </v-chip>
              </div>

              <div v-if="processType === 'balance' && servicesData.minimumBalance" class="mb-2">
                <div class="d-flex align-center">
                  <v-icon left color="orange">
                    mdi-currency-usd
                  </v-icon>
                  <span class="font-weight-medium">Saldo mínimo:</span>
                  <v-chip color="orange" class="ml-2">
                    {{ formatCurrency(servicesData.minimumBalance) }}
                  </v-chip>
                </div>
              </div>

              <div v-if="processType === 'balance' && servicesData.totalBalance" class="mb-2">
                <div class="d-flex align-center">
                  <v-icon left color="red">
                    mdi-calculator
                  </v-icon>
                  <span class="font-weight-medium">Saldo total a cortar:</span>
                  <v-chip color="red" class="ml-2">
                    {{ formatCurrency(servicesData.totalBalance) }}
                  </v-chip>
                </div>
              </div>

              <div v-if="$store.state.cuts.errors > 0" class="d-flex align-center">
                <v-icon left color="error">
                  mdi-alert-circle
                </v-icon>
                <span class="font-weight-medium">No encontrados:</span>
                <v-chip color="error" class="ml-2">
                  {{ $store.state.cuts.errors }}
                </v-chip>
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card outlined class="pa-3">
              <div class="d-flex align-center mb-3">
                <v-icon left color="warning">
                  mdi-settings
                </v-icon>
                <span class="font-weight-medium">Configuración:</span>
              </div>

              <v-checkbox
                v-model="kick"
                color="red"
                label="Patear dispositivos (No recomendado)"
                hide-details
              >
                <template v-slot:label>
                  <div>
                    <span>Patear dispositivos</span>
                    <br>
                    <small class="text--secondary">(No recomendado)</small>
                  </div>
                </template>
              </v-checkbox>

              <v-alert
                v-if="kick"
                type="warning"
                dense
                class="mt-2"
                border="left"
              >
                Esta opción desconectará forzosamente los dispositivos
              </v-alert>
            </v-card>
          </v-col>
        </v-row>

        <v-alert
          v-if="processType === 'balance'"
          type="info"
          dense
          class="mt-3"
          border="left"
        >
          <v-icon left>
            mdi-lightbulb
          </v-icon>
          Proceso automatizado por saldo: Se cortarán todos los servicios con saldo igual o mayor a {{ formatCurrency(servicesData.minimumBalance) }}
        </v-alert>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
export default {
  data () {
    return {
      kick: false,
      offer: null
    }
  },
  computed: {
    processType () {
      return this.$store.state.cuts.type
    },
    servicesData () {
      return this.$store.state.cuts.servicesData || { minimumBalance: 0, totalBalance: 0 }
    }
  },
  watch: {
    kick () {
      this.$store.commit('cuts/kick', this.kick)
    }
  },
  methods: {
    formatCurrency (amount) {
      if (!amount || amount === 0) { return '$0' }
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
      }).format(amount)
    }
  }
}
</script>
