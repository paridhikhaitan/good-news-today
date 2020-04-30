import React from "react";
import "./App.css";
import SMSForm from "./SMSForm";
import { Container, Row, Col } from "react-grid-system";
import Particles from "react-particles-js";

class App extends React.Component {
  render() {
    return (
      <div>
        <Particles
          style={{
            height: "100vh",
            width: "100vh",
            zIndex: "-10",
            position: "absolute"
          }}
          params={{
            particles: {
              number: {
                value: 160,
                density: {
                  enable: false
                }
              },
              color: {
                value: ["#ACECD5", "#FFF9AA", "#FFD5B8", "#FFB9B3"]
              },
              size: {
                value: 4.5,
                random: true,
                anim: {
                  speed: 4,
                  size_min: 0.2
                }
              },
              line_linked: {
                enable: false
              },
              move: {
                random: true,
                speed: 1,
                direction: "bottom",
                out_mode: "out"
              }
            }
          }}
        />
        <Container style={{ marginTop: "2rem", marginBottom: "6rem" }}>
          <Row justify="center" align="center">
            <Col md={8} xs={12}>
              <h1>Good News Today!</h1>
            </Col>
          </Row>
          <Row justify="center" align="center">
            <Col md={6} xs={10}>
              <h4>
                We know that everything is chaotic and uncertain around you. And
                we know that all you want is to see some smiling faces and go
                back to life pre-quarantine! <br /> <br />
                Therefore, we wanted to bring back your early morning news paper
                delivery. Just sign up with the form and{" "}
                <b>
                  everyday at 9AM, we'll message you about some good news
                  regarding the Coronavirus near you!{" "}
                </b>
                <br /> <br />
                After all, it was Dumbledore who said that "Happiness can be
                found even in the darkest of times, if only one remembers to
                turn on the light."
              </h4>
            </Col>
            <Col md={6} xs={10}>
              <SMSForm />
            </Col>
          </Row>
        </Container>
        <h4 id="footer">
          Made by <a href="https://www.paridhikhaitan.me/">Paridhi</a> 👽
        </h4>
      </div>
    );
  }
}

export default App;
