<template>
  <div class="d-flex mt-3" :style="isDesktop ? 'gap:10px;' : ''">
    <v-select
      v-model="selectedCompany"
      :items="companies"
      label="Empresa"
      item-value="id"
      item-text="name"
      return-object
      solo
      dense
      :disabled="companies.length === 1"
      hide-details="auto"
      class="elevation-0"
      style="border-radius: 5px 0 0 5px;height:48px;"
      @change="changeCompany(selectedCompany)"
    >
      <template v-slot:selection="{ item }">
        {{ item.name }}
      </template>
    </v-select>
    <v-select
      v-model="selectedCity"
      :items="cities"
      label="Ciudad"
      item-value="id"
      item-text="name"
      return-object
      solo
      dense
      rounded
      hide-details="auto"
      class="elevation-0"
      style="border-radius: 0;height:48px;"
      @change="changeCity(selectedCity)"
    >
      <template v-slot:selection="{ item }">
        {{ item.name }}
      </template>
    </v-select>
    <v-select
      v-model="selectedClienttype"
      :items="clienttypes"
      label="Tipo"
      item-value="id"
      item-text="name"
      return-object
      solo
      dense
      rounded
      hide-details="auto"
      class="elevation-0"
      style="border-radius: 0 5px 5px 0;height:48px;"
      @change="changeType(selectedClienttype)"
    >
      <template v-slot:selection="{ item }">
        {{ item.name }}
      </template>
    </v-select>
  </div>
</template>
<script>
export default {
  data () {
    return {
      selectedCity: null,
      selectedClienttype: null,
      selectedCompany: null
    }
  },
  computed: {
    currentCity () {
      return this.$store.state.company.cities ? this.$store.state.company.cities.find(c => c.name === this.$route.query.city) : null
    },
    currentClienttype () {
      return this.$store.state.company.clienttypes ? this.$store.state.company.clienttypes.find(c => c.name === this.$route.query.clienttype) : null
    },
    currentCompany () {
      return this.$store.state.auth.companies ? this.$store.state.auth.companies.find(c => c.name === this.$route.query.company) : null
    },
    cities () {
      return this.$store.state.company.cities ? this.$store.state.company.cities : []
    },
    clienttypes () {
      return this.$store.state.company.clienttypes ? this.$store.state.company.clienttypes : []
    },
    companies () {
      return this.$store.state.auth.companies ? this.$store.state.auth.companies : []
    },
    isDesktop () {
      return this.$store.state.isDesktop
    }
  },
  watch: {
    '$route.query.company' () {
      this.selectedCompany = this.currentCompany
      this.selectedCity = this.currentCity
      this.selectedClienttype = this.currentClienttype
    }
  },
  mounted () {
    setTimeout(() => {
      this.selectedCity = this.currentCity
      this.selectedClienttype = this.currentClienttype
    }, 100)
    this.selectedCompany = this.currentCompany
    this.changeCompany(this.selectedCompany)
  },
  methods: {
    changeCompany (company) {
      this.$router.push({ path: this.$route.path, query: { city: company.cities[0].name, clienttype: company.clienttypes[0].name, company: company.name } })
      this.$store.commit('company/setCurrentCompany', company)
    },
    changeCity (city) {
      this.$router.push({ path: this.$route.path, query: { city: city.name, clienttype: this.$route.query.clienttype, company: this.$route.query.company } })
    },
    changeType (clienttype) {
      this.$router.push({ path: this.$route.path, query: { city: this.$route.query.city, clienttype: clienttype.name, company: this.$route.query.company } })
    }
  }
}
</script>
