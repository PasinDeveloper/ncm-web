export default function CreditsSection() {
  return (
    <footer className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl p-8 text-center text-white/70">
        <div className="mb-4 text-lg">
          Powered by <a href="https://magic-akari.github.io/ncmc-web/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-300 transition-colors">ncmc-web</a> by 阿卡琳. &nbsp;&middot;&nbsp; <a href="https://github.com/magic-akari/ncmc" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-300 transition-colors">CLI version</a>
        </div>
        <div className="text-white/40 font-medium">MIT License &copy; 2018 阿卡琳</div>
      </div>
    </footer>
  );
} 