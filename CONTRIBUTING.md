# Contributing

You are welcome to contribute to this project. If you want to do so, here you will find some useful information to get you started.

## Help translate this application

If any one of you would like to volunteer to become a M³ language moderator for a language you speak, please [sign into GitLocalize](https://gitlocalize.com/) using your GitHub account, and then let me know by [creating a new discussion](https://github.com/sircharlo/meeting-media-manager/discussions/categories/translations) in the **Translations** category.

As language moderator, you will get notified of changes to the English original strings, have a nice and easy to use interface to review existing as well as untranslated strings in your language, and submit new translations to the repo easily.

## Help maintain this application

In order to help maintain this application, the following information will help you get started. If anything is unclear or you simply need more information, please feel free to make contact through [the discussion thread](https://github.com/sircharlo/meeting-media-manager/discussions).

### Developer Tools

- [Git](https://git-scm.com/) >= v2.34.1
- [Bundler](https://bundler.io/) >= v2.3.5
- [VS Code](https://code.visualstudio.com/) >= v1.70.2
  - VS Code extensions: see [extensions.json](./.vscode/extensions.json)

### Run documentation website locally

The documentation website is hosted on [GitHub Pages](https://pages.github.com/) and generated with [Jekyll](https://jekyllrb.com/docs/installation/). To run the documentation site locally, you can follow the [instructions](https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/testing-your-github-pages-site-locally-with-jekyll) of GitHub Pages. Once you have installed [Bundler](https://bundler.io/), you can run the following commands:

``` bash
# Checkout the docs branch
git checkout docs

# Install dependencies
bundle install

# Serve website with hot reload on localhost:4000
bundle exec jekyll serve
```

The documentation website will automatically be updated when changes are pushed to the docs branch.
