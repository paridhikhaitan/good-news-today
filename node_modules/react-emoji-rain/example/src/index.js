import React, {Component} from 'react';
import ReactDOM from 'react-dom';

import EmojiRain from '../../dist/index.js';

const styles = {
  container: {
    display: 'flex',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    textDecoration: 'underline',
    cursor: 'pointer',
  },
};

class App extends Component {
  componentWillMount() {
    this.setState({
      active: true,
    });
  }

  changeState() {
    const {active} = this.state;

    this.setState({
      active: !active,
    });
  }

  render() {
    const {active} = this.state;

    return (
      <div style={styles.container}>
        <EmojiRain active={active} drops={100} />
        <h1 style={styles.title} onClick={this.changeState.bind(this)}>Emoji rain! 🌧</h1>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.querySelector('.js-example'));
