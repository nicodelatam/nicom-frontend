<template>
  <v-card class="rounded-xl">
    <v-card-title>
      <v-icon class="mr-2">
        mdi-account
      </v-icon>
      Crear Cliente
    </v-card-title>
    <v-divider class="mb-5" />
    <v-card-text>
      <v-alert
        v-if="alertBox"
        type="info"
        :class="alertBoxColor"
        tile
        dismissible
      >
        {{ createdMessage }}
      </v-alert>
      <v-form v-model="valid">
        <v-row>
          <v-col>
            <v-select
              v-model="Client.company"
              :items="[currentCompany]"
              label="Compañia"
              item-value="id"
              item-text="name"
              required
              outlined
              return-object
              dense
              hide-details
            />
          </v-col>
          <v-col>
            <v-select
              v-model="Client.city"
              :items="currentCompany.cities"
              label="Ciudad"
              item-value="id"
              item-text="name"
              required
              outlined
              return-object
              dense
              hide-details
            />
          </v-col>
          <v-col>
            <v-select
              v-model="Client.clienttype"
              :items="currentCompany.clienttypes"
              label="Tipo de cliente"
              item-value="id"
              item-text="name"
              required
              outlined
              return-object
              dense
              hide-details
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-text-field
              ref="dni"
              v-model="Client.dni"
              type="number"
              label="Cedula"
              :rules="valid_dni"
              autocomplete="off"
              required
              outlined
              dense
              :error="codeError"
              :success="codeSuccess"
              :hint="d00pHint"
              :persistent-hint="codeError"
              :hide-details="hideD00pHint"
              @blur="duplicateDni(Client.dni)"
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-text-field
              :value="Client.name ? Client.name.toUpperCase() : ''"
              label="Nombre Completo"
              required
              outlined
              dense
              hide-details
              @input="Client.name = $event.toUpperCase()"
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-text-field
              v-model="Client.phone"
              label="Telefono"
              required
              outlined
              dense
              hide-details
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-text-field
              ref="email"
              v-model="Client.email"
              label="Correo Electronico"
              required
              :rules="email"
              outlined
              dense
              hide-details="auto"
            />
          </v-col>
        </v-row>
        <v-btn
          class="mr-4 mt-4"
          color="primary"
          :loading="isSubmitting"
          :disabled="isSubmitting || incompleteCreation"
          @click="createClient"
        >
          Crear Cliente
        </v-btn>
        <v-btn
          v-if="incompleteCreation"
          class="mr-4 mt-4"
          color="secondary"
          :loading="isSubmitting"
          :disabled="isSubmitting"
          @click="continueCreation"
        >
          CONTINUAR CREACION
        </v-btn>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'CreateForm',
  props: {
    clientPhone: {
      type: String,
      default: ''
    }
  },
  data: () => {
    return {
      valid: false,
      offers: null,
      Client: {
        name: '',
        dni: '',
        phone: '',
        email: null,
        company: null,
        city: null,
        clienttype: null
      },
      alertBox: false,
      alertBoxColor: '',
      createdMessage: '',
      isSubmitting: false,
      email: [
        v => !!v || 'El correo es requerido',
        v => /\S+@\S+\.\S+/.test(v) || 'El correo no es valido'
      ],
      valid_dni: [
        (value) => {
          const pattern = /^[A-Za-z0-9]+$/
          return pattern.test(value) || 'La Cédula/NIT no debe llevar guiónes.'
        }
      ],
      codeError: false,
      hideD00pHint: true,
      d00pHint: '',
      codeSuccess: null,
      incompleteCreation: false
    }
  },
  computed: {
    currentCompany () {
      return this.$store.state.company.currentCompany
    }
  },
  watch: {
    'Client.clienttype' (newVal) {
      if (newVal.name === this.$route.query.clienttype) { return }
      this.$router.replace({ query: { company: this.$route.query.company, city: this.$route.query.city, clienttype: newVal.name } })
    },
    'Client.city' (newVal) {
      console.log(newVal)
      if (newVal.name === this.$route.query.city) { return }
      this.$router.replace({ query: { company: this.$route.query.company, clienttype: this.$route.query.clienttype, city: newVal.name } })
    }
  },
  mounted () {
    if (this.clientPhone) {
      this.Client.phone = this.clientPhone
    }
    setTimeout(() => {
      this.Client.company = this.$store.state.company.currentCompany
    }, 1000)
  },
  methods: {
    duplicateDni (dni) {
      const qs = require('qs')
      const query = qs.stringify({
        filters: {
          company: {
            $eq: this.currentCompany.id
          },
          dni: {
            $eq: dni
          }
        },
        populate: ['services']
      },
      {
        encodeValuesOnly: true
      })
      return new Promise((resolve, reject) => {
        fetch(`${this.$config.API_STRAPI_ENDPOINT}normalized-clients?${query}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.$store.state.auth.token}`
          }
        })
          .then(res => res.json())
          .then(({ data: client }) => {
            if (client.length > 0) {
              this.valid = false
              this.d00pHint = 'Ya existe un cliente con esta cedula.'
              this.codeError = true
              this.hideD00pHint = false
              if (client[0].services === null || client[0].services.length === 0) {
                this.d00pHint = 'La creación del cliente no se completó. Puede continuar con el boton de abajo.'
                this.incompleteCreation = true
              }
            } else {
              this.valid = true
              this.codeError = false
              this.hideD00pHint = true
              this.codeSuccess = true
              resolve(false)
            }
          }).catch((error) => {
            // eslint-disable-next-line no-console
            console.error(error)
          })
      })
    },
    async createClient () {
      this.isSubmitting = true
      if (await this.duplicateDni(this.Client.dni)) {
        this.$toast.error('Ya existe un cliente con esta cedula.', { duration: 5000 })
        this.isSubmitting = false
        return
      }
      if (
        this.Client.name === '' || this.Client.dni === '' || this.Client.phone === '' || this.Client.email === null || this.Client.company === null || this.Client.city === null || this.Client.clienttype === null
      ) {
        this.$toast.error('Por favor, complete todos los campos.')
        this.isSubmitting = false
        return
      }
      await fetch(`${this.$config.API_STRAPI_ENDPOINT}normalized-clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.$store.state.auth.token}`
        },
        body: JSON.stringify({
          data: { ...this.Client }
        })
      })
        .then(res => res.json())
        .then(({ data: client }) => {
          this.isSubmitting = false
          // Instead of routing directly, emit an event with the created client data
          this.$emit('client-created', {
            id: client.id,
            name: this.Client.name,
            dni: this.Client.dni,
            phone: this.Client.phone,
            email: this.Client.email
          })
        }).catch((error) => {
          this.$toast.error(`Ha ocurrido un error ${error}`, { duration: 5000 })
          this.isSubmitting = false
        })
    },
    async continueCreation () {
      this.isSubmitting = true
      if (
        this.Client.dni === '' || this.Client.city === null || this.Client.clienttype === null || this.Client.company === null
      ) {
        this.$toast.error('Por favor, complete los campos para continuar con la creación.')
        this.isSubmitting = false
        return
      }

      const qs = require('qs')
      const query = qs.stringify({
        filters: {
          company: {
            $eq: this.currentCompany.id
          },
          dni: {
            $eq: this.Client.dni
          }
        },
        populate: ['services']
      },
      {
        encodeValuesOnly: true
      })
      await fetch(`${this.$config.API_STRAPI_ENDPOINT}normalized-clients?${query}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.$store.state.auth.token}`
        }
      })
        .then(res => res.json())
        .then(({ data: client }) => {
          this.isSubmitting = false
          // Instead of routing directly, emit an event with the created client data
          this.$emit('client-created', {
            id: client[0].id,
            name: client[0].name,
            dni: client[0].dni,
            phone: client[0].phone,
            email: client[0].email
          })
        }).catch((error) => {
          this.$toast.error(`Ha ocurrido un error ${error}`, { duration: 5000 })
          this.isSubmitting = false
        })
    }
  }
}
</script>

<style scoped>
.parent {
  display:grid;
  grid-template-columns: 2fr 1fr 2fr 1fr 1fr 2fr 1fr 2fr;
  column-gap: 10px;
}
</style>
