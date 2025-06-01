<template>
  <v-container style="height:100%;display:grid;place-items:center;" class="pa-4">
    <v-row>
      <v-col
        cols="12"
        md="12"
        lg="12"
      >
        <v-card :loading="loading" class="mb-4 rounded-xl mx-auto elevation-0" height="600">
          <v-card-title class="text-center justify-center">
            <strong class="mr-1">Generar estados de cuenta para {{ activeServices.length }}</strong> servicios activos en {{ $route.query.city }} a la fecha
          </v-card-title>
          <v-card-text class="d-flex flex-column align-content-space-around gap-10" style="height:70%;">
            <v-select
              v-model="month"
              :items="months"
              return-object
              label="Mes a facturar"
              filled
              dense
              rounded
              hide-details="auto"
              class="mr-2"
            />
            <v-text-field
              v-model.number="year"
              label="Año a facturar"
              type="number"
              filled
              rounded
              dense
              hide-details="auto"
            />
            <v-text-field
              v-model="limit"
              label="Fecha Límite de Pago"
              type="date"
              filled
              rounded
              dense
              hide-details="auto"
            />
            <div class="d-flex flex-wrap mt-2 justify-center">
              <v-btn
                :disabled="!month || !year"
                color="primary"
                class="ma-1 flex-grow-1"
                @click="continueToNextStep"
              >
                Generar Nuevas Facturas <v-icon class="ml-1">
                  mdi-arrow-right
                </v-icon>
              </v-btn>
              <v-btn
                color="info"
                class="ma-1 flex-grow-1"
                @click="goToViewPage"
              >
                Revisar / Reenviar <v-icon class="ml-1">
                  mdi-email-search-outline
                </v-icon>
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
export default {
  data () {
    return {
      month: null,
      year: 0,
      limit: null,
      selectedCity: null,
      selectedClienttype: null,
      months: [
        {
          text: 'Enero',
          value: 1
        },
        {
          text: 'Febrero',
          value: 2
        },
        {
          text: 'Marzo',
          value: 3
        },
        {
          text: 'Abril',
          value: 4
        },
        {
          text: 'Mayo',
          value: 5
        },
        {
          text: 'Junio',
          value: 6
        },
        {
          text: 'Julio',
          value: 7
        },
        {
          text: 'Agosto',
          value: 8
        },
        {
          text: 'Septiembre',
          value: 9
        },
        {
          text: 'Octubre',
          value: 10
        },
        {
          text: 'Noviembre',
          value: 11
        },
        {
          text: 'Diciembre',
          value: 12
        }
      ],
      loading: false
    }
  },
  computed: {
    activeServices () {
      return this.$store.state.billing.activeServices
    },
    clienttypes () {
      return this.$store.state.company.clienttypes
    },
    cities () {
      return this.$store.state.company.cities
    },
    currentCity () {
      return this.$store.state.company.cities.find(c => c.name === this.$route.query.city)
    },
    currentClienttype () {
      return this.$store.state.company.clienttypes.find(c => c.name === this.$route.query.clienttype)
    }
  },
  watch: {
    // Watch for changes in limit and update store immediately
    limit (newLimit) {
      if (newLimit) {
        this.$store.commit('billing/setLimit', {
          limit: newLimit
        })
      }
    }
  },
  mounted () {
    const year = new Date().getFullYear()
    this.year = year

    const month = new Date().getMonth()
    const limitTOISO = new Date(year, month, 18).toISOString().substring(0, 10)
    this.limit = limitTOISO

    // Ensure the limit is saved to store on mount
    this.$store.commit('billing/setLimit', {
      limit: this.limit
    })
  },
  methods: {
    continueToNextStep () {
      // Reset active services before setting new month/year to force a refresh
      this.$store.commit('billing/resetListOfActiveServices')
      this.$store.commit('billing/resetSelectedServices')

      this.setMonth()
      this.setYear()
      this.$store.commit('billing/setLimit', {
        limit: this.limit
      })
      this.$router.push({
        path: '/billing/generate/prepare',
        query: {
          city: this.$route.query.city,
          clienttype: this.$route.query.clienttype,
          company: this.$route.query.company
        }
      })
    },
    goToViewPage () {
      this.$router.push({
        path: '/billing/generate/view',
        query: this.$route.query // Pass current context (city, clienttype, company)
      })
    },
    resetFields () {
      this.month = null
      this.year = 0
      this.limit = null
      this.$store.commit('billing/resetListOfActiveServices')
      this.$store.commit('billing/resetDate')
    },
    setYear () {
      this.$store.commit('billing/setYear', {
        year: this.year
      })
    },
    setMonth () {
      this.$store.commit('billing/setMonth', {
        month: this.month
      })
    },
    async getListOfActiveServices () {
      this.loading = true
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
      this.loading = false
    },
    removeOlderThanActualMonths () {
      const today = new Date()
      const currentMonth = today.getMonth() + 1
      this.months = this.months.filter((month) => {
        if (month.value >= currentMonth) {
          return true
        }
        return false
      })
    }
  }
}
</script>
