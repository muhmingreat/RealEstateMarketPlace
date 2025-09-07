import React, { useState } from "react";

export default function PrivacyPolicy() {
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    if (!accepted) {
      alert("You must accept the Privacy Policy before continuing.");
      return;
    }
    
    window.location.href = "/kyc";
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-gray-800">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

      <div className="space-y-5 text-justify leading-relaxed">
        <p>
          This Privacy Policy explains how our platform collects, uses, and
          protects your personal data when you access or use our services,
          including Know Your Customer KYC verification. By using our
          platform, you agree to the terms outlined in this policy.
        </p>
        <ol>

      <li>
          <h2 className="text-xl font-semibold"> Information We Collect</h2>
      </li>
        </ol>
        <p>
          We may collect personal information, including but not limited to:
        </p>
        <ul className="list-disc pl-6">
          <li>Full legal name, date of birth, and contact details</li>
          <li>Government issued identification documents</li>
          <li>Proof of address e.g utility bill, bank statement</li>
          <li>Wallet address and transaction history associated with this DApp</li>
          <li>Any additional information required for regulatory compliance</li>
        </ul>

        <h2 className="text-xl font-semibold">2. How We Use Your Information</h2>
        <p>Your information will be used solely for the following purposes:</p>
        <ul className="list-disc pl-6">
          <li>Identity verification and fraud prevention</li>
          <li>Compliance with Anti-Money Laundering AML and KYC regulations</li>
          <li>Account authentication and security</li>
          <li>Communication regarding your account or services</li>
        </ul>

        <h2 className="text-xl font-semibold">3. Data Security</h2>
        <p>
          We implement industry-standard encryption and secure storage
          mechanisms to protect your personal data. Access is restricted only to
          authorized personnel. However, no system is 100% secure, and we cannot
          guarantee absolute security of your data.
        </p>

        <h2 className="text-xl font-semibold">4. Data Sharing</h2>
        <p>
          We will not sell, rent, or trade your personal information. Data may
          only be shared in the following cases:
        </p>
        <ul className="list-disc pl-6">
          <li>When required by law, regulation, or legal process</li>
          <li>With regulatory authorities for compliance purposes</li>
          <li>With service providers bound by confidentiality agreements</li>
        </ul>

        <h2 className="text-xl font-semibold">5. User Rights</h2>
        <p>
          You have the right to request access, correction, or deletion of your
          personal data. You may also withdraw consent for data processing,
          subject to regulatory requirements.
        </p>

        <h2 className="text-xl font-semibold">6. Data Retention</h2>
        <p>
          Personal data will be retained only as long as necessary to fulfill
          the purposes outlined above, or as required by applicable law and
          regulations.
        </p>

        <h2 className="text-xl font-semibold"> Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Any material
          changes will be communicated through the platform, and continued use
          of our services will constitute acceptance of the updated terms.
        </p>

        <h2 className="text-xl font-semibold">8. Contact Us</h2>
        <p>
          If you have any questions regarding this Privacy Policy or your data,
          you can contact us at{" "}
          <a
            href="mailto:support@ayatullahmuhmin3.com"
            className="text-blue-600 underline"
          >
            support@RealD.com
          </a>
          .
        </p>
      </div>

      <div className="mt-8 flex items-center space-x-3">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="w-4 h-4"
        />
        <span>I have read and agree to the Privacy Policy</span>
      </div>

      <button
        onClick={handleAccept}
        className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Continue
      </button>
    </div>
  );
}
