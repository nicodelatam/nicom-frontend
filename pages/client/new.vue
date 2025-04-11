<template>
  <v-container>
    <v-card class="rounded-xl mx-auto" max-width="1200">
      <v-card-title class="justify-center">
        Afiliación de Cliente | Proceso Simplificado
      </v-card-title>
      <v-divider class="mb-5" />

      <v-stepper v-model="currentStep" class="transparent elevation-0">
        <v-stepper-header>
          <v-stepper-step
            :complete="currentStep > 1"
            step="1"
          >
            Datos del Cliente
          </v-stepper-step>
          <v-divider />

          <v-stepper-step
            step="2"
            :editable="clientCreated"
          >
            Configuración del Servicio
          </v-stepper-step>
        </v-stepper-header>

        <v-stepper-items>
          <v-stepper-content step="1">
            <v-card class="mb-5" flat>
              <ClientForm
                ref="clientForm"
                :client-phone="clientPhone"
                @client-created="onClientCreated"
              />
            </v-card>
          </v-stepper-content>

          <v-stepper-content step="2">
            <v-card flat>
              <CreateService
                v-if="clientCreated"
                :client-data="clientData"
              />
            </v-card>
          </v-stepper-content>
        </v-stepper-items>
      </v-stepper>
    </v-card>
  </v-container>
</template>

<script>
import ClientForm from '~/components/create/Form.vue'
import CreateService from '~/components/create/CreateService.vue'

export default {
  components: {
    ClientForm,
    CreateService
  },
  data () {
    return {
      currentStep: 1,
      clientCreated: false,
      clientData: null,
      clientPhone: ''
    }
  },
  methods: {
    onClientCreated (clientData) {
      this.clientData = clientData
      this.clientCreated = true
      this.currentStep = 2
    }
  }
}
</script>
