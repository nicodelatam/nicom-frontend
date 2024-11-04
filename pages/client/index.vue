<template>
  <v-container fluid class="pt-0">
    <MainSearchBox />
    <MainLatestServices v-if="!$route.query.search" />
    <MainClientList v-if="$route.query.search" />
  </v-container>
</template>
<script>
export default {
  name: 'ClientSearch',
  data () {
    return {
    }
  },
  computed: {
  },
  watch: {
  },
  async mounted () {
  },
  methods: {
  }
}
</script>
