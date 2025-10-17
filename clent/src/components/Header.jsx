import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppKitAccount } from "@reown/appkit/react";
import { Link } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";

export default function Header() {
  const { address } = useAppKitAccount();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(null);

  const ADMIN_ADDRESS = import.meta.env.VITE_ADMIN_WALLET_ADDRESS?.toLowerCase();

  const isAdmin = useMemo(
    () => address && ADMIN_ADDRESS && address.toLowerCase() === ADMIN_ADDRESS,
    [address, ADMIN_ADDRESS]
  );

  // ✅ Full nav structure with submenus
  const navItems = [
    {
      label: "Home",
      path: "/",
      sub: [
        { label: "Overview", path: "/" },
        { label: "Contact Us", path: "/contact" },
        { label: "About", path: "/about" },
      ],
    },
    {
      label: "Properties",
      path: "/properties",
      sub: [
        { label: "All Properties", path: "/properties" },
        { label: "Create Property", path: "/create" },
        { label: "My Property", path: "/my-property" },
      ],
    },
    {
      label: "Dashboard",
      path: "/users",
      sub: [
        { label: "User Dashboard", path: "/users" },
        { label: "My Property", path: "/my-property" },
      ],
    },
  ];

  if (isAdmin) {
    navItems.push({
      label: "Admin",
      path: "/admin-dashboard",
      sub: [
        { label: "Admin Dashboard", path: "/admin-dashboard" },
        { label: "KYC Approve", path: "/approve" },
      ],
    });
  }

  const logoBoxAnimation = {
    animate: {
      boxShadow: [
        "0 0 15px rgba(0,200,255,0.7)",
        "0 0 30px rgba(0,255,255,1)",
        "0 0 10px rgba(0,200,255,0.5)",
        "0 0 25px rgba(0,255,255,0.9)",
      ],
    },
    transition: { duration: 0.2, repeat: Infinity, ease: "linear" },
  };

  const dropdownVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
  };

  const logoSVG = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      className="h-8 w-8 text-black"
      fill="currentColor"
    >
      <path d="M2 30 L32 6 L62 30 V58 H38 V40 H26 V58 H2 Z" />
      <rect x="10" y="34" width="8" height="6" fill="white" />
      <rect x="46" y="34" width="8" height="6" fill="white" />
    </svg>
  );

  return (
    <header className="flex justify-between items-center px-6 py-4 bg-[#1B2A49] shadow-md relative">
      {/* Logo */}
      <motion.div className="flex items-center space-x-2">
        <motion.div
          {...logoBoxAnimation}
          className="flex items-center justify-center h-12 w-12 rounded-full 
          shadow-lg bg-gradient-to-br from-blue-400 via-cyan-500 to-indigo-700"
        >
          {logoSVG}
        </motion.div>
        <span className="text-white font-semibold text-lg">RealDeal</span>
      </motion.div>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex space-x-8 items-center">
        {navItems.map((item) => (
          <div
            key={item.label}
            className="relative"
            onMouseEnter={() => setDropdownOpen(item.label)}
            onMouseLeave={() => setDropdownOpen(null)}
          >
            <Link
              to={item.path}
              className="flex items-center text-white font-medium hover:text-green-400"
              onClick={() =>
                setDropdownOpen(dropdownOpen === item.label ? null : item.label)
              }
            >
              {item.label}
              {item.sub && <ChevronDown className="ml-1 w-4 h-4" />}
            </Link>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {dropdownOpen === item.label && item.sub && (
                <motion.div
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute top-full mt-2 bg-[#243B6B] rounded-lg shadow-lg py-2 w-48 z-50"
                >
                  {item.sub.map((subItem) => (
                    <Link
                      key={subItem.label}
                      to={subItem.path}
                      className="block px-4 py-2 text-white hover:bg-blue-600"
                    >
                      {subItem.label}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden text-white text-2xl"
        onClick={() => setMenuOpen((prev) => !prev)}
      >
        {menuOpen ? <X /> : <Menu />}
      </button>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-gradient-to-br from-blue-400 via-cyan-500 to-indigo-700
          flex flex-col items-center justify-center space-y-6 z-50 overflow-y-auto"
        >
          {navItems.map((item) => (
            <div key={item.label} className="flex flex-col items-center">
              <Link
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className="text-white text-xl font-semibold hover:text-green-300 mb-2"
              >
                {item.label}
              </Link>
              {item.sub && (
                <div className="flex flex-col space-y-1">
                  {item.sub.map((subItem) => (
                    <Link
                      key={subItem.label}
                      to={subItem.path}
                      onClick={() => setMenuOpen(false)}
                      className="text-white text-lg hover:text-green-200"
                    >
                      {subItem.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          <appkit-button />
          <button
            className="absolute top-6 right-6 text-white text-3xl"
            onClick={() => setMenuOpen(false)}
          >
            <X />
          </button>
        </div>
      )}

      {/* Wallet Button */}
      <div className="hidden md:flex items-center space-x-4">
        <appkit-button />
      </div>
    </header>
  );
}



