<template>
  <v-container
    fluid
    class="transparent"
  >
    <v-row
      style="height:97vh;"
      class="d-flex align-center"
    >
      <v-col
        cols="12"
        md="4"
        lg="4"
        class="align-center"
      >
        <AuthForm />
      </v-col>
      <v-col
        cols="12"
        md="8"
        lg="8"
      >
        <v-img
          src="login.png"
          alt="Login Image"
          class="rounded-xl"
          style="max-width:100%;height:100%;"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import AuthForm from '../components/auth/AuthForm.vue'
export default {
  layout: 'outuser',
  components: {
    AuthForm
  },
  middleware: 'notAuthenticated',
  head () {
    return {
      title: 'Nicom',
      meta: [
        { hid: 'language', name: 'language', content: 'es' },
        { hid: 'audience', name: 'audience', content: 'all' },
        { hid: 'rating', name: 'rating', content: 'general' },
        { hid: 'distribution', name: 'distribution', content: 'global' },
        { hid: 'document-type', name: 'document-type', content: 'Public' },
        { hid: 'MSSmartTagsPreventParsing', name: 'MSSmartTagsPreventParsing', content: 'true' },
        { hid: 'robots', name: 'robots', content: 'all' },
        { hid: 'robots', name: 'robots', content: 'all, index, follow' },
        { hid: 'googlebot', name: 'googlebot', content: 'all, index, follow' },
        { hid: 'yahoo-slurp', name: 'yahoo-slurp', content: 'all, index, follow' },
        { hid: 'msnbot', name: 'msnbot', content: 'index, follow' },
        { hid: 'googlebot-image', name: 'googlebot-image', content: 'all' },
        { hid: 'title', name: 'title', content: this.title },
        { hid: 'og:title', property: 'og:title', content: this.title },
        { hid: 'og:description', property: 'og:description', content: 'Nicom Integrado' },
        { hid: 'author', name: 'author', content: 'Esmeralda Rojas' }
      ]
    }
  }
}
</script>

<style>
body {
    color: rgba(255,255,255,0.65);
    background-color: #24292e;
    background-image: url('/star-bg.svg'),linear-gradient(#191c20, #1e1e1e 50%);
    background-repeat: no-repeat;
    background-position: center 0, 0 0, 0 0;
    background-size: cover;
}
</style>
