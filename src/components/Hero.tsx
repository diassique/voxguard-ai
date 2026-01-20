import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
      <div className="absolute inset-0 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium mb-6 animate-fade-in">
            <span className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse" />
            Powered by ElevenLabs Scribe v2
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Voice Compliance Made
            <span className="block text-gray-400">
              Simple & Secure
            </span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Leverage AI-powered voice transcription and compliance monitoring with ElevenLabs Scribe v2.
            Ensure regulatory adherence in real-time for all your voice communications.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              href="/signup"
              className="group w-full sm:w-auto px-8 py-4 bg-gray-900 text-white text-lg font-semibold rounded-full hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center justify-center"
            >
              Start Free Trial
              <svg className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="#demo"
              className="w-full sm:w-auto px-8 py-4 bg-white text-gray-900 text-lg font-semibold rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors shadow-sm"
            >
              Watch Demo
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Enterprise-grade security</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>24/7 support</span>
            </div>
          </div>
        </div>
        <div className="mt-16 md:mt-20 relative">
          <div className="relative mx-auto max-w-5xl">
            <div className="relative rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 shadow-2xl overflow-hidden border border-gray-700">
              <div className="aspect-video flex items-center justify-center p-8">
                <div className="w-full h-full bg-gray-950 rounded-lg border border-gray-800 flex flex-col overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/50">
                    <div className="flex gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-xs font-mono text-gray-400">LIVE // MONITORING</span>
                    </div>
                  </div>

                  {/* Main Grid */}
                  <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar List */}
                    <div className="w-1/4 border-r border-gray-800 bg-gray-900/30 p-3 hidden sm:flex flex-col gap-3">
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Active Channels</div>
                      {/* Active Item */}
                      <div className="p-2.5 bg-gray-800/80 rounded border border-gray-700 shadow-sm">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-gray-200 font-medium my-auto">Channel #102</span>
                          <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">HIGH RISK</span>
                        </div>
                        <div className="h-0.5 w-full bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full w-2/3 bg-red-500" />
                        </div>
                      </div>
                      {/* Inactive Items */}
                      <div className="p-2.5 rounded border border-transparent hover:bg-gray-800/50 transition-colors opacity-50">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-gray-400">Channel #105</span>
                          <span className="text-[10px] text-green-400">SAFE</span>
                        </div>
                      </div>
                      <div className="p-2.5 rounded border border-transparent hover:bg-gray-800/50 transition-colors opacity-50">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-gray-400">Channel #098</span>
                          <span className="text-[10px] text-green-400">SAFE</span>
                        </div>
                      </div>
                    </div>

                    {/* Center: Transcript & Analysis */}
                    <div className="flex-1 flex flex-col p-4 sm:p-6 bg-gray-950/50 relative">
                      {/* Transcript Snippet */}
                      <div className="space-y-4 mb-auto">
                        <div className="flex gap-4 opacity-50">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 text-xs font-bold">A</div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-indigo-300">Agent</span>
                              <span className="text-[10px] text-gray-600">00:14</span>
                            </div>
                            <p className="text-sm text-gray-400">Hello, I&apos;m calling about the update to your policy.</p>
...
                            <p className="text-sm text-gray-200">I actually said I&apos;m not interested in this.</p>
...
                              But you have to sign up today, <span className="text-red-400 underline decoration-red-500/50 decoration-wavy underline-offset-2">it&apos;s mandatory for all users</span>.
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center text-gray-300 text-xs font-bold">C</div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-300">Customer</span>
                              <span className="text-[10px] text-gray-600">00:19</span>
                            </div>
                            <p className="text-sm text-gray-200">I actually said I'm not interested in this.</p>
                          </div>
                        </div>

                        <div className="flex gap-4 relative">
                          {/* Highlight Effect */}
                          <div className="absolute -inset-2 bg-red-500/5 rounded-lg border border-red-500/10" />
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 text-xs font-bold relative z-10">A</div>
                          <div className="space-y-1 relative z-10">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-indigo-300">Agent</span>
                              <span className="text-[10px] text-gray-600">00:23</span>
                            </div>
                            <p className="text-sm text-gray-200">
                              But you have to sign up today, <span className="text-red-400 underline decoration-red-500/50 decoration-wavy underline-offset-2">it's mandatory for all users</span>.
                            </p>
                            <div className="inline-flex items-center gap-1.5 mt-2 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded text-red-300 text-xs font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                              Use of pressure language
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Visualizer Footer */}
                      <div className="h-12 border-t border-gray-800 pt-3 flex items-end justify-between gap-1 opacity-40">
                        <div className="w-1 bg-blue-500 h-3 rounded-t" />
                        <div className="w-1 bg-blue-500 h-5 rounded-t" />
                        <div className="w-1 bg-blue-500 h-2 rounded-t" />
                        <div className="w-1 bg-blue-500 h-6 rounded-t" />
                        <div className="w-1 bg-blue-500 h-3 rounded-t" />
                        <div className="w-1 bg-blue-500 h-4 rounded-t" />
                        <div className="w-1 bg-red-500 h-8 rounded-t" />
                        <div className="w-1 bg-red-500 h-10 rounded-t" />
                        <div className="w-1 bg-red-500 h-6 rounded-t" />
                        <div className="w-1 bg-blue-500 h-3 rounded-t" />
                        <div className="w-1 bg-blue-500 h-5 rounded-t" />
                        <div className="w-1 bg-blue-500 h-2 rounded-t" />
                        <div className="w-1 bg-blue-500 h-3 rounded-t" />
                        <div className="w-1 bg-blue-500 h-5 rounded-t" />
                        <div className="w-1 bg-blue-500 h-2 rounded-t" />
                        <div className="w-1 bg-blue-500 h-6 rounded-t" />
                        <div className="w-1 bg-blue-500 h-3 rounded-t" />
                        <div className="w-1 bg-blue-500 h-4 rounded-t" />
                        <div className="w-1 bg-blue-500 h-8 rounded-t" />
                        <div className="w-1 bg-blue-500 h-3 rounded-t" />
                        <div className="w-1 bg-blue-500 h-5 rounded-t" />
                        <div className="w-1 bg-blue-500 h-2 rounded-t" />
                        <div className="w-1 bg-blue-500 h-6 rounded-t" />
                        <div className="w-1 bg-blue-500 h-3 rounded-t" />
                        <div className="w-1 bg-blue-500 h-4 rounded-t" />
                        <div className="w-1 bg-blue-500 h-8 rounded-t" />
                        <div className="w-1 bg-blue-500 h-3 rounded-t" />
                        <div className="w-1 bg-blue-500 h-5 rounded-t" />
                        <div className="w-1 bg-blue-500 h-2 rounded-t" />
                        <div className="w-1 bg-blue-500 h-6 rounded-t" />
                        <div className="w-1 bg-blue-500 h-3 rounded-t" />
                        <div className="w-1 bg-blue-500 h-4 rounded-t" />
                        <div className="w-1 bg-blue-500 h-8 rounded-t" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
