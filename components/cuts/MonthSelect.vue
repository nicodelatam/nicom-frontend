<template>
  <div>
    <div class="d-flex">
      <v-select
        v-model="selectedCity"
        :items="cities"
        label="Filtrar Ciudad"
        item-value="id"
        item-text="name"
        return-object
        filled
        rounded
        hide-details="auto"
        class="mr-2 elevation-0"
        style="width:180px;"
        @change="changeCity(selectedCity)"
      >
        <template v-slot:item="{ item }">
          {{ item.name }}
        </template>
      </v-select>
      <v-select
        v-model="selectedClienttype"
        :items="clienttypes"
        label="Filtrar Servicio"
        item-value="id"
        item-text="name"
        return-object
        filled
        rounded
        hide-details="auto"
        class="mr-2 elevation-0"
        style="width:180px;"
        @change="changeType(selectedClienttype)"
      >
        <template v-slot:item="{ item }">
          {{ item.name }}
        </template>
      </v-select>
      <v-select
        v-model="month"
        :items="months"
        label="Mes a operar"
        class="mr-2 elevation-0"
        filled
        rounded
      />
      <v-text-field
        v-model.number="year"
        type="Number"
        label="Año a operar"
        max="9999"
        filled
        rounded
      />
    </div>
    <v-btn
      :disabled="!selectedCity || !selectedClienttype"
      color="primary"
      @click="addBillingPeriod"
    >
      Continuar
    </v-btn>
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
      ]
    }
  },
  computed: {
    cities () {
      return this.$store.state.company.cities
    },
    clienttypes () {
      return this.$store.state.company.clienttypes
    }
  },
  watch: {
    month () {
      this.setMonth()
    },
    year () {
      this.setYear()
    }
  },
  mounted () {
    this.setSelectedCity()
    this.setSelectedClienttype()
  },
  methods: {
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
      if (lastbillingperiod) {
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
      if (this.$route.query.city) {
        this.selectedCity = this.$store.state.company.cities.find(c => c.name === this.$route.query.city)
      }
    },
    setSelectedClienttype () {
      if (this.$route.query.clienttype) {
        this.selectedClienttype = this.$store.state.company.clienttypes.find(c => c.name === this.$route.query.clienttype)
      }
    },
    changeCity (city) {
      this.$router.push({ query: { city: city.name, clienttype: this.$route.query.clienttype } })
    },
    changeType (clienttype) {
      this.$router.push({ query: { city: this.$route.query.city, clienttype: clienttype.name } })
    },
    setMonth () {
      this.$store.commit('cuts/setMonth', this.month)
    },
    setYear () {
      this.$store.commit('cuts/setYear', this.year)
    }
  }
}
</script>
