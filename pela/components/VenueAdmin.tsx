import { SetStateAction, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Copy, Check, Download, Music } from 'lucide-react';
import { motion } from 'motion/react';

interface VenueAdminProps {
  venueId?: string;
}

export function VenueAdmin({ venueId: initialVenueId }: VenueAdminProps) {
  const [venueId, setVenueId] = useState(initialVenueId || '');
  const [venueName, setVenueName] = useState('');
  const [copied, setCopied] = useState(false);

  const generateVenueId = () => {
    const id = `venue-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    setVenueId(id);
  };

  const venueUrl = venueId ? `${window.location.origin}/?venue=${venueId}` : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(venueUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById('qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `hype-queue-${venueId}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl mb-2 bg-gradient-to-r from-[#1DB954] to-purple-500 bg-clip-text text-transparent">
          Venue Admin
        </h1>
        <p className="text-gray-400">Loo QR-kood oma baari/klubi jaoks</p>
      </motion.div>

      <Card className="bg-[#1a1a1a] border-gray-800 p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Koha nimi (valikuline)</label>
            <Input
              value={venueName}
              onChange={(e: { target: { value: SetStateAction<string>; }; }) => setVenueName(e.target.value)}
              placeholder="nt. Club XYZ"
              className="bg-[#0e0e0e] border-gray-700"
            />
          </div>

          {!venueId ? (
            <Button
              onClick={generateVenueId}
              className="w-full bg-gradient-to-r from-[#1DB954] to-[#1ed760] hover:from-[#1ed760] hover:to-[#1DB954]"
            >
              <Music className="w-4 h-4 mr-2" />
              Genereeri uus venue ID
            </Button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Venue ID</label>
                <div className="bg-[#0e0e0e] border border-gray-700 rounded-lg p-3 font-mono text-sm break-all">
                  {venueId}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Venue URL</label>
                <div className="flex gap-2">
                  <Input
                    value={venueUrl}
                    readOnly
                    className="bg-[#0e0e0e] border-gray-700 font-mono text-sm"
                  />
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    className="border-gray-700"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg">
                <QRCodeSVG
                  id="qr-code"
                  value={venueUrl}
                  size={256}
                  level="H"
                  includeMargin
                  className="mx-auto"
                />
                {venueName && (
                  <p className="text-center mt-4 text-black font-semibold">{venueName}</p>
                )}
              </div>

              <Button
                onClick={handleDownloadQR}
                variant="outline"
                className="w-full border-gray-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Lae QR-kood alla (PNG)
              </Button>

              <div className="bg-[#0e0e0e] border border-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-2 text-[#1DB954]">📱 Kuidas kasutada:</h3>
                <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
                  <li>Prindi või kuva QR-kood oma baaris/klubis</li>
                  <li>Külastajad skaneerivad QR-koodi oma telefoniga</li>
                  <li>Avatakse Hype Queue sinu venue'ga</li>
                  <li>Külastajad saavad hääletada ja lisada lugusid</li>
                </ol>
              </div>

              <Button
                onClick={() => {
                  setVenueId('');
                  setVenueName('');
                }}
                variant="ghost"
                className="w-full text-gray-500"
              >
                Loo uus venue
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
