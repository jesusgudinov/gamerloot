import React from 'react';
import { X } from 'lucide-react';

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  saveAddress: boolean;
  setSaveAddress: (val: boolean) => void;
  onSubmit: () => void;
}

export default function AddressModal({ isOpen, onClose, formData, handleInputChange, saveAddress, setSaveAddress, onSubmit }: AddressModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-fade-in-up">
        <div className="flex justify-between items-center p-6 border-b border-white/5">
          <h2 className="text-xl font-bold text-white bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            Agregar Nueva Dirección
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Nombre Completo</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all" placeholder="Ej. Juan Pérez" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Teléfono</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all" placeholder="10 dígitos" required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-1">Calle</label>
              <input type="text" name="street" value={formData.street} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all" placeholder="Nombre de la calle" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Número Exterior / Interior</label>
              <input type="text" name="exteriorNumber" value={formData.exteriorNumber} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all" placeholder="Ej. 123 Int 4" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Colonia</label>
              <input type="text" name="neighborhood" value={formData.neighborhood} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all" placeholder="Nombre de la colonia" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Código Postal</label>
              <input type="text" name="zip" value={formData.zip} onChange={handleInputChange} maxLength={5} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all" placeholder="5 dígitos" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Ciudad</label>
              <input type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all" placeholder="Ej. Guadalajara" required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-1">Estado</label>
              <input type="text" name="state" value={formData.state} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all" placeholder="Ej. Jalisco" required />
            </div>
          </div>
          
          <div className="mt-4 flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
            <input 
              type="checkbox" 
              id="saveAddress" 
              checked={saveAddress} 
              onChange={(e) => setSaveAddress(e.target.checked)}
              className="w-5 h-5 rounded border-gray-600 text-purple-600 focus:ring-purple-500 bg-black/20"
            />
            <label htmlFor="saveAddress" className="text-gray-300 cursor-pointer select-none">
              Guardar dirección para futuras compras
            </label>
          </div>
        </div>
        
        <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-black/20">
          <button type="button" onClick={onClose} className="px-6 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
            Cancelar
          </button>
          <button type="button" onClick={onSubmit} className="px-8 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium hover:from-purple-500 hover:to-indigo-500 transition-all transform hover:-translate-y-0.5 shadow-lg shadow-purple-500/25">
            Confirmar Dirección
          </button>
        </div>
      </div>
    </div>
  );
}
