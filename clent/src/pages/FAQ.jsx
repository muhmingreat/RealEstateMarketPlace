import React, { useState } from "react";

const faqs = [
  {
    question: "What is KYC verification?",
    answer:
      "KYC (Know Your Customer) verification is a process that confirms your identity using official documents such as a passport, ID card, or driver’s license. This helps protect against fraud and ensures regulatory compliance.",
  },
  {
    question: "Why do I need to complete KYC?",
    answer:
      "Completing KYC allows you to access the full features of our platform, including higher transaction limits, withdrawals, and participation in regulated services.",
  },
  {
    question: "How long does the KYC process take?",
    answer:
      "Most verifications are completed within minutes. In some cases, it may take up to 24 hours if additional manual review is required.",
  },
  {
    question: "Is my personal information secure?",
    answer:
      "Yes. All your information is encrypted and stored securely. We only use your data for verification purposes and never share it with unauthorized parties.",
  },
  {
    question: "What documents are accepted?",
    answer:
      "We accept government-issued IDs such as a passport, national ID card, or driver’s license. You may also be asked to provide proof of address, such as a utility bill or bank statement.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="max-w-3xl mx-auto p-6  ">
      <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className=" rounded-xl shadow-sm bg-white"
          >
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full px-5 py-4 flex justify-between 
              items-center text-lg font-medium text-gray-800 focus:outline-none"
            >
              {faq.question}
              <span className="ml-2 text-green-500 text-xl">
                {openIndex === index ? "-" : "+"}
              </span>
            </button>
            {openIndex === index && (
              <div className="px-5 pb-4 text-gray-600 animate-fadeIn">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
