<template>
  <div class="d-grid">
    <v-chip small color="white black--text" class="mr-1 mt-1">
      <v-icon left>
        mdi-account
      </v-icon>
      <span class="text-subtitle-2">
        <span v-if="isDesktop">Totales:</span> {{ pagination.total ? pagination.total : '' }}
      </span>
    </v-chip>
    <v-chip small color="green darken-4" class="mr-1 mt-1">
      <v-icon left>
        mdi-checkbox-marked-circle
      </v-icon>
      <span class="text-subtitle-2">
        <span v-if="isDesktop">Activos:</span> {{ activeservices }}
      </span>
    </v-chip>
    <v-chip small color="red darken-4" class="mr-1 mt-1">
      <v-icon left>
        mdi-cancel
      </v-icon>
      <span class="text-subtitle-2">
        <span v-if="isDesktop">En Mora:</span> {{ inactiveservices }}
      </span>
    </v-chip>
    <v-chip small color="gray darken-3" class="mr-1 mt-1">
      <v-icon left>
        mdi-close-circle
      </v-icon>
      <span class="text-subtitle-2">
        <span v-if="isDesktop">Retirados:</span> {{ retiredservices }}
      </span>
    </v-chip>
    <v-chip small color="blue lighten-1" class="mt-1">
      <v-icon left>
        mdi-plus
      </v-icon>
      <span class="text-subtitle-2">
        <span v-if="isDesktop">Cortesias:</span> {{ freeservices }}
      </span>
    </v-chip>
  </div>
</template>

<script>
export default {
  name: 'ListCount',
  props: {
    pagination: {
      type: Object,
      required: true
    },
    filterMonth: {
      type: Boolean,
      required: false
    },
    activeservices: {
      type: Number,
      required: true
    },
    inactiveservices: {
      type: Number,
      required: true
    },
    retiredservices: {
      type: Number,
      required: true
    },
    freeservices: {
      type: Number,
      required: true
    }
  },
  computed: {
    isDesktop () {
      return this.$store.state.isDesktop
    }
  }
}

</script>
