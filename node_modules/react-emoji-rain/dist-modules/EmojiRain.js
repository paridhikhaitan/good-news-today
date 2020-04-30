'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _emoji = require('./emoji');

var _emoji2 = _interopRequireDefault(_emoji);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var styles = {
  container: {
    position: 'fixed',
    zIndex: -1,
    fontSize: 0,
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden'
  },
  canvas: {
    background: 'transparent'
  }
};

var EmojiRain = function (_Component) {
  _inherits(EmojiRain, _Component);

  function EmojiRain() {
    _classCallCheck(this, EmojiRain);

    var _this = _possibleConstructorReturn(this, (EmojiRain.__proto__ || Object.getPrototypeOf(EmojiRain)).call(this));

    _this.dropsForDrawing = [];
    _this.__emoji = _emoji2.default;
    _this.__totalEmoji = _this.__emoji.length;
    return _this;
  }

  _createClass(EmojiRain, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      var canvas = this.refs.canvas;
      var _props = this.props,
          _props$drops = _props.drops,
          drops = _props$drops === undefined ? 250 : _props$drops,
          _props$active = _props.active,
          active = _props$active === undefined ? true : _props$active;


      this.canvas = canvas;
      this.drops = drops;
      this.active = active;
      var context = this.canvas.getContext('2d');
      this.context.fillStyle = 'black';

      window.addEventListener('resize', this.__resizeCanvas.bind(this));
      this.__resizeCanvas();
      this.__generateDrops();

      if (active) {
        this.__start();
      }
    }
  }, {
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(_ref) {
      var _ref$active = _ref.active,
          active = _ref$active === undefined ? this.active : _ref$active;

      this.active = active;
      if (this.active) {
        this.__start();
      } else {
        this.__stop();
      }
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      window.removeEventListener('resize', this.__resizeCanvas.bind(this));
    }
  }, {
    key: '__resizeCanvas',
    value: function __resizeCanvas() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
  }, {
    key: '__stop',
    value: function __stop() {
      var context = this.canvas.getContext('2d');
      this.active = false;
      clearTimeout(this.timeout);
      window.cancelAnimationFrame(this.animationFrame);
      context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }, {
    key: '__start',
    value: function __start() {
      this.active = true;
      this.__animate();
    }
  }, {
    key: '__animate',
    value: function __animate() {
      var _this2 = this;

      this.timeout = setTimeout(function () {
        var context = _this2.canvas.getContext('2d');
        _this2.animationFrame = window.requestAnimationFrame(_this2.__animate.bind(_this2));
        context.clearRect(0, 0, _this2.canvas.width, _this2.canvas.height);

        for (var i = 0; i < _this2.dropsForDrawing.length; i++) {
          _this2.__paintEmoji(_this2.dropsForDrawing[i]);
        }
      }, 1000 / 60);
    }
  }, {
    key: '__paintEmoji',
    value: function __paintEmoji(opts) {
      var context = this.canvas.getContext('2d');
      var emoji = opts;
      if (emoji.y >= this.canvas.height || emoji.opacity < 0.1) {
        var i = emoji.arrayIndex;
        emoji = this.giveMeARandomEmoji();
        emoji.arrayIndex = i;
        this.dropsForDrawing[i] = emoji;
      } else {
        emoji.y += emoji.speed;
        emoji.opacity -= emoji.opacitySpeed;
      }

      context.globalAlpha = emoji.opacity;

      var isEven = emoji.arrayIndex % 2;
      if (this.useTwemoji && emoji.img && emoji.img !== '') {
        var size = isEven ? 20 : 30;
        context.drawImage(emoji.img, emoji.x, emoji.y, size, size);
      } else {
        context.font = isEven ? '20px serif' : '30px serif';
        context.fillText(emoji.char, emoji.x, emoji.y);
      }

      context.restore();
    }
  }, {
    key: '__generateDrops',
    value: function __generateDrops() {
      this.dropsForDrawing = [];
      for (var i = 0; i < this.drops; i++) {
        var emoji = this.giveMeARandomEmoji();
        emoji.arrayIndex = i;
        this.dropsForDrawing.push(emoji);
      }
    }

    /**
     * I don't understand how to save unicode in an array and use it in a
     * canvas, and I quickly gave up trying. This is lifted from https://github.com/twitter/twemoji
     * and returns the emoji for a codepoint.
     */

  }, {
    key: '__fromCodePoint',
    value: function __fromCodePoint(codepoint) {
      var code = typeof codepoint === 'string' ? parseInt(codepoint, 16) : codepoint;
      if (code < 0x10000) {
        return String.fromCharCode(code);
      }
      code -= 0x10000;
      return String.fromCharCode(0xD800 + (code >> 10), 0xDC00 + (code & 0x3FF));
    }

    /**
     * Gets you an obscure ready-to-be-used emoji object with a whole bunch of
     * undocumented properties because your faithful author was too lazy
     * to create a separate class for this. Leaving it public just in case
     * you want to use this (why do you?) <3
     */

  }, {
    key: 'giveMeARandomEmoji',
    value: function giveMeARandomEmoji() {
      var emoji = {};

      emoji.code = this.__emoji[Math.floor(Math.random() * this.__totalEmoji)];
      emoji.char = this.__fromCodePoint(emoji.code);

      // 1 to window size
      emoji.x = Math.floor(Math.random() * this.canvas.width + 1);
      emoji.y = Math.floor(Math.random() * this.canvas.height + 1);

      // I am pulling these numbers out of a hat.
      emoji.speed = Math.floor(Math.random() * 10 + 1);
      emoji.opacity = 1;
      emoji.opacitySpeed = 0.02 * (Math.random() * 2 + 1);

      return emoji;
    }
  }, {
    key: 'render',
    value: function render() {
      return _react2.default.createElement(
        'div',
        { style: styles.container },
        _react2.default.createElement('canvas', { ref: 'canvas', style: styles.canvas, className: 'js-canvas' })
      );
    }
  }]);

  return EmojiRain;
}(_react.Component);

EmojiRain.propTypes = {
  drops: _react.PropTypes.number,
  active: _react.PropTypes.bool
};

exports.default = EmojiRain;