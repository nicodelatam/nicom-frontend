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
      :items="currentCompany.cities"
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
      :items="currentCompany.clienttypes"
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
    currentCompany () {
      return this.$store.state.auth.companies ? this.$store.state.auth.companies.find(c => c.name === this.$route.query.company) : null
    },
    preferredCity () {
      return this.$store.state.auth.preferredcity ? this.$store.state.auth.preferredcity : null
    },
    preferredClienttype () {
      return this.$store.state.auth.preferredclienttype ? this.$store.state.auth.preferredclienttype : null
    },
    companies () {
      return this.$store.state.auth.companies ? this.$store.state.auth.companies : []
    },
    isDesktop () {
      return this.$store.state.isDesktop
    }
  },
  mounted () {
    setTimeout(() => {
      this.changeCompany(this.selectedCompany)
    }, 100)
    this.selectedCity = this.preferredCity
    this.selectedClienttype = this.preferredClienttype
    this.selectedCompany = this.currentCompany
  },
  methods: {
    changeCompany (company) {
      this.$router.push({ path: this.$route.path, query: { city: company.cities[0].name, clienttype: company.clienttypes[0].name, company: this.selectedCompany.name } })
      this.$store.commit('company/setCurrentCompany', company)
      this.selectedCity = company.cities[0]
      this.selectedClienttype = company.clienttypes[0]
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
