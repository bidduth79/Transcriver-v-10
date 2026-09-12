import React from 'react';
import { Youtube, Video, Clock } from 'lucide-react';
import { YouTubeDownloadQueue } from './YouTubeDownloadQueue';
import { MonitorVideoSection } from './MonitorVideoSection';

export const YouTubeMonitorMainContent = ({
  queueState,
  appLang,
  updateVideo,
  addToast,
  setQueueState,
  recentVideos,
  oldVideos,
  isDark,
  groupedRecent,
  openDownloadId,
  setOpenDownloadId,
  formatTime,
  markAsRead,
  isSelectMode,
  selectedIds,
  toggleSelectVideo,
  onLoadTranscript,
  onStartTranscription,
  addVideoToQueue,
  groupedOld
}: any) => {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="space-y-12">
        <YouTubeDownloadQueue
          queue={queueState.queue}
          appLang={appLang}
          onUpdateVideo={updateVideo}
          addToast={addToast}
          onPause={(id) => {
            updateVideo(id, { status: 'pending' });
          }}
          onStart={(id) => {
            updateVideo(id, { status: 'downloading' });
          }}
          onStop={(id) => {
            updateVideo(id, { status: 'pending', progress: 0 });
          }}
          onRetry={(id) => {
            updateVideo(id, { status: 'pending', progress: 0, error: undefined, retryCount: 0 });
          }}
          onDelete={(id) => {
            setQueueState((prev: any) => ({
              ...prev,
              queue: prev.queue.filter((v: any) => v.id !== id)
            }));
            import('../../../services/db').then(({ deleteFromStore, STORES }) => {
              deleteFromStore(STORES.YOUTUBE_QUEUE, id);
            });
          }}
          onClear={() => {
            setQueueState((prev: any) => {
              const newQueue = prev.queue.map((v: any) => {
                if (v.status === 'completed') {
                  const updated = { ...v, status: 'downloaded' as any };
                  import('../../../services/db').then(({ addToStore, STORES }) => {
                    addToStore(STORES.YOUTUBE_QUEUE, updated).catch(console.error);
                  });
                  return updated;
                }
                return v;
              });

              return {
                ...prev,
                queue: newQueue
              };
            });
          }}
        />

        {recentVideos.length === 0 && oldVideos.length === 0 ? (
          <div className={`flex flex-col items-center justify-center h-64 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            <Youtube className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg">{appLang === 'bn' ? 'কোনো ভিডিও পাওয়া যায়নি' : 'No videos found'}</p>
          </div>
        ) : (
          <>
            <MonitorVideoSection
              groupedVideos={groupedRecent}
              title={appLang === 'bn' ? 'সাম্প্রতিক ভিডিও' : 'Recent Videos'}
              icon={<Video className="w-5 h-5 text-red-500" />}
              appLang={appLang}
              openDownloadId={openDownloadId}
              setOpenDownloadId={setOpenDownloadId}
              formatTime={formatTime}
              addToast={addToast}
              onMarkAsRead={markAsRead}
              onUpdateVideo={updateVideo}
              isSelectMode={isSelectMode}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelectVideo}
              onLoadTranscript={onLoadTranscript}
              onStartTranscription={onStartTranscription}
              queueState={queueState}
              addVideoToQueue={addVideoToQueue}
              isDark={isDark}
            />
            
            <MonitorVideoSection
              groupedVideos={groupedOld}
              title={appLang === 'bn' ? 'পুরাতন ভিডিও' : 'Old Videos'}
              icon={<Clock className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />}
              appLang={appLang}
              openDownloadId={openDownloadId}
              setOpenDownloadId={setOpenDownloadId}
              formatTime={formatTime}
              addToast={addToast}
              onMarkAsRead={markAsRead}
              onUpdateVideo={updateVideo}
              isSelectMode={isSelectMode}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelectVideo}
              onLoadTranscript={onLoadTranscript}
              onStartTranscription={onStartTranscription}
              queueState={queueState}
              addVideoToQueue={addVideoToQueue}
              isDark={isDark}
            />
          </>
        )}
      </div>
    </div>
  );
};
