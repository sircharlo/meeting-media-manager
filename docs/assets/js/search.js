const search = document.getElementById('search')
const categories = document.querySelectorAll('#sidebar > ul > li')

// Remove all old highlights
function clearHighlights() {
  document.querySelectorAll('span.highlight').forEach((el) => {
    const parent = el.parentNode
    if (parent) {
      parent.replaceChild(document.createTextNode(el.textContent), el)
      parent.textContent = parent.textContent.replaceAll('\\n', '')
    }
  })
}

function showLinks() {
  categories.forEach((category) => {
    category.style.display = 'list-item'
    const links = category.querySelectorAll('ul > li')
    links.forEach((link) => {
      link.style.display = 'list-item'
    })
  })
}

search.onkeyup = () => {
  clearHighlights()
  if (search.value.length < 3) {
    showLinks()
    return
  }

  const regex = new RegExp(
    '[^<"\';`/=](\\b' + search.value + '\\b)[^>/;`"\'=]',
    'gim'
  )

  categories.forEach((category) => {
    const links = category.querySelectorAll('ul > li')

    links.forEach((link) => {
      const id = link.querySelector('a').getAttribute('href').substring(1)
      const header = document.getElementById(id)
      const article = header.closest('article')
      const body = article.querySelector('.body')

      // Search in the article content for the search value
      const result = [...body.querySelectorAll('*').values()].filter((el) => {
        if (!el.childNodes[0]) return false
        return regex.test(el.childNodes[0].nodeValue)
      })
      console.log(result)

      // Hide the menu item if no results found in its article
      link.style.display = result.length > 0 ? 'list-item' : 'none'

      // Highlight the results
      result.forEach((el) => {
        console.log(el)
        if (!el.childNodes[0]) return
        el.childNodes.forEach((node) => {
          if (!node.nodeName === '#text') return
          console.log(node.nodeValue)
          let match = null
          while ((match = regex.exec(node.nodeValue)) !== null) {
            const m = match[0]
            el.innerHTML = el.innerHTML.replaceAll(
              m,
              `${m[0]}<span class="highlight">${m.substring(
                1,
                m.length - 1
              )}</span>${m[m.length - 1]}`
            )
          }
        })
      })
    })

    // Hide menu category if there are no results for its children
    const activeLinks = [...links.values()].filter((el) => {
      return el.style.display === 'list-item'
    })
    category.style.display = activeLinks.length > 0 ? 'list-item' : 'none'
  })
}
