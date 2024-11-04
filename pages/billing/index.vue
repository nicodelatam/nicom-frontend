<template>
  <v-container fluid>
    <BillingClientSearch />
    <BillingClientList v-if="$route.query.search" />
  </v-container>
</template>
<script>
export default {
  head () {
    return {
      title: 'Estado de Cuenta'
    }
  }
}
</script>
