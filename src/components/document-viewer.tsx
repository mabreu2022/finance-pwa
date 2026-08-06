'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCw, RefreshCw, ExternalLink } from 'lucide-react';

interface DocumentViewerProps {
  url: string | null;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export function DocumentViewer({ url, isOpen, onClose, title = 'Visualizar Anexo' }: DocumentViewerProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!url) return null;

  const isPdf = url.toLowerCase().endsWith('.pdf');

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[90vw] h-[85vh] flex flex-col p-4">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-2">
          <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
          <div className="flex items-center gap-2 mr-6">
            {!isPdf && (
              <>
                <Button size="icon" variant="outline" onClick={handleZoomIn} title="Aumentar Zoom">
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" onClick={handleZoomOut} title="Diminuir Zoom">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" onClick={handleRotate} title="Rotacionar">
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" onClick={handleReset} title="Redefinir">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button size="icon" variant="outline" onClick={() => window.open(url, '_blank')} title="Abrir em Nova Aba">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-muted/20 rounded-lg flex items-center justify-center relative min-h-0 mt-4">
          {isPdf ? (
            <iframe
              src={`${url}#toolbar=1`}
              className="w-full h-full border-none rounded-lg"
              title="Visualizador PDF"
            />
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center p-4 overflow-auto"
              style={{ maxHeight: 'calc(85vh - 100px)' }}
            >
              <div 
                style={{
                  transform: `scale(${scale}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease-in-out',
                  transformOrigin: 'center center',
                }}
                className="max-w-full max-h-full flex items-center justify-center"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt="Anexo"
                  className="max-w-full max-h-[70vh] object-contain shadow-md rounded border bg-white"
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
