<template>
  <v-container>
    <v-card class="rounded-xl mx-auto elevation-0" max-width="1024">
      <v-card-title class="justify-center">
        Afiliación de Cliente | Proceso
      </v-card-title>
      <v-stepper v-model="e1" class="transparent elevation-0">
        <v-stepper-header>
          <!-- <v-stepper-step
            :complete="e1 > 1"
            step="1"
          >
            Disponibilidad de WhatsApp
          </v-stepper-step>

          <v-divider /> -->

          <v-stepper-step
            :complete="e1 > 1"
            step="1"
          >
            Numero celular
          </v-stepper-step>
          <v-divider />

          <v-stepper-step step="2">
            Verificacion de Numero
          </v-stepper-step>
        </v-stepper-header>

        <v-stepper-items>
          <!-- <v-stepper-content step="1">
            <CreateTypeDisponibility />
          </v-stepper-content> -->

          <v-stepper-content step="1">
            <CreateSendVerification />
          </v-stepper-content>

          <v-stepper-content step="2">
            <CreateVerification />
          </v-stepper-content>
        </v-stepper-items>
      </v-stepper>
    </v-card>
  </v-container>
</template>
<script>
export default {
  computed: {
    e1 () {
      return this.$store.state.create.e1
    },
    hasWhatsapp () {
      return this.$store.state.create.hasWhatsapp
    }
  }
}
</script>
