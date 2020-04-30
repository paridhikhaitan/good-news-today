✨ react-emoji-rain ✨
=====================

If you ever wanted to use [notwaldorf/emoji-rain](https://github.com/notwaldorf/emoji-rain) Polymer element in your React apps this is for you! All of the important code is lifted from that project! 🙈

☔️ The number of drops is configurable (by default it's set to 250). The active attribute determines whether the emoji are raining.

Example:

```javascript
<EmojiRain active={true} drops={100} />
```

## Setup

Install the package by running `npm install --save react-emoji-rain` or `yarn add react-emoji-rain`.

Then you can include it in your React project:

```javascript
import React, {Component} from 'react';
import {render} from 'react-dom';

class App extends Component {
  render() {
    return (
      <EmojiRain active={true} drops={100} />
    );
  }
}

render(
  <App />,
  document.querySelector('.js-example')
);
```

Just take care to stretch your container to fill up your document. If you need help doing this take a look at the `example/` folder.

## ✨☔️😹
