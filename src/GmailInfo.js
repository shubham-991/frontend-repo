import React from "react";
import { Alert, Container } from "react-bootstrap";

function GmailInfo() {
  return (
    <Container className="my-3">
      <Alert variant="info">
        <p>
          Steps to follow before using this application:
          <br />
          1. Make sure you enable IMAP in your Gmail settings. Log on to your
          Gmail account and go to Settings, See All Settings, and select
          Forwarding and POP/IMAP tab. In the "IMAP access" section, select
          Enable IMAP.
          <br />
          2. If you have 2-factor authentication, Gmail requires you to create
          an application-specific password that you need to use. Go to your
          Google account settings and click on 'Security'. Scroll down to App
          Passwords under 2 step verification. Select Mail under Select App. and
          Other under Select Device. (Give a name, e.g., python) The system
          gives you a password that you need to use to authenticate from python.
        </p>
      </Alert>
    </Container>
  );
}

export default GmailInfo;
