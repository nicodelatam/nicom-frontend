<template>
  <v-app
    v-if="$store.state.localStorageLoaded"
    class="text-body-2"
    :style="this.$vuetify.theme.dark ? 'background-color:rgb(20 20 20 / 68%);' : 'background-color:#fafafa;'"
  >
    <v-navigation-drawer
      v-model="drawer"
      class="no-printme"
      :color="this.$vuetify.theme.dark ? 'grey darken-4' : ''"
      app
      :permanent="$store.state.isDesktop"
      :expand-on-hover="$store.state.isDesktop"
      :mini-variant="$store.state.isDesktop"
      :bottom="!$store.state.isDesktop"
    >
      <v-list
        nav
      >
        <v-list-item class="pl-1">
          <v-menu offset-y :close-on-content-click="false">
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                class="elevation-0 pa-1"
                :class="$vuetify.theme.dark ? 'white black--text' : 'grey lighten-2 black--text'"
                fab
                x-small
                v-bind="attrs"
                v-on="on"
              >
                {{ $store.state.auth.username.charAt(0).toUpperCase() + $store.state.auth.username.slice(1) }}
              </v-btn>
            </template>
            <v-list>
              <v-list-item>
                <v-icon
                  :class="$nuxt.isOffline ? 'red--text darken-4 px-2 py-3 justify-center align-center d-flex' : 'green--text darken-4 px-2 py-3 justify-center align-center d-flex'"
                >
                  mdi-account
                </v-icon>
                <span>{{ $store.state.auth.username.charAt(0).toUpperCase() + $store.state.auth.username.slice(1) }}</span>
              </v-list-item>
              <v-list-item>
                <v-switch
                  v-model="light"
                  :prepend-icon="light ? 'mdi-white-balance-sunny' : 'mdi-moon-waning-crescent'"
                  class="mt-5"
                  @change="changeTheme()"
                />
              </v-list-item>
              <v-list-item>
                <v-tooltip bottom>
                  <template v-slot:activator="{ on, attrs }">
                    <v-btn
                      icon
                      large
                      v-bind="attrs"
                      v-on="on"
                      @click="logout(false)"
                    >
                      <v-icon>mdi-exit-to-app</v-icon>
                    </v-btn>
                  </template>
                  <span>Cerrar sesión</span>
                </v-tooltip>
              </v-list-item>
              <v-list-item>
                <p class="text--secondary text-caption">
                  Version API: {{ this.$config.API_VERSION }}
                </p>
              </v-list-item>
            </v-list>
          </v-menu>
        </v-list-item>
        <v-list-item
          v-for="(item, i) in menu"
          :key="i"
          :to="`${item.url}${$route.query.city ? `?company=${$route.query.company}&city=${$route.query.city}&clienttype=${$route.query.clienttype}&referer=layout` : '?referer=layout'}`"
          exact
        >
          <v-list-item-action>
            <v-icon>{{ item.icon }}</v-icon>
            <span v-if="item.alert && $route.name !== 'chatdesk'" class="dot" />
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title v-text="item.name" />
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-app-bar
      app
      dense
      style="background-color:#373737;"
      :class="this.$vuetify.theme.dark ? 'elevation-2 no-printme' : 'white elevation-2 no-printme'"
      elevation="0"
    >
      <v-app-bar-nav-icon v-if="!$store.state.isDesktop" @click.stop="drawer = !drawer" />
      <MainSelectControls />
    </v-app-bar>
    <v-main>
      <v-alert
        v-if="$nuxt.isOffline"
        dense
        type="error"
      >
        Estas sin acceso a internet. Podras ver los datos que tengas en cache.
      </v-alert>
      <nuxt />
    </v-main>
  </v-app>
</template>

