import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";

type ExportFormat = "pdf" | "latex" | "json";

interface ExportStatus {
  type: 'idle' | 'loading' | 'success' | 'error';
  message: string;
  details?: string;
}

export default function ResumeExport() {
  const exportResumeDirectly = useAction(api.exportResume.exportResumeDirectly);

  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("pdf");
  const [customFilename, setCustomFilename] = useState("");
  const [exportStatus, setExportStatus] = useState<ExportStatus>({
    type: 'idle',
    message: ''
  });
  const [showModal, setShowModal] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const formatDescriptions = {
    pdf: "Professional PDF document ready for applications",
    latex: "LaTeX source file for advanced customization",
    json: "Raw data in JSON format for integration"
  };

  const handleExport = async () => {
    setExportStatus({ type: 'loading', message: 'Generating your resume...' });

    try {
      // If JSON format, we can use Convex directly (no backend needed)
      if (selectedFormat === "json") {
        const result = await exportResumeDirectly({});

        if (result.success) {
          // Create and download JSON file
          const jsonContent = JSON.stringify(result.data, null, 2);
          const blob = new Blob([jsonContent], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${customFilename || 'resume'}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          setExportStatus({
            type: 'success',
            message: 'Resume exported successfully!',
            details: `Downloaded as ${customFilename || 'resume'}.json`
          });
        } else {
          setExportStatus({
            type: 'error',
            message: 'Failed to export resume',
            details: result.message
          });
        }
      } else {
        // For PDF and LaTeX, call FastAPI directly from frontend
        try {
          const response = await fetch('http://localhost:8000/resume/export', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              format: selectedFormat,
              filename: customFilename || 'resume'
            })
          });

          if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
          }

          const result = await response.json();

          if (result.success && result.content) {
            // Decode base64 content and create blob
            const binaryString = atob(result.content);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }

            const blob = new Blob([bytes], { type: result.mime_type || 'application/octet-stream' });
            const url = URL.createObjectURL(blob);

            // Create download link
            const a = document.createElement('a');
            a.href = url;
            a.download = result.filename || `resume.${selectedFormat}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setExportStatus({
              type: 'success',
              message: 'Resume exported successfully!',
              details: `Downloaded as ${result.filename}`
            });
          } else {
            setExportStatus({
              type: 'error',
              message: result.message || 'Export failed',
              details: result.error_details || result.error
            });
          }
        } catch (fetchError) {
          // If fetch fails, backend is likely not running
          if (fetchError instanceof TypeError && fetchError.message.includes('fetch')) {
            setExportStatus({
              type: 'error',
              message: 'Backend API is not running',
              details: 'Please start the backend API: cd backend && just run'
            });
          } else {
            throw fetchError;
          }
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus({
        type: 'error',
        message: 'An error occurred during export',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const handleStartBackend = () => {
    setExportStatus({
      type: 'idle',
      message: '',
    });
    alert("To start the backend API:\n\n1. Open a new terminal\n2. Navigate to the backend folder: cd backend\n3. Run: python api.py\n\nThe API will start on http://localhost:8000");
  };

  // Create portal mount point
  useEffect(() => {
    const portalRoot = document.getElementById('modal-root');
    if (!portalRoot) {
      const div = document.createElement('div');
      div.id = 'modal-root';
      document.body.appendChild(div);
    }
  }, []);

  const modalContent = showModal ? (
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => {
          setShowModal(false);
          setExportStatus({ type: 'idle', message: '' });
        }}
      />

      {/* Modal Content */}
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <div
            className="relative transform overflow-hidden rounded-2xl bg-near-black border border-border-grey text-left shadow-2xl transition-all w-full max-w-2xl p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-off-white">Export Your Resume</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setExportStatus({ type: 'idle', message: '' });
                }}
                className="text-muted hover:text-off-white transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Format Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-light-grey mb-3 uppercase tracking-wider">
                Select Format
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(["pdf", "latex", "json"] as ExportFormat[]).map((format) => (
                  <button
                    key={format}
                    onClick={() => setSelectedFormat(format)}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      selectedFormat === format
                        ? "border-primary-orange bg-primary-orange/10"
                        : "border-border-grey hover:border-primary-orange/50"
                    }`}
                  >
                    <div className="text-center">
                      <div className={`text-2xl mb-2 ${
                        selectedFormat === format ? "text-primary-orange" : "text-muted"
                      }`}>
                        {format === "pdf" && "📄"}
                        {format === "latex" && "📝"}
                        {format === "json" && "{ }"}
                      </div>
                      <div className={`font-medium uppercase ${
                        selectedFormat === format ? "text-off-white" : "text-light-grey"
                      }`}>
                        {format}
                      </div>
                      <div className="text-xs text-muted mt-1">
                        {formatDescriptions[format]}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Options */}
            <div className="mb-6">
              <button
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="flex items-center gap-2 text-sm text-light-grey hover:text-primary-orange transition-colors duration-200"
              >
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${showAdvancedOptions ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Advanced Options
              </button>

              {showAdvancedOptions && (
                <div className="mt-4 p-4 bg-dark-grey rounded-lg animate-slide-down">
                  <label className="block text-xs font-medium text-light-grey mb-2 uppercase tracking-wider">
                    Custom Filename (optional)
                  </label>
                  <input
                    type="text"
                    value={customFilename}
                    onChange={(e) => setCustomFilename(e.target.value)}
                    placeholder="resume"
                    className="w-full px-4 py-2.5 bg-primary-black border border-border-grey rounded-lg text-off-white placeholder-muted focus:border-primary-orange transition-all duration-200"
                  />
                  <p className="text-xs text-muted mt-2">
                    Leave empty to use default filename. Extension will be added automatically.
                  </p>
                </div>
              )}
            </div>

            {/* Status Messages */}
            {exportStatus.type !== 'idle' && (
              <div className={`mb-6 p-4 rounded-lg animate-fade-in ${
                exportStatus.type === 'loading' ? 'bg-blue-900/20 border border-blue-700' :
                exportStatus.type === 'success' ? 'bg-green-900/20 border border-green-700' :
                'bg-red-900/20 border border-red-700'
              }`}>
                <div className={`flex items-start gap-3 ${
                  exportStatus.type === 'loading' ? 'text-blue-400' :
                  exportStatus.type === 'success' ? 'text-green-400' :
                  'text-red-400'
                }`}>
                  {exportStatus.type === 'loading' && (
                    <svg className="w-5 h-5 animate-spin mt-0.5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  {exportStatus.type === 'success' && (
                    <svg className="w-5 h-5 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  {exportStatus.type === 'error' && (
                    <svg className="w-5 h-5 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  <div>
                    <div className="font-medium">{exportStatus.message}</div>
                    {exportStatus.details && (
                      <div className="text-sm mt-1 opacity-80">{exportStatus.details}</div>
                    )}
                    {exportStatus.type === 'error' && exportStatus.details?.includes('Backend API is not running') && (
                      <button
                        onClick={handleStartBackend}
                        className="mt-2 text-xs underline hover:no-underline"
                      >
                        How to start the backend?
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowModal(false);
                  setExportStatus({ type: 'idle', message: '' });
                }}
                className="px-6 py-2.5 bg-dark-grey text-light-grey font-medium rounded-lg hover:bg-medium-grey hover:text-off-white transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleExport()}
                disabled={exportStatus.type === 'loading'}
                className={`px-6 py-2.5 font-medium rounded-lg transition-all duration-200 ${
                  exportStatus.type === 'loading'
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-primary-orange text-primary-black hover:bg-orange-hover'
                }`}
              >
                {exportStatus.type === 'loading' ? 'Exporting...' : 'Export'}
              </button>
            </div>

            {/* Help Text */}
            <div className="mt-6 pt-6 border-t border-border-grey">
              <div className="text-xs text-muted">
                <p className="mb-2">
                  <strong>Note:</strong> PDF generation requires the backend API to be running.
                </p>
                <p>
                  {selectedFormat === "pdf" && "Creates a professional PDF using LaTeX for perfect formatting."}
                  {selectedFormat === "latex" && "Exports the LaTeX source for advanced customization."}
                  {selectedFormat === "json" && "Exports raw data for integration with other tools."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* Export Button */}
      <button
        onClick={() => setShowModal(true)}
        className="px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ml-2 border border-purple-600 text-purple-400 hover:bg-purple-600/20"
      >
        Export Resume
      </button>

      {/* Render modal through portal */}
      {typeof document !== 'undefined' &&
        document.getElementById('modal-root') &&
        createPortal(modalContent, document.getElementById('modal-root')!)}
    </>
  );
}