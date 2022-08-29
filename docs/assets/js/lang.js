const language = document.getElementById('select-lang')
language.onchange = (e) => {
  const lang = e.target.value
  if (!window.location.pathname.endsWith(`/${lang}/${window.location.hash}`)) {
    window.location.href = `${lang}/${window.location.hash}`
  }
}
