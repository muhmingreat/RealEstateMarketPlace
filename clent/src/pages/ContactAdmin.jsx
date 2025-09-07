import React from "react";
import { Phone, MessageCircle } from "lucide-react";
import ChatPage from "./Chatpage";

export default function ContactAdmin() {
  const adminPhone = "+2348140806540"; // Replace with real admin phone number
  const adminEmail = "ayatullahmuhmin3@gmail.com"; // Optional fallback email
  const whatsappLink = `https://wa.me/${adminPhone.replace("+", "")}`;
  const telLink = `tel:${adminPhone}`;

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Need Help? Contact Admin
      </h2>
      <p className="text-gray-600 mb-6 text-center">
        You can call or chat directly with our admin for quick support.
      </p>

      <div className="flex gap-6">
        {/* Call Button */}
        <a
          href={telLink}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition"
        >
          <Phone className="w-5 h-5" />
          <span>Call Admin</span>
        </a>

        {/* Chat Button */}
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md transition"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Chat on WhatsApp</span>
        </a>
      </div>

      {/* Optional fallback */}
      <p className="text-gray-500 mt-6 text-sm">
        Or send an email to{" "}
       <a
  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${adminEmail}`}
  target="_blank"
  rel="noopener noreferrer"
  className="text-blue-600 underline hover:text-blue-800"
>
  {adminEmail}
</a>
      </p>
     
    </div>
  );
}
