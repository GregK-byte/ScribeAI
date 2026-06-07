/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow server-side packages for PDF generation
  serverExternalPackages: ["jspdf", "jspdf-autotable"],
};

export default nextConfig;
