import { TbLock, TbCloudUpload, TbWaveSine } from "react-icons/tb";

export default function FeaturesSection() {
  const features = [
    {
      icon: TbLock,
      title: "Fully Offline & Private",
      description:
        "All processing happens in your browser. No uploads, no tracking, no data leaves your device.",
    },
    {
      icon: TbCloudUpload,
      title: "Drag & Drop Simplicity",
      description:
        "Easily drag and drop or select multiple files. Batch handling with a single click.",
    },
    {
      icon: TbWaveSine,
      title: "High-Quality Output",
      description:
        "Outputs MP3/FLAC with accurate metadata, bitrate, and sample rate. High-res audio supported.",
    },
  ];

  return (
    <section className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <div
            key={index}
            className="group relative rounded-3xl bg-white/5 backdrop-blur-xl p-8 border border-white/10 shadow-2xl hover:bg-white/8 hover:border-white/20 transition-all duration-500 hover:scale-105"
          >
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
              <div className="w-16 h-16 mb-6 flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-xl group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">
                {feature.title}
              </h3>
              <p className="text-white/70 leading-relaxed">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
