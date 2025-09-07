import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function TermsAndConditions() {
  const [agreed, setAgreed] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  // 🔍 detect when user has scrolled to bottom
  const handleScroll = () => {
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 5) {
      setScrolledToBottom(true);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (scrollRef.current) {
        scrollRef.current.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  // const handleContinue = () => {
  //   if (agreed && scrolledToBottom) {
  //     navigate("/kyc");
  //   }
  // };
  const handleContinue = () => {
    if (agreed && scrolledToBottom) {
      localStorage.setItem("termsAgreed", "true");
      navigate("/kyc");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-200 px-4 py-8">
      <div className="bg-white shadow-xl rounded-2xl p-8 max-w-2xl w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 text-center">
          Terms & Conditions
        </h1>

        {/* Scrollable Terms */}
        <div
          ref={scrollRef}
          className="overflow-y-auto max-h-96 text-gray-700 text-sm leading-relaxed space-y-4 mb-6 p-4 border rounded-lg bg-gray-50"
        >
          {/* <div className="space-y-4 text-gray-700 text-sm leading-relaxed"> */}
          <p>
            By submitting your Know Your Customer (KYC) information on this platform,
            you confirm that all personal details and documents provided are accurate,
            complete, and up-to-date to the best of your knowledge.
          </p>

          <p>
            The documents you submit, which may include but are not limited to
            government-issued identification (e.g., passport, driver’s license,
            national ID card) and proof of address (e.g., utility bill, bank statement),
            will be securely encrypted and stored in compliance with applicable
            data-protection and privacy laws.
          </p>

          <p>
            Your information will be used strictly for the purposes of verifying your identity,
            ensuring compliance with anti-money laundering (AML) and counter-terrorist financing (CTF) regulations,
            and protecting the integrity of this platform. It will not be disclosed to
            third parties without your consent, except where required by law, regulation,
            or authorized government authorities.
          </p>

          <p>
            You acknowledge that failure to provide valid, authentic, and truthful information
            may result in delays, the rejection of your verification application,
            restrictions on your account, or suspension/termination of platform access.
          </p>

          <p>
            By proceeding, you authorize this platform and its authorized service providers
            to verify the authenticity of your documents and information through electronic,
            manual, or third-party verification processes as permitted by law.
          </p>

          <p>
            You further acknowledge that KYC verification is an ongoing requirement, and
            you may be asked to re-submit or update your documents periodically to remain
            compliant with regulatory standards.
          </p>

          <p className="font-medium text-gray-900">
            By clicking <span className="font-semibold text-green-500">Continue</span>, you confirm that you have read, understood, and agree
            to these Terms and Conditions regarding the submission and processing of
            your KYC information.
          </p>
          </div>

          <div className="flex items-center mb-6">
            <input
              id="agree"
              type="checkbox"
              disabled={!scrolledToBottom}
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 disabled:opacity-50"
            />
            <label
              htmlFor="agree"
              className="ml-2 block text-sm text-gray-700"
            >
              I have read and agree to the Terms & Conditions
            </label>
          </div>

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            disabled={!agreed || !scrolledToBottom}
           
            className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition 
                    ${agreed && scrolledToBottom
                ? "bg-indigo-600 hover:bg-indigo-700"
                : "bg-gray-400 cursor-not-allowed"}`}

          >
            Continue
          </button>
        </div>
      </div>
      );
}



