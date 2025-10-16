import React from "react";

// Partner logos
const partners = [
  {
    id: "landwey",
    name: "Landwey",
    svg: (
      <svg viewBox="0 0 120 80" className="partner-svg" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <rect x="40" y="20" width="16" height="40" fill="#f97316" rx="2" />
        <rect x="60" y="14" width="16" height="46" fill="#fb923c" rx="2" />
        <rect x="20" y="28" width="16" height="32" fill="#fdba74" rx="2" />
      </svg>
    ),
  },
  {
    id: "amenestate",
    name: "Amen Estate",
    svg: (
      <svg viewBox="0 0 120 80" className="partner-svg" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <rect x="20" y="34" width="80" height="28" fill="#16a34a" rx="3" />
        <polygon points="20,34 60,10 100,34" fill="#22c55e" />
        <rect x="46" y="44" width="12" height="10" fill="#bbf7d0" />
        <rect x="62" y="44" width="12" height="10" fill="#bbf7d0" />
      </svg>
    ),
  },
  {
    id: "veritasi",
    name: "Veritasi Homes",
    svg: (
      <svg viewBox="0 0 120 80" className="partner-svg" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <rect x="24" y="24" width="12" height="36" fill="#2563eb" />
        <rect x="40" y="18" width="12" height="42" fill="#3b82f6" />
        <rect x="56" y="10" width="12" height="50" fill="#60a5fa" />
        <rect x="72" y="28" width="12" height="32" fill="#1d4ed8" />
      </svg>
    ),
  },
  {
    id: "primewaterview",
    name: "Primewaterview",
    svg: (
      <svg viewBox="0 0 120 80" className="partner-svg" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <polygon points="20,40 60,16 100,40" fill="#7c3aed" />
        <rect x="30" y="40" width="60" height="24" fill="#a78bfa" />
        <rect x="46" y="48" width="12" height="12" fill="#ede9fe" />
        <path d="M20 68 Q40 72 60 68 T100 68" stroke="#3b82f6" strokeWidth="3" fill="none" />
      </svg>
    ),
  },
  {
    id: "lekkigardens",
    name: "Lekki Gardens",
    svg: (
      <svg viewBox="0 0 120 80" className="partner-svg" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <rect x="18" y="32" width="84" height="30" fill="#eab308" rx="4" />
        <polygon points="18,32 60,12 102,32" fill="#facc15" />
        <circle cx="34" cy="62" r="6" fill="#22c55e" />
        <circle cx="86" cy="62" r="6" fill="#16a34a" />
      </svg>
    ),
  },
  {
    id: "shelterafrique",
    name: "Shelter Afrique",
    svg: (
      <svg viewBox="0 0 120 80" className="partner-svg" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <rect x="10" y="30" width="100" height="30" fill="#dc2626" rx="4" />
        <polygon points="10,30 60,8 110,30" fill="#ef4444" />
        <circle cx="40" cy="52" r="4" fill="#fff" />
        <circle cx="80" cy="52" r="4" fill="#fff" />
      </svg>
    ),
  },
];

// Reusable card
const PartnerCard = ({ partner }) => (
  <div className="flex flex-col items-center mx-6 md:mx-8 lg:mx-12 animate-fade-in hover:scale-110 transition duration-300">
    {partner.svg}
    <div className="mt-2 sm:mt-3 text-xs sm:text-sm md:text-lg font-semibold">
      {partner.name}
    </div>
  </div>
);

export default function OurPartners() {
  return (
    <section
      className="relative min-h-[100vh] flex flex-col justify-center items-center text-center text-white"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1500&q=80')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-[#1B2A49] bg-opacity-70"></div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12 w-full">
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold mb-4 sm:mb-6 drop-shadow-lg">
          Trusted Partners in Real Estate
        </h2>
        <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-8 md:mb-12 text-gray-200 max-w-xl sm:max-w-2xl mx-auto">
          We collaborate with leading Nigerian and African developers to bring
          you secure and modern properties.
        </p>

        {/* Marquee for all screens */}
        <div className="overflow-hidden w-full">
          <div className="flex animate-marquee whitespace-nowrap">
            {partners.concat(partners).map((p, i) => (
              <PartnerCard key={`${p.id}-${i}`} partner={p} />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
        .partner-svg {
          width: 3.5rem;
          height: 3.5rem;
        }
        @media (min-width: 640px) {
          .partner-svg { width: 4rem; height: 4rem; }
        }
        @media (min-width: 768px) {
          .partner-svg { width: 5rem; height: 5rem; }
        }
        @media (min-width: 1024px) {
          .partner-svg { width: 6rem; height: 6rem; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fadeIn 1s ease-in-out;
        }
      `}</style>
    </section>
  );
}

