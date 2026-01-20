export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Upload or Record",
      description: "Upload your audio files or record directly from your browser. We support all major audio formats.",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
    },
    {
      number: "02",
      title: "AI Transcription",
      description: "Our ElevenLabs Scribe v2 powered AI transcribes your audio with industry-leading accuracy.",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      number: "03",
      title: "Compliance Analysis",
      description: "Automatically scan transcripts for compliance violations, keywords, and regulatory issues.",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      number: "04",
      title: "Get Reports",
      description: "Receive detailed reports with insights, risk scores, and recommendations for improvement.",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ];

  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden bg-white">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] right-[-5%] w-96 h-96 bg-blue-50/50 rounded-full blur-3xl" />
        <div className="absolute bottom-[10%] left-[-5%] w-96 h-96 bg-purple-50/50 rounded-full blur-3xl" />
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-display tracking-tight">
            How VoxGuard
            <span className="ml-2 text-gray-400">
              Works
            </span>
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            From upload to compliance report in four simple steps. powered by advanced AI analysis.
          </p>
        </div>

        <div className="relative">
          {/* Connecting line for desktop */}
          <div className="hidden lg:block absolute top-12 left-4 right-4 h-0.5 bg-gradient-to-r from-blue-100 via-orange-100 to-blue-100"></div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 lg:gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative flex flex-col items-center text-center group">
                <div className="relative mb-8">
                  <div className="w-24 h-24 rounded-2xl bg-white border border-gray-100 shadow-xl shadow-blue-900/5 flex items-center justify-center relative z-10 transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:shadow-blue-900/10">
                    <div className="text-blue-600 transition-colors duration-300 group-hover:text-[#FF6B35]">
                      {step.icon}
                    </div>
                  </div>
                  {/* Step number badge */}
                  <div className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF8F66] text-white flex items-center justify-center text-sm font-bold shadow-lg z-20">
                    {step.number}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm sm:text-base">
                  {step.description}
                </p>
                
                {/* Mobile connector */}
                {index < steps.length - 1 && (
                  <div className="lg:hidden absolute bottom-[-48px] left-1/2 w-0.5 h-12 bg-gray-100 -ml-[1px]"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-20">
          <a
            href="/login"
            className="inline-flex items-center px-8 py-4 bg-gray-900 text-white text-lg font-medium rounded-full hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
          >
            Start Your Free Trial
            <svg className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}