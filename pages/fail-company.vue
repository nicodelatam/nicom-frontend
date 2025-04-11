<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>
            Clientes Normalizados sin Compañía
            <v-spacer />
            <v-text-field
              v-model="search"
              append-icon="mdi-magnify"
              label="Buscar"
              single-line
              hide-details
              @input="getClientsWithoutCompany"
            />
          </v-card-title>
          <v-card-text>
            <v-data-table
              v-model="selected"
              :headers="headers"
              :items="clients"
              :items-per-page="10"
              :loading="loading"
              class="elevation-1"
              item-key="id"
              show-select
              :sort-by="['serviceCompany']"
              :sort-desc="[false]"
            >
              <template v-slot:item.serviceCompany="{ item }">
                {{ getServiceCompanyName(item) }}
              </template>
              <template v-slot:item.numServices="{ item }">
                {{ item.services?.length || 0 }}
              </template>
            </v-data-table>
          </v-card-text>
          <v-card-actions>
            <v-select
              v-model="selectedCompany"
              :items="companies"
              item-text="name"
              item-value="id"
              label="Seleccionar Compañía"
              :disabled="!selected.length"
              outlined
              dense
              class="mx-2"
              style="max-width: 300px"
            />
            <v-spacer />
            <v-btn
              color="primary"
              :disabled="!selected.length || !selectedCompany"
              :loading="assigning"
              @click="assignCompany"
            >
              Asignar Compañía
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  middleware: 'authenticated',
  data () {
    return {
      search: '',
      loading: false,
      assigning: false,
      clients: [],
      selected: [],
      selectedCompany: null,
      companies: [],
      headers: [
        { text: 'DNI', value: 'dni' },
        { text: 'Nombre', value: 'name' },
        { text: 'Teléfono', value: 'phone' },
        { text: 'Email', value: 'email' },
        { text: 'Compañía de Servicios', value: 'serviceCompany', sortable: true },
        { text: 'Número de Servicios', value: 'numServices' }
      ],
      pagination: {
        page: 1,
        pageSize: 100
      }
    }
  },
  created () {
    this.getClientsWithoutCompany()
    this.getCompanies()
  },
  methods: {
    getServiceCompanyName (client) {
      if (!client.services || client.services.length === 0) {
        return 'Sin servicios'
      }

      // If all services have the same company, return that company name
      const companyNames = [...new Set(client.services.map(service => service.company?.name).filter(Boolean))]
      if (companyNames.length === 1) {
        return companyNames[0]
      } else if (companyNames.length > 1) {
        return 'Múltiples compañías'
      }

      return 'Sin compañía en servicios'
    },
    async getClientsWithoutCompany () {
      this.loading = true
      try {
        const qs = require('qs')
        const query = qs.stringify({
          filters: {
            company: {
              $null: true
            },
            ...(this.search ? {
              $or: [
                { dni: { $contains: this.search } },
                { name: { $contains: this.search } },
                { phone: { $contains: this.search } },
                { email: { $contains: this.search } }
              ]
            } : {})
          },
          pagination: this.pagination,
          populate: ['services', 'services.company']
        }, {
          encodeValuesOnly: true
        })

        const response = await fetch(`${this.$config.API_STRAPI_ENDPOINT}normalized-clients?${query}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.$store.state.auth.token}`
          }
        })
        const { data, meta } = await response.json()
        this.clients = data
        this.pagination = meta?.pagination || this.pagination
      } catch (error) {
        console.error('Error fetching clients:', error)
        this.$toast.error('Error al obtener clientes', { position: 'bottom-center' })
      } finally {
        this.loading = false
      }
    },
    async getCompanies () {
      try {
        const response = await fetch(`${this.$config.API_STRAPI_ENDPOINT}companies`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.$store.state.auth.token}`
          }
        })
        const { data } = await response.json()
        this.companies = data
      } catch (error) {
        console.error('Error fetching companies:', error)
        this.$toast.error('Error al obtener compañías', { position: 'bottom-center' })
      }
    },
    async assignCompany () {
      if (!this.selected.length || !this.selectedCompany) {
        return
      }

      this.assigning = true

      try {
        const updatePromises = this.selected.map(client =>
          fetch(`${this.$config.API_STRAPI_ENDPOINT}normalized-clients/${client.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${this.$store.state.auth.token}`
            },
            body: JSON.stringify({
              data: {
                company: this.selectedCompany
              }
            })
          })
        )

        await Promise.all(updatePromises)

        this.$toast.success(`${this.selected.length} clientes actualizados con éxito`, { position: 'bottom-center' })
        this.selected = []
        this.getClientsWithoutCompany()
      } catch (error) {
        console.error('Error updating clients:', error)
        this.$toast.error('Error al actualizar clientes', { position: 'bottom-center' })
      } finally {
        this.assigning = false
      }
    }
  }
}
</script>
