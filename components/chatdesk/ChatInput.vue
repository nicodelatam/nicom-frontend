<template>
  <div class="parent-chat-input">
    <v-text-field
      v-model="operatorTextInput"
      label="Aa"
      filled
      rounded
      dense
      hide-details="auto"
      @keyup.enter="sendMessage"
    />
  </div>
</template>
<style scoped>
  .parent-chat-input {
    display: grid;
    grid-auto-rows: 1fr;
    grid-gap: 10px;
    width:100%;
  }
</style>
<script>
export default {
  name: 'ChatdeskInput',
  data () {
    return {
      operatorTextInput: '',
      messageText: {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: 'PHONE_NUMBER',
        type: 'text',
        text: { // the text object
          preview_url: false,
          body: 'MESSAGE_CONTENT'
        }
      },
      messageTemplate: {
        messaging_product: 'whatsapp',
        to: '573024493001',
        type: 'template',
        template: {
          name: 'internet_account_dynamic',
          language: {
            code: 'es'
          },
          components: [
            {
              type: 'body',
              parameters: [
                {
                  text: '15 de octubre',
                  type: 'text'
                }
              ]
            },
            {
              type: 'button',
              index: '0',
              sub_type: 'url',
              parameters: [
                {
                  text: '1110601254',
                  type: 'text'
                }
              ]
            }
          ]
        }
      }
    }
  },
  computed: {
    currentContact () {
      return this.$store.state.whatsapp.whatsappContacts.find(c => c.phone === this.$route.query.phone)
    },
    currentCompany () {
      return this.$store.state.company.currentCompany
    }
  },
  methods: {
    sendMessage () {
      this.sendWhatsappMessage()
      this.createMenssageOnDatabase()
      this.operatorTextInput = ''
      this.$store.dispatch('whatsapp/getWhatsappMessages', {
        phone: this.$route.query.phone,
        city: this.$route.query.city,
        token: this.$store.state.auth.token
      })
    },
    async createMenssageOnDatabase () {
      const messageText = {
        type: 'text',
        entry: [
          {
            id: '111317255027818',
            changes: [
              {
                field: 'messages',
                value: {
                  contacts: [
                    {
                      wa_id: '1',
                      profile: {
                        name: 'Nicom'
                      }
                    }
                  ],
                  messages: [
                    {
                      to: this.$route.query.phone,
                      text: {
                        body: this.operatorTextInput
                      },
                      type: 'text',
                      timestamp: '1665783062'
                    }
                  ],
                  metadata: {
                    phone_number_id: this.meta.phone_id,
                    display_phone_number: `57${this.meta.phone}`
                  },
                  messaging_product: 'whatsapp'
                }
              }
            ]
          }
        ],
        object: 'whatsapp_business_account'
      }
      const message = await this.$store.dispatch('whatsapp/createMessage', {
        token: this.$store.state.auth.token,
        to: this.$route.query.phone,
        phone: this.$route.query.phone,
        payload: messageText
      })
      this.$store.dispatch('whatsapp/updateLastmessage', {
        token: this.$store.state.auth.token,
        id: this.currentContact.id,
        lastWhatsapp: message.data
      })
    },
    sendWhatsappMessage () {
      if (this.currentCompany.meta_token === null || this.currentCompany.meta_token === undefined) {
        this.loading = false
        this.$toast.error('Error de configuracion. Reportar al webmaster. CODE:COMP_META_INFO_ERROR')
        return
      }
      let metaServicesInfo = null
      metaServicesInfo = {
        meta_token: this.currentCompany.meta_token,
        meta_template: this.currentCompany.meta_template,
        meta_ticket_template: this.currentCompany.meta_ticket_template,
        meta_endpoint: this.currentCompany.meta_endpoint,
        meta_WBA_id: this.currentCompany.meta_WBA_id,
        meta_api_version: this.currentCompany.meta_api_version,
        meta_phone_id: this.currentCompany.meta_phone_id
      }
      const url = `${metaServicesInfo.meta_endpoint}/${metaServicesInfo.meta_api_version}/${metaServicesInfo.meta_phone_id}/messages`

      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${metaServicesInfo.meta_token}`
        },
        body: JSON.stringify(
          {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: this.$route.query.phone,
            type: 'text',
            text: { // the text object
              preview_url: false,
              body: this.operatorTextInput
            }
          }
        )
      })
        .then(res => res.json())
        .then((res) => {
          console.log(res)
          if (res.error) {
            this.$toast.error(res.error.message)
          }
        })
    },
    getMetaInfoFromCompany () {
      const company = this.$store.state.company.currentCompany
      if (company.token) {
        this.meta.valid = true
        this.meta.api_version = company.meta_api_version
        this.meta.phone_id = company.meta_phone_id
        this.meta.wba_id = company.meta_WBA_id
        this.meta.token = company.meta_token
        this.meta.phone = company.meta_phone
      }
    },
    getDateFromUnixTime (unixTime) {
      const date = new Date(unixTime * 1000)
      return `${date.getHours()}:${date.getMinutes()}`
    }
  }
}
</script>
