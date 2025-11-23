import { TbMusic } from "react-icons/tb";

export default function Header() {
  return (
    <header className="bg-black/20 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <TbMusic className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent tracking-tight">
              NCM WEB
            </h1>
          </div>
          <div className="text-sm text-white/60 font-medium bg-white/5 px-4 py-2 rounded-full backdrop-blur-sm">
            Play & export ncm audio
          </div>
        </div>
      </div>
    </header>
  );
}
