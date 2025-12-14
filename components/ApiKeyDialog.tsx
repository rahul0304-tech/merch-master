/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { KeyRound } from 'lucide-react';

interface ApiKeyDialogProps {
  onContinue: () => void;
}

const ApiKeyDialog: React.FC<ApiKeyDialogProps> = ({ onContinue }) => {
  return (
    <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-[200] p-4 animate-fade-in backdrop-blur-sm">
      <div className="glass-panel bg-white border border-zinc-200 rounded-2xl shadow-2xl max-w-lg w-full p-8 text-center flex flex-col items-center">
        <div className="bg-black/5 p-4 rounded-full mb-6 border border-black/5">
          <KeyRound className="w-12 h-12 text-black" />
        </div>
        <h2 className="text-3xl font-bold text-black mb-4">Paid API Key Required</h2>
        <p className="text-zinc-600 mb-6">
          This application uses premium AI models.
          <br/>
          You must select a <strong>Paid Google Cloud Project</strong> API key to proceed.
        </p>
        <p className="text-zinc-500 mb-8 text-sm">
          Free tier keys will not work. For more information, see{' '}
          <a
            href="https://ai.google.dev/gemini-api/docs/billing"
            target="_blank"
            rel="noopener noreferrer"
            className="text-black hover:underline font-bold"
          >
            Billing Documentation
          </a>.
        </p>
        <button
          onClick={onContinue}
          className="w-full px-6 py-3 bg-black hover:bg-zinc-800 text-white font-semibold rounded-lg transition-colors text-lg shadow-lg shadow-black/10"
        >
          Select Paid API Key
        </button>
      </div>
    </div>
  );
};

export default ApiKeyDialog;