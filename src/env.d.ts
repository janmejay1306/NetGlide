/// <reference types="vite/client" />

import type * as React from 'react';

declare global {
  interface HTMLWebViewElement extends HTMLElement {
    loadURL?: (url: string) => void;
    getURL?: () => string;
  }

  namespace JSX {
    interface IntrinsicElements {
      webview: React.DetailedHTMLProps<React.HTMLAttributes<HTMLWebViewElement>, HTMLWebViewElement> & {
        src?: string;
        partition?: string;
        allowpopups?: boolean;
      };
    }
  }
}

export {};
