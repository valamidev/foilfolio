<p align="center">
  <a href="https://alain.xyz">
    <img alt="Foilfolio" src="docs/logo.svg" width="240" />
  </a>
</p>
<h1 align="center">
  Foilfolio
</h1>

[![License][license-img]][license-url]
[![Dependency Status][david-img]][david-url]
[![devDependency Status][david-dev-img]][david-dev-url]


✨ Build powerful and flexible portfolios and blogs. ✨

Whether you're a writer, artist, musician, engineer, or all of the above, there's finally a tool that offers flexibility like no other:

- 🕹️ **Everything is a JavaScript module**, from blog posts to books, music albums, or even custom mini-applications like games or tools. Use 

- 🌌 **Universal (Serverside and Clientside) rendering** by default, your Foilfolio will work regardless of your user's browser setup.

- 🏙️ **A simple and extendable API** for building truly custom portfolios. Define your own data schemas or use our recommended setups for different portfolio types.

- ⚔️ **State of the Art technologies**, [TypeScript](https://www.typescriptlang.org/), [React](https://reactjs.org/), [Webpack](https://webpack.js.org/), [PostCSS](https://postcss.org/), and more. Write views in React, use 3D renderers like Marmoset Viewer, even render academic files written in Markdown + LaTeX, you'll find it all supported here.

- 🐙 **Git Powered** with a daemon tool to handle continuous deployment from your git repo, let git be your CMS!

## How it Works

### Foil Packages

Foilfolio is built around the idea of using the `package.json` spec and combining that with extra data that's not defined in the specification inside a `foil` object:

```json
{
  "description": "A cross platform system abstraction library written in C++ for managing windows and performing OS tasks.",
  "main": "main.tsx",
  "keywords": [
    "library",
    "libraries",
    "github",
    "cpp"
  ],
  "foil": {
    "title": "CrossWindow",
    "permalink": "libraries/crosswindow",
    "main": "main.tsx",
    "datePublished": "2018-09-16T00:00:00.000Z"
  }
}
```

### File Transformers

Every foilfolio post starts with a package.json who's main file points to a file, be it a JavaScript, TypeScript, Markdown, or a custom file format you want to support.

**Transformer functions** take file formats, and process them accordingly. For example, here's a markdown transformer:

```ts
import markademic from 'markademic';
import { join } from 'path';
import { readFileSync } from 'fs';

export let md = {
  // 💉 a test object that's used to compare with the `package.json` file.
  test: { file: /\.md$/ },

  // 🚒 the function that takes in the foil-ified package data and lets you modify it.
  loader: async foil => {

    var config = {
      input: readFileSync(foil.file).toString(),
      rerouteLinks: (link) => join(foil.permalink, link)
    };

    var data = "";

    try {
      data = markademic(config);
    }
    catch (e) {
      console.error('Markademic', e.message);
    }

    return {
      ...foil,
      data
    }
  }
}
```

## Licencing

All source code is available with an MIT license, feel free to take bits and pieces and use them in your own projects. I would love to hear how you found things useful, feel free to contact me on Twitter <a href="https://twitter.com/Alainxyz">@alainxyz</a>.

[cover-img]: docs/assets/logo.png
[cover-url]: https://alain.xyz/libraries/foilfolio
[license-img]: http://img.shields.io/:license-mit-blue.svg?style=flat-square
[license-url]: https://opensource.org/licenses/MIT
[david-url]: https://david-dm.org/alaingalvan/foilfolio?path=packages/foilfolio
[david-img]: https://david-dm.org/alaingalvan/foilfolio.svg?path=packages/foilfolio&style=flat-square
[david-dev-url]: https://david-dm.org/alaingalvan/foilfolio?path=packages/foilfolio#info=devDependencies
[david-dev-img]: https://david-dm.org/alaingalvan/foilfolio/dev-status.svg?path=packages/foilfolio&style=flat-square
[travis-img]: https://img.shields.io/travis/alaingalvan/foilfolio.svg?style=flat-square
[travis-url]:https://travis-ci.org/alaingalvan/foilfolio
[codecov-img]:https://img.shields.io/codecov/c/github/alaingalvan/foilfolio.svg?style=flat-square
[codecov-url]: https://codecov.io/gh/alaingalvan/foilfolio
[npm-img]: https://img.shields.io/npm/v/foilfolio.svg?style=flat-square
[npm-url]: http://npm.im/foilfolio
[npm-download-img]: https://img.shields.io/npm/dm/foilfolio.svg?style=flat-square
