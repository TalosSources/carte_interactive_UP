function reportWebVitals (onPerfEntry) {
  if (Boolean(onPerfEntry) && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry)
      getFID(onPerfEntry)
      getFCP(onPerfEntry)
      getLCP(onPerfEntry)
      getTTFB(onPerfEntry)
    })
      .catch(() => { console.log('Something went wrong when importing web-vitals') })
  }
}

export default reportWebVitals
