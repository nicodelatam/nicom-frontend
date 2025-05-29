<template>
  <div>
    <v-card outlined class="mb-4">
      <v-card-title>
        <v-icon left>
          mdi-calendar-month
        </v-icon>
        Seleccionar Período
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-select
              v-model="month"
              :items="months"
              label="Mes a procesar"
              outlined
              prepend-inner-icon="mdi-calendar"
              :rules="[rules.required]"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="year"
              type="number"
              label="Año"
              outlined
              prepend-inner-icon="mdi-calendar-text"
              :rules="[rules.required, rules.validYear]"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-row class="mb-4">
      <v-col cols="12" md="6">
        <v-card outlined>
          <v-card-text class="text-center py-4">
            <div class="text-h6 mb-1">
              {{ getSelectedPeriodText() }}
            </div>
            <div class="text-body-2 text--secondary">
              {{ getStatusText() }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="6" class="d-flex align-center">
        <v-btn
          :disabled="!canContinue"
          color="primary"
          large
          block
          @click="addBillingPeriod"
        >
          <v-icon left>
            mdi-arrow-right
          </v-icon>
          {{ getButtonText() }}
        </v-btn>
      </v-col>
    </v-row>
  </div>
</template>

<script>
export default {
  data () {
    return {
      month: null,
      year: null,
      selectedCity: null,
      selectedClienttype: null,
      months: [
        {
          text: 'Enero',
          value: '1'
        },
        {
          text: 'Febrero',
          value: '2'
        },
        {
          text: 'Marzo',
          value: '3'
        },
        {
          text: 'Abril',
          value: '4'
        },
        {
          text: 'Mayo',
          value: '5'
        },
        {
          text: 'Junio',
          value: '6'
        },
        {
          text: 'Julio',
          value: '7'
        },
        {
          text: 'Agosto',
          value: '8'
        },
        {
          text: 'Septiembre',
          value: '9'
        },
        {
          text: 'Octubre',
          value: '10'
        },
        {
          text: 'Noviembre',
          value: '11'
        },
        {
          text: 'Diciembre',
          value: '12'
        }
      ],
      rules: {
        required: value => !!value || 'Este campo es requerido',
        validYear: value => value >= 2020 || 'El año debe ser mayor o igual a 2020'
      }
    }
  },
  computed: {
    cities () {
      return this.$store.state.company.cities
    },
    clienttypes () {
      return this.$store.state.company.clienttypes
    },
    isCurrentMonth () {
      const currentMonth = new Date().getMonth() + 1
      return this.month === currentMonth.toString()
    },
    isPastMonth () {
      const currentMonth = new Date().getMonth() + 1
      return this.month < currentMonth && this.month !== null
    },
    isFutureMonth () {
      const currentMonth = new Date().getMonth() + 1
      return this.month > currentMonth && this.month !== null
    },
    canContinue () {
      return this.selectedCity && this.selectedClienttype && this.month && this.year
    }
  },
  watch: {
    month () {
      this.setMonth()
    },
    year () {
      this.setYear()
    },
    cities: {
      handler (newCities) {
        if (newCities && newCities.length > 0 && !this.selectedCity) {
          this.setSelectedCity()
        }
      },
      immediate: true
    },
    clienttypes: {
      handler (newClienttypes) {
        if (newClienttypes && newClienttypes.length > 0 && !this.selectedClienttype) {
          this.setSelectedClienttype()
        }
      },
      immediate: true
    }
  },
  mounted () {
    this.$nextTick(() => {
      this.initializeDefaults()
      this.setSelectedCity()
      this.setSelectedClienttype()
    })
  },
  methods: {
    initializeDefaults () {
      const currentDate = new Date()
      this.year = currentDate.getFullYear()
      const currentMonth = currentDate.getMonth() + 1
      this.month = currentMonth.toString()
    },
    async addBillingPeriod () {
      if (this.month && this.year) {
        this.setMonth()
        this.setYear()
      } else {
        this.$toast.error('Debe seleccionar un mes y un año', { duration: 4000 })
        return
      }
      const lastbillingperiod = await this.$store.dispatch('cuts/getLastBillingPeriod', {
        city: this.selectedCity,
        token: this.$store.state.auth.token
      })
      if (lastbillingperiod && lastbillingperiod.length > 0) {
        console.log(lastbillingperiod)
        this.$store.commit('cuts/currentBillingPeriod', lastbillingperiod[0].id)
        if (lastbillingperiod[0].month === parseInt(this.month) && lastbillingperiod[0].year === this.year) {
          this.$store.commit('cuts/e1', '2')
          return
        }
      }
      const billingperiod = await this.$store.dispatch('cuts/addBillingPeriod', {
        city: this.selectedCity,
        token: this.$store.state.auth.token,
        name: this.months.find(m => m.value === this.month).text,
        month: parseInt(this.month),
        year: this.year
      })
      this.$store.commit('cuts/currentBillingPeriod', billingperiod.id)
      this.$toast.info('Periodo de facturacion agregado', { duration: 4000 })
      this.$store.commit('cuts/e1', '2')
    },
    setSelectedCity () {
      if (this.$route.query.city && this.cities && this.cities.length > 0) {
        const foundCity = this.cities.find(c => c.name === this.$route.query.city)
        if (foundCity) {
          this.selectedCity = foundCity
        } else if (this.cities.length > 0) {
          this.selectedCity = this.cities[0]
        }
      }
    },
    setSelectedClienttype () {
      if (this.$route.query.clienttype && this.clienttypes && this.clienttypes.length > 0) {
        const foundClienttype = this.clienttypes.find(c => c.name === this.$route.query.clienttype)
        if (foundClienttype) {
          this.selectedClienttype = foundClienttype
        } else if (this.clienttypes.length > 0) {
          this.selectedClienttype = this.clienttypes[0]
        }
      }
    },
    setMonth () {
      this.$store.commit('cuts/setMonth', this.month)
    },
    setYear () {
      this.$store.commit('cuts/setYear', this.year)
    },
    getSelectedPeriodText () {
      if (this.month && this.year) {
        return `${this.months.find(m => m.value === this.month)?.text} ${this.year}`
      }
      return 'Seleccione un período'
    },
    getStatusText () {
      if (this.isCurrentMonth) { return 'Período actual' }
      if (this.isPastMonth) { return 'Período anterior' }
      if (this.isFutureMonth) { return 'Período futuro' }
      return 'Período no seleccionado'
    },
    getButtonText () {
      if (this.month && this.year) {
        return `Continuar con ${this.months.find(m => m.value === this.month)?.text}`
      }
      return 'Seleccione un período'
    }
  }
}
</script>
