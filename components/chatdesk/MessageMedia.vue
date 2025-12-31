<template>
  <div>
    <span class="px-2 mb-3 mr-8">
      <v-img
        :src="imgBlob"
        max-width="350px"
        height="auto"
        contain
        @click="imageZoom = true"
      />
    </span>
    <span class="text-caption" style="right:10px;bottom:0;position:absolute;">
      {{
        getDateFromUnixTime(payload.entry[0].changes[0].value.messages[0].timestamp)
      }}
    </span>
    <v-dialog
      v-model="imageZoom"
      width="auto"
    >
      <v-img
        :src="imgBlob"
        height="auto"
        contain
      />
    </v-dialog>
  </div>
</template>
<script>
export default {
  name: 'ChatdeskMessageText',
  props: {
    payload: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      meta: {
        api_version: '',
        phone_id: '',
        wba_id: '',
        token: '',
        phone: ''
      },
      imgBlob: null,
      imageZoom: false
    }
  },
  mounted () {
    this.getMediaById()
    setTimeout(() => {
      this.getMetaInfoFromCompany()
    }, 200)
  },
  methods: {
    async getMediaById () {
      const mediaInDatabase = await this.$store.dispatch('whatsapp/getMediaById', {
        id: this.payload.entry[0].changes[0].value.messages[0].image.id,
        token: this.$store.state.auth.token
      })
      if (mediaInDatabase.length > 0) {
        this.imgBlob = `${this.$config.CDN_STRAPI_ENDPOINT}${mediaInDatabase[0].url}`
      } else {
        const media = await this.$store.dispatch('whatsapp/getImgByMediaId', {
          id: this.payload.entry[0].changes[0].value.messages[0].image.id,
          token: this.$store.state.auth.token,
          meta_api_version: this.payload.meta.api_version,
          meta_token: this.payload.meta.api_token
        })
        const form = new FormData()
        form.append('files', await media.blob(), `${this.payload.entry[0].changes[0].value.messages[0].image.id}.${media.type === 'image/jpeg' ? 'jpg' : 'png'}`)
        await fetch(`${this.$config.API_STRAPI_ENDPOINT}upload`, {
          method: 'post',
          headers: {
            Authorization: `Bearer ${this.$store.state.auth.token}`
          },
          body: form
        })
          .then(res => res.json())
          .then((res) => {
            this.createMediaEntry(res[0], this.payload.entry[0].changes[0].value.messages[0].image.id)
            this.imgBlob = `${this.$config.CDN_STRAPI_ENDPOINT}${res[0].url}`
          })
      }
    },
    createMediaEntry (img = { url: 'upload/default.jpg' }, mediaid = 'default') {
      this.$store.dispatch('whatsapp/createMediaEntry', {
        mediaid,
        img,
        token: this.$store.state.auth.token
      })
    },
    getDateFromUnixTime (unixTime) {
      const date = new Date(unixTime * 1000)
      return `${date.getHours()}:${date.getMinutes()} - ${date.getDate()}/${date.getMonth()}/${date.getFullYear()}`
    },
    getMetaInfoFromCompany () {
      const company = this.$store.state.company.currentCompany
      if (!company.token) {
        this.meta.valid = false
        return
      }
      this.meta.api_version = company.meta_api_version
      this.meta.phone_id = company.meta_phone_id
      this.meta.wba_id = company.meta_WBA_id
      this.meta.token = company.meta_token
      this.meta.phone = company.meta_phone
    }
  }
}
</script>
