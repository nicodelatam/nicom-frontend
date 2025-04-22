<template>
  <CreateService :client-data="clientData" />
</template>

<script>
import CreateService from '~/components/create/CreateService.vue'

export default {
  components: { CreateService },
  computed: {
    clientData () {
      // Lee los parámetros relevantes del query string
      const query = this.$route.query
      // Solo crea el objeto si hay datos mínimos
      if (!query.client && !query.name && !query.dni && !query.phone) { return null }
      return {
        id: query.client ? Number(query.client) : undefined,
        name: query.name || '',
        dni: query.dni || '',
        phone: query.phone || ''
      }
    }
  }
}
</script>
