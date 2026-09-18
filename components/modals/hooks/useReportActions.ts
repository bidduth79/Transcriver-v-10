import { useState, useCallback } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { addToStore, getAllFromStore, deleteFromStore, STORES } from '../../../services/db';
import { getActiveProvider, incrementTotalCalls } from '../../../services/ApiKeyManager';
import { logSystemActivity } from '../../../services/SystemLogger';

export interface ReportItem {
  id: string;
  date: string;
  searchTerm: string;
  fileName: string;
  content: string;
}

export const useReportActions = (
  searchTerm: string, 
  fileMeta: any, 
  appLang: 'bn' | 'en', 
  addToast: (msg: string, type: any) => void,
  onModelUpdate?: (models?: any) => void,
  setIsAiLoading?: (loading: boolean) => void
) => {
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportHistory, setReportHistory] = useState<ReportItem[]>([]);

  const loadReportsFromDB = useCallback(async () => {
    try {
      const data: any = await getAllFromStore(STORES.REPORTS);
      setReportHistory(data);
    } catch (err) {
      console.error("Failed to load reports:", err);
    }
  }, []);

  const generateReport = useCallback(async (analysisData: any) => {
    const data = analysisData;
    if (!data || data.matchCount === 0 || loading) return;
    setLoading(true);
    if (setIsAiLoading) setIsAiLoading(true);
    setReport('');

    const executeAI = async (): Promise<string | undefined> => {
      const provider = await getActiveProvider();
      if (!provider) {
          throw new Error("No Active API Key Selected.");
      }

      const ai = new GoogleGenAI({ apiKey: provider.key });
      const prompt = `Analyze these snippets about "${searchTerm}".
      Task:
      1. Provide a brief Bengali summary (strictly under 5 words, e.g., "রাজনৈতিক আলোচনা" or "অর্থনৈতিক বিষয়").
      2. Provide a sentiment: "ইতিবাচক", "নেতিবাচক", or "নিউট্রাল".
      
      Output exactly this format:
      SUMMARY: [Summary]
      SENTIMENT: [Result]
      
      Snippets: ${data.snippets.slice(0, 4).join(' | ')}`;

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: provider.model,
        contents: prompt
      });
      await incrementTotalCalls('রিপোর্ট জেনারেশন', provider.model, provider.source);
      if (onModelUpdate) onModelUpdate();
      return response.text;
    };

    try {
      const aiText = await executeAI() || "";
      const summaryMatch = aiText.match(/SUMMARY:\s*(.*)/i);
      const sentimentMatch = aiText.match(/SENTIMENT:\s*(.*)/i);
      
      const summaryText = summaryMatch ? summaryMatch[1].trim() : "আলোচিত বিষয়বস্তু";
      const sentiment = sentimentMatch ? sentimentMatch[1].trim() : "নিউট্রাল";
      
      const timeRangeStr = data.ranges.length > 1 
        ? `${data.ranges[0]} থেকে ${data.ranges[data.ranges.length - 1]}`
        : data.ranges[0];

      const today = new Date().toLocaleDateString('bn-BD');
      let finalReport = `শ্রদ্ধেয় জেনারেল\nআসসালামু আলাইকুম স‍্যার,\n\nতারিখ: ${today}\n\n১। উক্ত ভিডিওর দৈর্ঘ্য ${fileMeta.duration || '00:00'}। ভিডিওর ${timeRangeStr} সময়কালে ${summaryText} ${searchTerm}কে নিয়ে ${sentiment} মন্তব্য পরিলক্ষিত হয়েছে।\n\n`;
      
      data.snippets.forEach((snip: string, idx: number) => {
        finalReport += `মন্তব্য-${idx + 1}: ${snip}\n\n`;
      });
      
      finalReport += `আপনার সদয় অবগতির জন‍্য প্রেরণ করা হলো।\n\nশ্রদ্ধান্তে`;
      setReport(finalReport);
      
      const newItem: ReportItem = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        searchTerm,
        fileName: fileMeta.name,
        content: finalReport
      };
      await addToStore(STORES.REPORTS, newItem);
      await loadReportsFromDB();
      
      // Log Success
      logSystemActivity('REPORT', 'SUCCESS', 'Report Generated', `Term: ${searchTerm}, File: ${fileMeta.name}`);
      
      addToast(appLang === 'bn' ? "রিপোর্ট তৈরি হয়েছে" : "Report generated", 'success');
    } catch (err: any) {
      console.error(err);
      
      // Log Error
      logSystemActivity('REPORT', 'ERROR', 'Report Generation Failed', `Error: ${err.message}`);
      
      const errorMsg = err.message?.includes('API Key') 
        ? (appLang === 'bn' ? 'API Key সিলেক্ট করুন' : 'Select API Key') 
        : (appLang === 'bn' ? "রিপোর্ট তৈরিতে সমস্যা হয়েছে" : "Failed to generate report");

      addToast(errorMsg, 'error');
    } finally {
      setLoading(false);
      if (setIsAiLoading) setIsAiLoading(false);
    }
  }, [loading, setIsAiLoading, searchTerm, fileMeta, appLang, addToast, onModelUpdate, loadReportsFromDB]);

  const handleDeleteReport = async (id: string, selectedReport: ReportItem | null, setSelectedReport: any) => {
    await deleteFromStore(STORES.REPORTS, id);
    await loadReportsFromDB();
    if (selectedReport?.id === id) setSelectedReport(null);
    logSystemActivity('REPORT', 'WARNING', 'Report Deleted', `ID: ${id}`);
    addToast(appLang === 'bn' ? "রিপোর্ট ডিলিট করা হয়েছে" : "Report deleted", 'warning');
  };

  return { report, loading, reportHistory, loadReportsFromDB, generateReport, handleDeleteReport };
};
