import React, { useState, useEffect } from 'react';
import { Play, GraduationCap, ExternalLink, Video, Clock, CheckCircle2, ChevronRight, ChevronLeft, Share2, Sparkles, BookOpen } from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import {
  getVideoType,
  getVideoEmbedUrl,
  getVideoThumbnail,
  isDirectVideoUrl
} from '../../utils/youtube.js';

export const ResellerTrainingTab: React.FC = () => {
  const { lang, employeeToken } = useApp();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const loadVideos = async () => {
      if (!employeeToken) return;
      try {
        const data = await api.employeeGetTrainingVideos(employeeToken);
        const sorted = Array.isArray(data) ? [...data].sort((a, b) => (a.order || 0) - (b.order || 0)) : [];
        setVideos(sorted);
        if (sorted.length > 0) {
          setSelectedVideo(sorted[0]);
        }
      } catch (err) {
        console.error('Failed to load training videos:', err);
      } finally {
        setLoading(false);
      }
    };
    loadVideos();
  }, [employeeToken]);

  const handleOpenLink = (video: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (video?.videoUrl) {
      window.open(video.videoUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCopyLink = (video: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (video?.videoUrl && navigator.clipboard) {
      navigator.clipboard.writeText(video.videoUrl);
      setCopiedId(video.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const currentIndex = selectedVideo ? videos.findIndex(v => v.id === selectedVideo.id) : -1;
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < videos.length - 1;

  const handlePrev = () => {
    if (hasPrevious) {
      setSelectedVideo(videos[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      setSelectedVideo(videos[currentIndex + 1]);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-9 h-9 border-3 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-500">
          {lang === 'bn' ? 'ট্রেনিং ভিডিও লোড হচ্ছে...' : 'Loading training videos...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 w-full max-w-[1920px] mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md text-emerald-300 flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  {lang === 'bn' ? 'রিসেলার ট্রেনিং সেন্টার' : 'Reseller Training Center'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                  {lang === 'bn' ? 'টিউটোরিয়াল ও গাইডলাইন' : 'Tutorials & Guides'}
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 font-medium mt-0.5">
                {lang === 'bn'
                  ? 'নিচের প্রতিটি ভিডিও দেখে প্রোডাক্ট মার্কেটিং, সেলস এবং সর্বোচ্চ কমিশন আয়ের কৌশল শিখুন'
                  : 'Watch step-by-step videos to master product marketing, sales and boost commissions'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <div className="px-3.5 py-1.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-xl text-xs font-bold text-white flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
              <span>{videos.length} {lang === 'bn' ? 'টি ট্রেনিং ভিডিও' : 'Training Videos'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="space-y-6">
        {/* Active Embedded Player */}
        {selectedVideo && (
          <div className="bg-slate-950 rounded-2xl overflow-hidden shadow-xl border border-slate-800">
            {/* Video Canvas */}
            <div className="aspect-video w-full bg-black relative flex items-center justify-center overflow-hidden">
              {isDirectVideoUrl(selectedVideo.videoUrl) ? (
                <video
                  controls
                  playsInline
                  key={selectedVideo.videoUrl}
                  src={selectedVideo.videoUrl}
                  poster={getVideoThumbnail(selectedVideo) || undefined}
                  className="w-full h-full object-contain bg-black"
                />
              ) : getVideoEmbedUrl(selectedVideo.videoUrl) ? (
                <iframe
                  key={selectedVideo.videoUrl}
                  src={getVideoEmbedUrl(selectedVideo.videoUrl, false)!}
                  title={selectedVideo.titleBn || selectedVideo.titleEn || 'Training Video'}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-900">
                  <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center">
                    <Video className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white mb-1">
                      {selectedVideo.titleBn || selectedVideo.titleEn || 'ট্রেনিং ভিডিও'}
                    </p>
                    <p className="text-xs text-slate-400">
                      ভিডিও প্লে করতে মূল লিংকে ক্লিক করুন
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenLink(selectedVideo)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition-all shadow-md"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>মূল ভিডিও লিংকে দেখুন</span>
                  </button>
                </div>
              )}
            </div>

            {/* Video Player Info Bar */}
            <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-800/80 text-white space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {lang === 'bn' ? `টিউটোরিয়াল #${currentIndex + 1}` : `Tutorial #${currentIndex + 1}`}
                    </span>
                    {selectedVideo.duration && (
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700 inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-400" />
                        <span>{selectedVideo.duration}</span>
                      </span>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {selectedVideo.titleBn || selectedVideo.titleEn || 'ট্রেনিং টিউটোরিয়াল'}
                  </h3>
                </div>

                {/* Player Controls & Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {hasPrevious && (
                    <button
                      onClick={handlePrev}
                      className="px-3 py-1.5 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl inline-flex items-center gap-1 transition-all"
                      title="পূর্ববর্তী ভিডিও"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{lang === 'bn' ? 'পূর্ববর্তী' : 'Prev'}</span>
                    </button>
                  )}

                  {hasNext && (
                    <button
                      onClick={handleNext}
                      className="px-3 py-1.5 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl inline-flex items-center gap-1 transition-all"
                      title="পরবর্তী ভিডিও"
                    >
                      <span className="hidden sm:inline">{lang === 'bn' ? 'পরবর্তী' : 'Next'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => handleCopyLink(selectedVideo)}
                    className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all"
                    title={copiedId === selectedVideo.id ? 'লিংক কপি হয়েছে!' : 'লিংক কপি করুন'}
                  >
                    {copiedId === selectedVideo.id ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Share2 className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => handleOpenLink(selectedVideo)}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl inline-flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'মূল লিংকে যান' : 'Open Link'}</span>
                  </button>
                </div>
              </div>

              {/* Video Description / Learning Summary */}
              {(selectedVideo.descriptionBn || selectedVideo.descriptionEn) && (
                <div className="pt-3 border-t border-slate-800 text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'এই ভিডিও থেকে যা যা শিখবেন:' : 'Key learning points:'}</span>
                  </div>
                  <p className="whitespace-pre-line text-slate-300">
                    {selectedVideo.descriptionBn || selectedVideo.descriptionEn}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Serialized Training Videos List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
              <Video className="w-4 h-4 text-emerald-600" />
              <span>{lang === 'bn' ? 'ট্রেনিং তালিকা (ক্রমানুসারে)' : 'Training Curriculum'}</span>
            </span>
            <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
              {lang === 'bn' ? 'যেকোনো ভিডিওর ওপর ক্লিক করে সরাসরি দেখুন' : 'Click on any tutorial to play'}
            </span>
          </div>

          {videos.length === 0 ? (
            <div className="py-16 text-center space-y-3 px-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <Play className="w-6 h-6 fill-current ml-0.5" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <p className="text-sm font-bold text-slate-800">
                  {lang === 'bn' ? 'কোনো ট্রেনিং ভিডিও খুঁজে পাওয়া যায়নি' : 'No training videos found'}
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {lang === 'bn'
                    ? 'অ্যাডমিন প্যানেল থেকে খুব শীঘ্রই নতুন ট্রেনিং টিউটোরিয়াল আপলোড করা হবে।'
                    : 'Training videos will be published soon from the admin portal.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {videos.map((video, idx) => {
                const title = video.titleBn || video.titleEn || `ট্রেনিং টিউটোরিয়াল #${idx + 1}`;
                const desc = video.descriptionBn || video.descriptionEn || '';
                const isSelected = selectedVideo?.id === video.id;
                const thumb = getVideoThumbnail(video);

                return (
                  <div
                    key={video.id || idx}
                    onClick={() => {
                      setSelectedVideo(video);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`p-3.5 sm:p-4 flex items-center gap-3.5 sm:gap-4 transition-all cursor-pointer group ${
                      isSelected
                        ? 'bg-emerald-50/70 border-l-4 border-l-emerald-600'
                        : 'hover:bg-slate-50/80 border-l-4 border-l-transparent'
                    }`}
                  >
                    {/* Serial Number Badge */}
                    <span
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl text-xs font-mono font-bold flex items-center justify-center shrink-0 border transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-100 text-slate-700 border-slate-200 group-hover:border-slate-300'
                      }`}
                    >
                      {idx + 1}
                    </span>

                    {/* Video Thumbnail Preview */}
                    <div className="relative w-20 sm:w-28 aspect-video rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-200 group-hover:shadow-xs transition-all">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-slate-500">
                          <Video className="w-5 h-5 text-emerald-400" />
                        </div>
                      )}
                      
                      {/* Play overlay badge */}
                      <div className={`absolute inset-0 flex items-center justify-center transition-all ${
                        isSelected ? 'bg-emerald-900/40' : 'bg-black/25 group-hover:bg-black/10'
                      }`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-md transition-transform group-hover:scale-110 ${
                          isSelected ? 'bg-emerald-500 text-white' : 'bg-white/90 text-slate-900'
                        }`}>
                          <Play className="w-3 h-3 fill-current ml-0.5" />
                        </div>
                      </div>

                      {/* Duration Tag */}
                      {video.duration && (
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white font-medium">
                          {video.duration}
                        </span>
                      )}
                    </div>

                    {/* Video Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4
                          className={`text-xs sm:text-sm font-bold truncate transition-colors ${
                            isSelected ? 'text-emerald-900' : 'text-slate-900 group-hover:text-emerald-600'
                          }`}
                        >
                          {title}
                        </h4>
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                            {lang === 'bn' ? 'চলছে' : 'Playing'}
                          </span>
                        )}
                      </div>

                      {desc && (
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {desc}
                        </p>
                      )}

                      {video.videoUrl && (
                        <p className="text-[10px] text-slate-400 font-mono truncate max-w-md">
                          {video.videoUrl}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleOpenLink(video, e)}
                        className="p-2 sm:px-2.5 sm:py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/70 rounded-xl inline-flex items-center gap-1 transition-all"
                        title="মূল ভিডিও লিংক খুলুন"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">{lang === 'bn' ? 'লিংক খুলুন' : 'Open'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedVideo(video);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-2xs ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-600 hover:text-white'
                        }`}
                        title="ভিডিও প্লে করুন"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span className="hidden sm:inline">
                          {isSelected ? (lang === 'bn' ? 'চলছে' : 'Playing') : (lang === 'bn' ? 'দেখুন' : 'Watch')}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
