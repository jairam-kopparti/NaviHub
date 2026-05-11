'use client';

import React, { useState, useEffect } from 'react';
import { transform } from 'sucrase';

interface WidgetRendererProps {
  code: string;
  onAction?: (cmd: string | undefined, url?: string) => void;
}

export default function WidgetRenderer({
  code,
  onAction,
}: WidgetRendererProps) {
  const [error, setError] = useState<string | null>(null);
  const [component, setComponent] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    try {
      const trimmed = code?.trim?.() ?? '';
      // If the “code” payload is actually HTML (starts with `<`), compiling will fail.
      if (trimmed.startsWith('<')) {
        const preview = trimmed.slice(0, 200).replace(/\s+/g, ' ');
        throw new Error(`Widget payload looks like HTML, cannot compile. Preview: ${preview}`);
      }

      // Transpile JSX to JavaScript using Sucrase
      let transpiledCode: string;
      try {
        transpiledCode = transform(code, {
          transforms: ['jsx', 'typescript'],
        }).code;
      } catch (transpileErr) {
        const msg = transpileErr instanceof Error ? transpileErr.message : String(transpileErr);
        throw new Error(`Failed to transpile widget code: ${msg}`);
      }

      // Sandbox: only allow access to React and safe functions
      // The widget code should define ChatWidget or export a default component
      // We wrap in a way that doesn't conflict with ChatWidget declarations
      const wrappedCode = `
        const __widgetOnAction = onAction;
        ${transpiledCode}

        // Return component - look for ChatWidget or exports.default
        if (typeof ChatWidget === 'function') {
          return ChatWidget;
        } else if (typeof exports !== 'undefined' && typeof exports.default === 'function') {
          return exports.default;
        } else {
          throw new Error('Widget code must export a valid React component');
        }
      `;


      // Use Function constructor for eval with sandboxing
      // eslint-disable-next-line no-new-func
      const widgetFactory = new Function('React', 'onAction', wrappedCode);

      // Call the factory with React and the onAction callback to make it available
      const WidgetComponent = widgetFactory(React, onAction);

      if (typeof WidgetComponent === 'function') {
        setComponent(() => (props: any) => <WidgetComponent {...props} onAction={onAction} />);
      } else {
        throw new Error('Widget did not export a valid React component');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Failed to load widget: ${msg}`);
      console.error('Widget compilation error:', err);
    }
  }, [code, onAction]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-300 rounded-lg p-3 text-xs text-red-700">
        <div className="font-semibold">Widget Error</div>
        <div>{error}</div>
      </div>
    );
  }

  if (!component) {
    return (
      <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 text-xs text-gray-700">
        Compiling widget...
      </div>
    );
  }

  try {
    const Component = component;
    return (
      <div className="my-3">
        <Component
          onAction={(cmd: string, url?: string) => {
            if (onAction) onAction(cmd, url);
          }}
        />
      </div>
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return (
      <div className="bg-red-50 border border-red-300 rounded-lg p-3 text-xs text-red-700 my-3">
        <div className="font-semibold">Widget Render Error</div>
        <div>{msg}</div>
      </div>
    );
  }
}