<script>
import Cookie from 'js-cookie'
export default {
  middleware: ['authenticated', 'defaultCity'],
  data () {
    return {
      selectedCity: null,
      selectedClienttype: null,
      selectedCompany: null,
      light: null,
      hasPendingChanges: false,
      drawer: false,
      title: 'Nicom Integrado',
      rounded: false,
      connectionType: null,
      connectionTypeColor: 'grey'
    }
  },
  computed: {
    preferredCity () {
      return this.$store.state.auth.preferredcity ? this.$store.state.auth.preferredcity : null
    },
    preferredClienttype () {
      return this.$store.state.auth.preferredclienttype ? this.$store.state.auth.preferredclienttype : null
    },
    preferredCompany () {
      return this.$store.state.auth.preferredcompany ? this.$store.state.auth.preferredcompany : null
    },
    role () {
      return this.$store.state.auth.role.name
    },
    setCityTitle () {
      return this.currentCity ? `${this.$route.name.toUpperCase()} ${this.currentCity.name}` : this.title
    },
    menu () {
      return this.$store.state.menu.menu
    }
  },
  destroyed () {
    window.removeEventListener('resize', this.isDesktopScreen)
  },
  mounted () {
    window.addEventListener('resize', this.isDesktopScreen)
    this.testAuthToken()
    this.getLocalStorage()
    this.loadThemeFromVuetifyThemeManager()
    this.isDesktopScreen()
    this.getMenu()
    setInterval(() => {
      this.getMenu()
    }, 1000 * 60)
  },
  methods: {
    async getMenu () {
      await this.$store.dispatch('menu/getMenuFromDatabase', {
        token: this.$store.state.auth.token,
        userId: this.$store.state.auth.id
      })
    },
    testAuthToken () {
      if (this.$store.state.auth.token) {
        this.$store.dispatch('authActions/checkToken', {
          token: this.$store.state.auth.token
        }).then((res) => {
          if (res.status !== 200) {
            this.logout(true)
          }
        })
      }
    },
    async getLocalStorage () {
      await this.$store.dispatch('loadLocalStorage')
    },
    loadThemeFromVuetifyThemeManager () {
      const currentTheme = localStorage.getItem('currentTheme')
      if (currentTheme) {
        if (currentTheme === 'dark') {
          this.light = false
          this.$vuetify.theme.dark = true
        } else {
          this.light = true
          this.$vuetify.theme.dark = false
        }
      } else {
        localStorage.setItem('currentTheme', 'dark')
      }
    },
    changeTheme () {
      this.$vuetify.theme.dark = !this.$vuetify.theme.dark
      if (this.$vuetify.theme.dark) {
        localStorage.setItem('currentTheme', 'dark')
      } else {
        localStorage.setItem('currentTheme', 'light')
      }
    },
    async restoreReset () {
      await this.$strapi.update('users', this.$store.state.auth.id, {
        resetSession: false
      })
    },
    isDesktopScreen () {
      const width = document.body.clientWidth
      const height = document.body.clientHeight
      if (width < 960) {
        this.isDesktop = false
      } else {
        this.isDesktop = true
      }
      this.$store.commit('isDesktop', this.isDesktop)
      this.$store.commit('clientWidth', width)
      this.$store.commit('clientHeight', height)
    },
    logout (params) {
      Cookie.remove('auth')
      Cookie.remove('token')
      localStorage.clear()
      sessionStorage.clear()
      this.$store.commit('setAuth', null)
      caches.delete(`nn-precache-${this.$config.API_VERSION}`)
      caches.delete(`nn-runtime-cache-${this.$config.API_VERSION}`)
      window.location.href = params ? '/login?sessionExpired=true' : '/login'
    },
    clearCache () {
      caches.delete(`nn-precache-${this.$config.API_VERSION}`)
      caches.delete(`nn-runtime-cache-${this.$config.API_VERSION}`)
    }
  }
}
</script>
<style>
.dot {
  position: absolute;
  height: 5px;
  width: 5px;
  background-color: rgb(212, 19, 19);
  border-radius: 50%;
  display: inline-block;
}
.secondary-city {
    background: #16312d;
    color: #fff;
}
body {
    background-color: grey;
    background-repeat: no-repeat;
    background-position: center 0, 0 0, 0 0;
    background-size: cover;
}
@media print {
  body {
    background-color: #fff;
  }
}
/* width */
::-webkit-scrollbar {
  width: 5px;
}

/* Track */
::-webkit-scrollbar-track {
  box-shadow: inset 0 0 5px rgb(45, 45, 45);
  border-radius: 10px;
  padding:1px;
}

/* Handle */
::-webkit-scrollbar-thumb {
  background: rgb(92, 92, 92);
  border-radius: 10px;
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: rgb(41, 41, 41)
}
@media print {
  .no-printme {
    display: none !important;
  }
  .printme {
    display: block;
  }
}

.v-btn:before {
    background-color: transparent !important;
}
</style>
