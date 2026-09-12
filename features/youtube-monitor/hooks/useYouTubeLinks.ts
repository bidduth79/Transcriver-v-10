import { useState, useEffect } from 'react';
import { STORES, getFromStore, addToStore } from '../../../services/db';

export function useYouTubeLinks() {
  const [downloadedLinks, setDownloadedLinks] = useState<{url: string, title: string, timestamp: string}[]>([]);
  const [visitedLinks, setVisitedLinks] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('yt_visited_links');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const markLinkVisited = (url: string) => {
    setVisitedLinks(prev => {
      const newSet = new Set(prev);
      newSet.add(url);
      localStorage.setItem('yt_visited_links', JSON.stringify(Array.from(newSet)));
      
      // Sync to cloud
      addToStore(STORES.YOUTUBE_LINKS, {
        id: 'links_data',
        downloaded: downloadedLinks,
        visited: Array.from(newSet),
        updatedAt: new Date().toISOString()
      }).catch(console.error);

      return newSet;
    });
  };

  useEffect(() => {
    const syncLinks = async () => {
      try {
        const cloudData = await getFromStore(STORES.YOUTUBE_LINKS, 'links_data');
        let mergedDownloaded: any[] = [];
        let mergedVisited = new Set<string>();

        const localDownloadedStr = localStorage.getItem('jarvis_downloaded_links') || '[]';
        const localDownloaded = JSON.parse(localDownloadedStr);
        
        const localVisitedStr = localStorage.getItem('yt_visited_links') || '[]';
        const localVisited = JSON.parse(localVisitedStr);

        if (cloudData) {
          const cloudDownloaded = (cloudData as any).downloaded || [];
          const cloudVisited = (cloudData as any).visited || [];
          
          // Merge downloaded
          mergedDownloaded = [...localDownloaded];
          cloudDownloaded.forEach((cd: any) => {
            if (!mergedDownloaded.some(ld => ld.url === cd.url)) {
              mergedDownloaded.push(cd);
            }
          });
          // Sort by timestamp descending
          mergedDownloaded.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          
          // Merge visited
          mergedVisited = new Set([...localVisited, ...cloudVisited]);
          
          localStorage.setItem('jarvis_downloaded_links', JSON.stringify(mergedDownloaded));
          localStorage.setItem('yt_visited_links', JSON.stringify(Array.from(mergedVisited)));
        } else {
          mergedDownloaded = localDownloaded;
          mergedVisited = new Set(localVisited);
          
          // Initial sync to cloud if local data exists
          if (mergedDownloaded.length > 0 || mergedVisited.size > 0) {
            addToStore(STORES.YOUTUBE_LINKS, {
              id: 'links_data',
              downloaded: mergedDownloaded,
              visited: Array.from(mergedVisited),
              updatedAt: new Date().toISOString()
            }).catch(console.error);
          }
        }

        setDownloadedLinks(mergedDownloaded);
        setVisitedLinks(mergedVisited);
      } catch (e) {
        console.error("Error syncing links from cloud", e);
      }
    };

    const loadLinks = () => {
      try {
        const linksStr = localStorage.getItem('jarvis_downloaded_links') || '[]';
        setDownloadedLinks(JSON.parse(linksStr));
      } catch (e) {
        console.error("Error loading links", e);
      }
    };

    syncLinks();
    window.addEventListener('jarvis_links_updated', loadLinks);
    return () => window.removeEventListener('jarvis_links_updated', loadLinks);
  }, []);

  return {
    downloadedLinks,
    setDownloadedLinks,
    visitedLinks,
    markLinkVisited
  };
}
