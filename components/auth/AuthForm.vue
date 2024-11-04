<template>
  <div>
    <v-card
      flat
      :loading="isLoading"
      class="rounded-xl"
      style="background-color: rgb(0,0,0,0.3); backdrop-filter: blur(5px);"
    >
      <p
        v-if="firstTime"
        type="info"
        class="blue darken-4"
        tile
      >
        Nicom Integrado
      </p>
      <p
        v-if="loginFailed"
        type="error"
        tile
        class="rounded-t-xl"
      >
        No se ha podido iniciar sesion <br>
        <span class="text-subtitle-2">{{ errorMessages }}</span>
      </p>
      <v-alert
        v-if="sessionExpired"
        class="yellow darken-4 rounded-t-xl"
        tile
      >
        Tu sesión ha expirado. Ingresa nuevamente.
      </v-alert>
      <v-alert
        v-if="loginSuccessful"
        type="info"
        tile
        class="rounded-t-xl"
      >
        ¡Inicio de sesión correcto! Por favor espere.
      </v-alert>
      <v-card-text
        class="d-flex justify-center"
      >
        <!-- <img
          src="logo.png"
          alt="Nicom Logo"
          style="max-width:50%;"
        > -->
      </v-card-text>
      <v-card-text>
        <form @keyup.enter="login">
          <v-text-field
            v-model="username"
            label="Ingreso"
            class="rounded-xl"
            hide-details="auto"
            solo
            required
          />
          <v-text-field
            v-model="password"
            type="password"
            label="Clave"
            class="rounded-xl mt-4"
            hide-details="auto"
            solo
            required
          />
        </form>
      </v-card-text>
      <v-card-text>
        <v-btn
          tile
          text
          block
          class="blue darken-1 white--text"
          :loading="isLoading"
          :disabled="isLoading"
          @click.enter="login"
        >
          Iniciar Sesión
        </v-btn>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import Cookie from 'js-cookie'

export default {
  data: () => ({
    username: '',
    usernameRules: [
      v => !!v || 'Usuario requerido',
      v => (v && v.length <= 32) || 'El nombre debe ser de menos de 32 caracteres de longitud.'
    ],
    password: '',
    passwordRules: [
      v => !!v || 'Debes ingresar una contraseña',
      v => (v && v.length >= 8) || 'La contraseña debe ser de almenos 8 caracteres.'
    ],
    showPassword: false,
    firstTime: false,
    loginFailed: false,
    loginSuccessful: false,
    isLoading: false,
    sessionExpired: false,
    errorMessages: ''
  }),
  mounted () {
    if (this.$route.query.firstTime) {
      this.firstTime = true
    }
    if (this.$route.query.loginFailed) {
      this.loginFailed = true
    }
    if (this.$route.query.sessionExpired) {
      this.sessionExpired = true
    }
  },
  methods: {
    clear () {
      this.username = ''
      this.password = ''
    },
    async login () {
      this.isLoading = true
      this.loginFailed = false
      this.clearSessionData()
      await fetch(`${this.$config.API_STRAPI_ENDPOINT}auth/local`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          identifier: this.username,
          password: this.password
        })
      }).then((login) => {
        if (login.status === 200) {
          Promise.resolve(login.json())
            .then((res) => {
              this.logininfo(res)
            })
        } else {
          this.loginFailed = true
          this.isLoading = false
          this.sessionExpired = false
        }
      }).catch((error) => {
        // eslint-disable-next-line no-console
        console.error(error)
      })
    },
    async logininfo (response) {
      this.loginSuccessful = true
      const qs = require('qs')
      const query = qs.stringify({
        populate: ['role', 'menus', 'companies', 'companies.cities', 'companies.cities.mikrotiks', 'companies.clienttypes', 'preferredcompany']
      },
      {
        encodeValuesOnly: true
      })
      await fetch(`${this.$config.API_STRAPI_ENDPOINT}users/${response.user.id}?${query}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${response.jwt}`
        }
      })
        .then(res => res.json())
        .then((userResponse) => {
          const userData = userResponse
          const userCompanies = userResponse.companies.map((company) => {
            return {
              id: company.id,
              name: company.name,
              cities: company.cities || null,
              clienttypes: company.clienttypes || null
            }
          })
          const userMenus = userResponse.menus.map((menu) => {
            return {
              id: menu.id,
              name: menu.name,
              icon: menu.icon,
              url: menu.url,
              priority: menu.priority
            }
          })
          if (!userCompanies && userCompanies.cities === null) {
            this.errorMessages = 'Ciudad no especificada para el usuario'
            this.loginFailed = true
            this.loginSuccessful = false
            this.isLoading = false
          } else {
            const auth = {
              id: userData.id,
              username: userData.username,
              preferredcity: userCompanies[0].cities[0],
              preferredclienttype: userCompanies[0].clienttypes[0],
              preferredcompany: userData.preferredcompany,
              companies: userCompanies,
              menu: userMenus.sort((a, b) => a.priority - b.priority),
              role: userData.role,
              telegramchatid: userData.telegramchatid
            }
            const authCookie = {
              token: response.jwt,
              preferredcity: { name: userCompanies[0].cities[0].name },
              preferredclienttype: { name: userCompanies[0].clienttypes[0].name },
              preferredcompany: { name: userCompanies[0].name }
            }
            Cookie.set('auth', authCookie, { expires: 7, path: '/' })
            localStorage.setItem('auth', JSON.stringify(auth))
            const redirectPath = `/client?city=${auth && auth.preferredcity ? auth.preferredcity.name : userCompanies[0].cities[0].name}&clienttype=${userData && auth.preferredclienttype ? auth.preferredclienttype.name : 'INTERNET'}&view=TODOS`
            window.location.href = redirectPath
            this.isLoading = false
          }
        }).catch((_) => {
          this.errorMessages = 'error'
          this.loginFailed = true
          this.loginSuccessful = false
          this.isLoading = false
        })
    },
    clearSessionData () {
      Cookie.remove('auth')
      Cookie.remove('token')
      localStorage.clear()
      sessionStorage.clear()
      this.$store.commit('setAuth', null)
      caches.delete(`nn-precache-${this.$config.API_VERSION}`)
      caches.delete(`nn-runtime-cache-${this.$config.API_VERSION}`)
    }
  }
}
</script>

<style>

</style>
