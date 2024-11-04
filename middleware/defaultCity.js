export default function ({ route, redirect, store }) {
  const { query, path } = route
  const auth = store.state.auth
  const userHasPreferredCompany = auth && auth.preferredcompany
  const userHasPreferredCity = auth && auth.preferredcity
  const userHasPreferredClienttype = auth && auth.preferredclienttype

  let userPreferredCity = null
  let userPreferredClienttype = null
  let userPreferredCompany = null

  if (userHasPreferredCompany) {
    userPreferredCompany = auth.preferredcompany.name
  }

  if (userHasPreferredClienttype) {
    userPreferredClienttype = auth.preferredclienttype.name
  }
  if (userHasPreferredCity) {
    userPreferredCity = auth.preferredcity.name
  }
  const newQuery = {
    company: query.company ? query.company : (userPreferredCompany || 'none'),
    city: query.city ? query.city : (userPreferredCity || 'MARIQUITA'),
    clienttype: query.clienttype ? query.clienttype : (userPreferredClienttype || 'INTERNET'),
    service: query.service
  }

  if (!query.company || !query.clienttype || !query.city) {
    redirect({ path, query: newQuery })
  }
}
