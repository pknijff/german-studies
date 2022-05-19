const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const urlName = urlParams.get('name')

const anchors = document.body.querySelectorAll('a')
anchors.forEach((anchor) => {
  const href = anchor.getAttribute('href')
  if (href.includes('xxxxx')) {
    anchor.setAttribute('href', href.replace('xxxxx', urlName))
  }
})
