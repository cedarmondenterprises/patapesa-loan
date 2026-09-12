import InfoPage from '../components/InfoPage';
export default function Privacy() {
  return (
    <InfoPage title="Privacy notice">
      <p>
        PataPesa processes contact, identity, application and repayment information to assess
        applications, operate accounts, prevent fraud and meet legal obligations.
      </p>
      <h2>Data protection</h2>
      <p>
        Access is limited to authorised processes and personnel. Passwords are stored as one-way
        hashes and authenticated API access uses expiring tokens.
      </p>
      <h2>Your choices</h2>
      <p>
        You may contact support to request access or correction of your information, subject to
        identity verification and applicable record-retention duties.
      </p>
      <h2>Contact</h2>
      <p>
        Privacy questions can be submitted through the support form and will receive a reference
        number.
      </p>
    </InfoPage>
  );
}
