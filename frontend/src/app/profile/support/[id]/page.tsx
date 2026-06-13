"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Send, Clock, User as UserIcon, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const ticketId = params.id as string;
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchTicket = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/support/${ticketId}`, {
        credentials: 'include'
      });
      if (res.ok) {
        setTicket(await res.json());
      } else {
        router.push('/profile/support');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    setSending(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/support/${ticketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: newMessage,
          attachments: []
        })
      });
      
      if (res.ok) {
        setNewMessage('');
        fetchTicket(); // Refetch to get the new message and potential status changes
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando ticket...</div>;
  if (!ticket) return null;

  return (
    <div style={{ paddingBottom: '60px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href="/profile/support" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', background: 'var(--input-bg)', color: 'var(--foreground)', border: '1px solid var(--card-border)' }}>
          <ArrowLeft size={20} />
        </Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '0 0 4px 0', color: 'var(--foreground)' }}>
            {ticket.subject}
          </h1>
          <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, flexWrap: 'wrap' }}>
            <span>Folio: {ticket.folio}</span>
            <span>Categoría: {ticket.category}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> Abierto el {new Date(ticket.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        <div style={{ background: `rgba(${ticket.status === 'Abierto' ? '234, 179, 8' : ticket.status === 'En Progreso' ? '59, 130, 246' : '16, 185, 129'}, 0.1)`, color: ticket.status === 'Abierto' ? '#eab308' : ticket.status === 'En Progreso' ? '#3b82f6' : '#10b981', padding: '8px 16px', borderRadius: '20px', fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase' }}>
          {ticket.status}
        </div>
      </div>

      {/* Chat Area */}
      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: '24px', overflow: 'hidden', minHeight: '60vh' }}>
        
        {/* Messages List */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', background: 'rgba(0,0,0,0.1)' }}>
          {ticket.messages.map((msg: any) => {
            const isMe = msg.user_id === user?.id;
            const isAdmin = msg.is_from_admin;
            
            return (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isAdmin ? 'flex-start' : 'flex-end', maxWidth: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', padding: '0 4px' }}>
                  {isAdmin && <ShieldAlert size={14} color="var(--primary)" />}
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {isAdmin ? 'Soporte Gamer Loot' : 'Tú'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', opacity: 0.7 }}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <div style={{ 
                  background: isAdmin ? 'var(--input-bg)' : 'var(--primary)', 
                  color: isAdmin ? 'var(--foreground)' : '#fff',
                  padding: '16px', 
                  borderRadius: isAdmin ? '4px 20px 20px 20px' : '20px 4px 20px 20px',
                  maxWidth: '85%',
                  border: isAdmin ? '1px solid var(--card-border)' : 'none',
                  boxShadow: isAdmin ? 'none' : '0 4px 12px rgba(139, 92, 246, 0.3)',
                  lineHeight: '1.5'
                }}>
                  {msg.message.split('\n').map((line: string, i: number) => (
                    <span key={i}>{line}<br/></span>
                  ))}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        {ticket.status !== 'Cerrado' && ticket.status !== 'Resuelto' ? (
          <form onSubmit={handleSendMessage} style={{ padding: '20px', borderTop: '1px solid var(--card-border)', background: 'var(--background)', display: 'flex', gap: '12px' }}>
            <input 
              type="text" 
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Escribe tu mensaje..."
              style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--foreground)', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'} 
              onBlur={(e) => e.target.style.borderColor = 'var(--card-border)'}
            />
            <button 
              type="submit" 
              disabled={sending || !newMessage.trim()}
              className="btn-primary hover-card"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '16px', padding: 0, opacity: (sending || !newMessage.trim()) ? 0.5 : 1 }}
            >
              <Send size={20} />
            </button>
          </form>
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: 700 }}>
            Este ticket ha sido cerrado. Si tienes otra duda, por favor abre un nuevo ticket.
          </div>
        )}
      </div>
    </div>
  );
}
