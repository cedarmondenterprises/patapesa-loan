import InfoPage from '../components/InfoPage';
export default function Privacy() {
  return (
    <InfoPage title="Privacy notice">
      <p>
        PataPesa collects the identity, contact, residence, employment, education, income-range and
        household information you provide to create and operate your account, assess eligibility and
        affordability, prevent fraud, support customers and meet record-keeping obligations.
      </p>
      <h2>Registration record</h2>
      <p>
        When you submit registration, we keep a versioned record of your answers, declarations,
        submission time, device browser information and network address. Authorised staff can view
        and export that record for review and audit purposes. Registration is separate from formal
        identity verification and does not itself approve a loan.
      </p>
      <h2>Data protection</h2>
      <p>
        Access is limited to authorised processes and personnel. Passwords are stored as one-way
        hashes and authenticated API access uses expiring tokens. We limit collection to information
        connected with the stated purposes and retain it only as long as those purposes or
        applicable legal duties require.
      </p>
      <h2>Your choices</h2>
      <p>
        Marketing is optional and separate from account communications. You may contact support to
        withdraw marketing consent or request access, correction, objection or deletion, subject to
        identity verification and applicable record-retention duties.
      </p>
      <h2>Verification and sharing</h2>
      <p>
        Where relevant to a credit application and permitted by law, PataPesa may verify supplied
        information with approved identity, fraud-prevention, payment or credit-reference service
        providers. We do not sell customer contact lists.
      </p>
      <h2>Contact</h2>
      <p>
        Privacy questions can be submitted through the support form and will receive a reference
        number.
      </p>
    </InfoPage>
  );
}
