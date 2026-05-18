import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Upload, X, Trash2, Maximize2, FileText } from 'lucide-react';
import { cn } from '../lib/utils';

interface Receipt {
  id: string;
  image: string;
  date: string;
  title: string;
  description?: string;
  amount?: number;
}

export function ReceiptManager({ onAddDebt }: { onAddDebt?: (debt: any) => void }) {
  const [receipts, setReceipts] = useState<Receipt[]>(() => {
    try {
      const saved = localStorage.getItem('finans_receipts');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const saveReceipts = (updated: Receipt[]) => {
    setReceipts(updated);
    localStorage.setItem('finans_receipts', JSON.stringify(updated));
  };

  const updateReceiptDetails = (id: string, description: string, amount: string) => {
    const numAmount = parseFloat(amount.replace(',', '.'));
    const updated = receipts.map(r => 
      r.id === id ? { ...r, description, amount: isNaN(numAmount) ? undefined : numAmount } : r
    );
    saveReceipts(updated);
    if (selectedReceipt?.id === id) {
      setSelectedReceipt({ ...selectedReceipt, description, amount: isNaN(numAmount) ? undefined : numAmount });
    }
  };

  const analyzeReceipt = async (receiptId: string, image: string) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      });
      const data = await response.json();
      
      if (data.error) throw new Error(data.error);

      // Update the receipt with inferred data
      const updated = receipts.map(r => 
        r.id === receiptId ? { 
          ...r, 
          description: data.description || r.description, 
          amount: Number(data.amount) || r.amount 
        } : r
      );
      saveReceipts(updated);

      if (window.confirm(`Nota processada:\nDescrição: ${data.description}\nValor: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(data.amount) || 0)}\n\nDeseja registrar esta dívida agora?`)) {
        const debtData = {
          description: String(data.description || 'Gasto sem descrição'),
          amount: Number(data.amount) || 0,
          category: String(data.category || 'Outros'),
          dueDate: data.dueDate ? String(data.dueDate) : new Date().toISOString().split('T')[0],
          status: 'pending' as const,
        };

        if (onAddDebt) {
          onAddDebt(debtData);
          alert("Dívida registrada com sucesso!");
        } else {
          const savedDebts = JSON.parse(localStorage.getItem('finans_debts') || '[]');
          const newDebt = {
            ...debtData,
            id: Math.random().toString(36).substring(2, 11),
            createdAt: new Date().toISOString(),
          };
          localStorage.setItem('finans_debts', JSON.stringify([newDebt, ...savedDebts]));
          window.location.reload();
        }
      }
    } catch (err) {
      console.error("AI Analysis failed:", err);
      alert("Não foi possível analisar a nota com IA.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const registerAsDebt = (receipt: Receipt) => {
    if (!receipt.description || !receipt.amount) {
      alert("Por favor, preencha a descrição e o valor antes de enviar.");
      return;
    }

    const debtData = {
      description: receipt.description,
      amount: receipt.amount,
      category: 'Outros',
      dueDate: new Date().toISOString().split('T')[0],
      status: 'pending' as const,
    };

    if (onAddDebt) {
      onAddDebt(debtData);
      alert("Dívida enviada e registrada com sucesso!");
    } else {
      const savedDebts = JSON.parse(localStorage.getItem('finans_debts') || '[]');
      const newDebt = {
        ...debtData,
        id: Math.random().toString(36).substring(2, 11),
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('finans_debts', JSON.stringify([newDebt, ...savedDebts]));
      alert("Dívida enviada e registrada com sucesso!");
      window.location.reload();
    }
  };

  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera: ", err);
      setIsCameraOpen(false);
      alert("Não foi possível acessar a câmera.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  };

  const addReceipt = (image: string) => {
    const id = Math.random().toString(36).substring(2, 11);
    const newReceipt: Receipt = {
      id,
      image,
      date: new Date().toISOString(),
      title: `Nota ${new Date().toLocaleDateString('pt-BR')}`,
    };
    saveReceipts([newReceipt, ...receipts]);
    return id;
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg', 0.7);
        const receiptId = addReceipt(imageData);
        stopCamera();
        if (window.confirm("Deseja analisar esta nota com IA para extrair os dados automaticamente?")) {
          await analyzeReceipt(receiptId, imageData);
        }
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const image = reader.result as string;
        const receiptId = addReceipt(image);
        if (window.confirm("Deseja analisar esta nota com IA para extrair os dados automaticamente?")) {
          await analyzeReceipt(receiptId, image);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const deleteReceipt = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    saveReceipts(receipts.filter(r => r.id !== id));
    if (selectedReceipt?.id === id) setSelectedReceipt(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notas Fiscais</h2>
          <p className="text-xs uppercase tracking-widest opacity-40 font-bold">Arquivo digital de comprovantes</p>
        </div>
        
        <div className="flex gap-2">
          <label className="glass p-2.5 rounded-2xl cursor-pointer hover:bg-white/10 transition-all flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
            <Upload size={16} className="text-accent" />
            <span className="hidden sm:inline">Upload</span>
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
          
          <button 
            onClick={startCamera}
            className="bg-accent p-2.5 rounded-2xl hover:brightness-110 transition-all flex items-center gap-2 text-sm font-bold uppercase tracking-widest"
          >
            <Camera size={16} />
            <span className="hidden sm:inline">Câmera</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {isAnalyzing && (
          <div className="col-span-1 aspect-[3/4] rounded-3xl overflow-hidden glass border border-accent flex flex-col items-center justify-center gap-4 animate-pulse">
            <div className="w-10 h-10 rounded-full border-4 border-accent border-t-transparent animate-spin" />
            <p className="text-xs font-black uppercase tracking-widest text-accent">Analisando...</p>
          </div>
        )}
        {receipts.map((r, index) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => setSelectedReceipt(r)}
            className="group relative aspect-[3/4] rounded-3xl overflow-hidden glass cursor-pointer border border-white/5"
          >
            <img src={r.image} alt={r.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="absolute bottom-4 left-4 right-4 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all translate-y-0 sm:translate-y-2 sm:group-hover:translate-y-0">
              <p className="text-xs font-bold uppercase tracking-widest truncate">{r.description || r.title}</p>
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs opacity-40 uppercase tracking-widest">
                  {new Date(r.date).toLocaleDateString('pt-BR')}
                </p>
                {r.amount && (
                  <p className="text-xs font-bold text-accent">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.amount)}
                  </p>
                )}
              </div>
            </div>

            <button 
              onClick={(e) => deleteReceipt(r.id, e)}
              className="absolute top-4 right-4 p-2 bg-rose-500/20 text-rose-400 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500 hover:text-white"
            >
              <Trash2 size={16} />
            </button>
            
            <div className="absolute top-4 left-4 p-2 glass rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
              <Maximize2 size={16} className="text-white/60" />
            </div>
          </motion.div>
        ))}

        {receipts.length === 0 && (
          <div className="col-span-full py-20 glass rounded-[40px] flex flex-col items-center justify-center border border-dashed border-white/10">
            <FileText size={48} className="opacity-10 mb-4" />
            <p className="opacity-30 text-base font-medium">Nenhuma nota registrada</p>
            <p className="text-xs opacity-20 uppercase tracking-widest mt-1">Sincronize seus comprovantes aqui</p>
          </div>
        )}
      </div>

      {/* Camera Interface Modal */}
      <AnimatePresence>
        {isCameraOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-xl"
          >
            <div className="relative w-full max-w-xl aspect-[3/4] overflow-hidden rounded-[40px] glass border border-white/10">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              
              <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none" />
              
              <button 
                onClick={stopCamera}
                className="absolute top-8 right-8 p-4 glass rounded-full hover:bg-white/10"
              >
                <X size={24} />
              </button>

              <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                <button 
                  onClick={capturePhoto}
                  className="w-20 h-20 rounded-full bg-white flex items-center justify-center group active:scale-90 transition-transform"
                >
                  <div className="w-16 h-16 rounded-full border-4 border-black/10 group-hover:border-black/20" />
                </button>
              </div>
            </div>
            
            <p className="mt-8 text-sm font-bold uppercase tracking-[0.5em] opacity-30">Posicione a nota fiscal dentro da área</p>
            <canvas ref={canvasRef} className="hidden" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Preview / Editor Modal */}
      <AnimatePresence>
        {selectedReceipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/98 flex flex-col md:flex-row items-center justify-center p-4 md:p-8 overflow-y-auto"
          >
            <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-start">
              {/* Photo View */}
              <div className="relative group">
                <motion.img 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  src={selectedReceipt.image} 
                  className="w-full h-auto max-h-[70vh] object-contain rounded-3xl shadow-2xl border border-white/10"
                />
                <button 
                  onClick={() => setSelectedReceipt(null)}
                  className="absolute -top-4 -right-4 p-4 glass rounded-full hover:bg-white/10 transition-all z-10"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Form Side */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass p-8 rounded-[40px] space-y-6"
              >
                <div>
                  <h3 className="text-2xl font-bold tracking-tight">Detalhes da Nota</h3>
                  <p className="text-xs uppercase tracking-widest opacity-40 font-bold mt-1">Vincule esta imagem a um débito</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold tracking-widest opacity-40 ml-1">Descrição do Débito</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Almoço Restaurante"
                      value={selectedReceipt.description || ''}
                      onChange={(e) => updateReceiptDetails(selectedReceipt.id, e.target.value, selectedReceipt.amount?.toString() || '')}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:ring-2 focus:ring-accent/50 outline-none transition-all placeholder:opacity-20 text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold tracking-widest opacity-40 ml-1">Valor</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-base">R$</span>
                      <input 
                        type="text" 
                        placeholder="0,00"
                        value={selectedReceipt.amount?.toString().replace('.', ',') || ''}
                        onChange={(e) => updateReceiptDetails(selectedReceipt.id, selectedReceipt.description || '', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-accent/50 outline-none transition-all placeholder:opacity-20 text-base"
                      />
                    </div>
                  </div>
                  <div className="pt-4 flex flex-col gap-3">
                  <button 
                    onClick={() => registerAsDebt(selectedReceipt)}
                    className="w-full bg-accent p-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-2"
                  >
                    <Upload size={16} />
                    Enviar e Registrar Débito
                  </button>
                  
                  <button 
                    onClick={() => {
                      if (!selectedReceipt.image) return;
                      analyzeReceipt(selectedReceipt.id, selectedReceipt.image);
                    }}
                    className="w-full border border-white/10 p-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-white/5 transition-all text-white/60 flex items-center justify-center gap-2"
                  >
                    <div className={cn("w-2 h-2 rounded-full", isAnalyzing ? "bg-accent animate-ping" : "bg-white/20")} />
                    Tentar análise com IA
                  </button>
 
                  <button 
                    onClick={() => {
                      if (window.confirm("Deseja realmente apagar esta nota fiscal?")) {
                        saveReceipts(receipts.filter(r => r.id !== selectedReceipt.id));
                        setSelectedReceipt(null);
                      }
                    }}
                    className="w-full border border-rose-500/20 p-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-rose-500/10 transition-all text-rose-500 flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} />
                    Apagar Nota Fiscal
                  </button>
                </div>
                </div>
 
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[11px] leading-relaxed opacity-40 text-center uppercase tracking-widest">
                    As informações preenchidas acima serão salvas automaticamente nesta nota fiscal.
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
