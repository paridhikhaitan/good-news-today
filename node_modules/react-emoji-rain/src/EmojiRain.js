import React, {Component, PropTypes} from 'react';

import emojis from './emoji';

const styles = {
  container: {
    position: 'fixed',
    zIndex: -1,
    fontSize: 0,
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  canvas: {
    background: 'transparent',
  },
};

class EmojiRain extends Component {
  constructor() {
    super();
    this.dropsForDrawing = [];
    this.__emoji = emojis;
    this.__totalEmoji = this.__emoji.length;
  }

  componentDidMount() {
    const {canvas} = this.refs;
    const {drops = 250, active = true} = this.props;

    this.canvas = canvas;
    this.drops = drops;
    this.active = active;
    const context = this.canvas.getContext('2d');
    this.context.fillStyle = 'black';

    window.addEventListener('resize', this.__resizeCanvas.bind(this));
    this.__resizeCanvas();
    this.__generateDrops();

    if (active) {
      this.__start();
    }
  }

  componentWillReceiveProps({active = this.active}) {
    this.active = active;
    if (this.active) {
      this.__start();
    } else {
      this.__stop();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.__resizeCanvas.bind(this));
  }

  __resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  __stop() {
    const context = this.canvas.getContext('2d');
    this.active = false;
    clearTimeout(this.timeout);
    window.cancelAnimationFrame(this.animationFrame);
    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  __start() {
    this.active = true;
    this.__animate();
  }

  __animate() {
    this.timeout = setTimeout(() => {
      const context = this.canvas.getContext('2d');
      this.animationFrame = window.requestAnimationFrame(this.__animate.bind(this));
      context.clearRect(0, 0, this.canvas.width, this.canvas.height);

      for (let i = 0; i < this.dropsForDrawing.length; i++) {
        this.__paintEmoji(this.dropsForDrawing[i]);
      }
    }, 1000 / 60);
  }

  __paintEmoji(opts) {
    const context = this.canvas.getContext('2d');
    let emoji = opts;
    if (emoji.y >= this.canvas.height || emoji.opacity < 0.1) {
      const i = emoji.arrayIndex;
      emoji = this.giveMeARandomEmoji();
      emoji.arrayIndex = i;
      this.dropsForDrawing[i] = emoji;
    } else {
      emoji.y += emoji.speed;
      emoji.opacity -= emoji.opacitySpeed;
    }

    context.globalAlpha = emoji.opacity;

    const isEven = emoji.arrayIndex % 2;
    if (this.useTwemoji && emoji.img && emoji.img !== '') {
      const size = isEven ? 20 : 30;
      context.drawImage(emoji.img, emoji.x, emoji.y, size, size);
    } else {
      context.font = isEven ? '20px serif' : '30px serif';
      context.fillText(emoji.char, emoji.x, emoji.y);
    }

    context.restore();
  }

  __generateDrops() {
    this.dropsForDrawing = [];
    for (let i = 0; i < this.drops; i++) {
      const emoji = this.giveMeARandomEmoji();
      emoji.arrayIndex = i;
      this.dropsForDrawing.push(emoji);
    }
  }

  /**
   * I don't understand how to save unicode in an array and use it in a
   * canvas, and I quickly gave up trying. This is lifted from https://github.com/twitter/twemoji
   * and returns the emoji for a codepoint.
   */
  __fromCodePoint(codepoint) {
    let code = typeof codepoint === 'string' ?
          parseInt(codepoint, 16) : codepoint;
    if (code < 0x10000) {
      return String.fromCharCode(code);
    }
    code -= 0x10000;
    return String.fromCharCode(
      0xD800 + (code >> 10),
      0xDC00 + (code & 0x3FF)
    );
  }

  /**
   * Gets you an obscure ready-to-be-used emoji object with a whole bunch of
   * undocumented properties because your faithful author was too lazy
   * to create a separate class for this. Leaving it public just in case
   * you want to use this (why do you?) <3
   */
  giveMeARandomEmoji() {
    const emoji = {};

    emoji.code = this.__emoji[Math.floor((Math.random() * this.__totalEmoji))];
    emoji.char = this.__fromCodePoint(emoji.code);

    // 1 to window size
    emoji.x = Math.floor((Math.random() * this.canvas.width) + 1);
    emoji.y = Math.floor((Math.random() * this.canvas.height) + 1);

    // I am pulling these numbers out of a hat.
    emoji.speed = Math.floor(Math.random() * 10 + 1);
    emoji.opacity = 1;
    emoji.opacitySpeed = 0.02 * (Math.random() * 2 + 1);

    return emoji;
  }

  render() {
    return (
      <div style={styles.container}>
        <canvas ref="canvas" style={styles.canvas} className="js-canvas" />
      </div>
    );
  }
}

EmojiRain.propTypes = {
  drops: PropTypes.number,
  active: PropTypes.bool,
};

export default EmojiRain;
