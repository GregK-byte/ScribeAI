import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";

export default async function LandingPage() {
  const { userId } = await auth();
  const user = await currentUser();

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SA</span>
            </div>
            <span className="font-bold text-xl">ScribeAI</span>
          </div>
          <nav className="flex items-center gap-4">
            <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
              How It Works
            </a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
              Pricing
            </a>
            {userId ? (
              <Link
                href="/dashboard"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                >
                  Start Free Trial
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-16 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-6">
          Eliminate <span className="text-blue-600">2+ hours</span> of daily
          medical note-taking
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
          Record patient consultations and get structured SOAP notes in minutes.
          No enterprise pricing. No complex EHR integrations. Just record and go.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href={userId ? "/dashboard" : "/sign-up"}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-200"
          >
            {userId ? "Go to Dashboard" : "Start Free Trial"}
          </Link>
          <a
            href="#how-it-works"
            className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-50 transition"
          >
            See How It Works
          </a>
        </div>
        <p className="text-sm text-gray-500 mt-4">14-day free trial. No credit card required.</p>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Record",
                desc: "Hit record during your patient consultation. Works on desktop and mobile browsers.",
              },
              {
                step: "2",
                title: "Transcribe",
                desc: "Your recording is securely transcribed using OpenAI Whisper, the industry-leading speech-to-text AI.",
              },
              {
                step: "3",
                title: "Get SOAP Notes",
                desc: "Our AI generates a structured Subjective, Objective, Assessment, Plan note — ready to review and export.",
              },
            ].map((item) => (
              <div key={item.step} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Simple Pricing</h2>
          <div className="max-w-sm mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-blue-600 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-semibold">
                MOST POPULAR
              </div>
              <h3 className="text-xl font-semibold text-center mb-2">Professional</h3>
              <div className="text-center mb-6">
                <span className="text-4xl font-bold">$19</span>
                <span className="text-gray-500">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Unlimited SOAP notes",
                  "Audio recording & upload",
                  "AI-powered transcription",
                  "Structured SOAP generation",
                  "Export to PDF",
                  "14-day free trial",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href={userId ? "/dashboard" : "/sign-up"}
                className="block text-center bg-blue-600 text-white w-full py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                {userId ? "Go to Dashboard" : "Start Free Trial"}
              </Link>
              <p className="text-xs text-gray-500 text-center mt-3">
                Pay with card, PayPal, or crypto
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} ScribeAI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
