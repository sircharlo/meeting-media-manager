const lang = document.querySelector('html').getAttribute('lang')

// Toggle element active state
function toggle(el, force = undefined) {
  if (el) {
    return el.classList.toggle('active', force)
  }
}

// Collapsable articles
const articles = document.querySelectorAll('article')
articles.forEach((article) => {
  const header = article.querySelector('a')
  const body = article.querySelector('.body')
  header.onclick = (e) => {
    const active = toggle(body)
    if (!active) {
      e.preventDefault()
    }
  }
  toggle(body, false)
})

// Expand article and scroll to it on link click
const links = document.querySelectorAll('#sidebar a')
links.forEach((link) => {
  const id = link
    .getAttribute('href')
    .substring(link.getAttribute('href').indexOf('#') + 1)
  const header = document.getElementById(id)
  const article = header.closest('article')

  header.setAttribute('target', '_self')

  link.onclick = () => {
    if (article) {
      const body = article.querySelector('.body')
      toggle(body, true)
    }

    setTimeout(() => {
      if (article) {
        article.scrollIntoView({
          behavior: 'smooth',
        })
      } else {
        header.scrollIntoView({
          behavior: 'smooth',
        })
      }
    }, 500)
  }

  const otherLinks = document.querySelectorAll(`.body a[href="${lang}/#${id}"]`)
  otherLinks.forEach((otherLink) => {
    otherLink.setAttribute('target', '_self')
    otherLink.onclick = () => {
      link.click()
    }
  })
})

// show/hide all articles
const show = document.querySelector('button.control.show')
const hide = document.querySelector('button.control.hide')
show.onclick = () => {
  articles.forEach((article) => {
    const body = article.querySelector('.body')
    toggle(body, true)
  })
}

hide.onclick = () => {
  articles.forEach((article) => {
    const body = article.querySelector('.body')
    toggle(body, false)
  })
}

// On page load go to the article that is in the URL
window.onload = () => {
  const id = window.location.hash.substring(1)
  if (id) {
    const lang = window.location.pathname.substring(
      window.location.pathname.indexOf('/', 1) + 1
    )
    const link = document.querySelector(`#sidebar a[href="${lang}#${id}"]`)
    link.click()
  }
}
