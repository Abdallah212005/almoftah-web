'use client';

import { useState, useEffect, useMemo } from 'react';
import type { ChatMessage, Unit, Chat } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Alert, AlertDescription } from '../ui/alert';
import { useUser, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

type ChatInterfaceProps = {
  unit: Unit;
};

export function ChatInterface({ unit }: ChatInterfaceProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  
  const [chat, setChat] = useState<Chat | null>(null);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const chatId = useMemo(() => user ? `${user.uid}_${unit.id}`: null, [user, unit.id]);

  useEffect(() => {
    if (!firestore || !chatId || !isSheetOpen) return;

    const chatRef = doc(firestore, 'chats', chatId);
    const unsubscribe = onSnapshot(chatRef, 
      (doc) => {
        if (doc.exists()) {
          setChat(doc.data() as Chat);
        } else {
          setChat(null);
        }
      },
      (error) => {
        console.warn('Chat listener permission deferred:', error.message);
        setChat(null);
      }
    );

    return () => unsubscribe();
  }, [firestore, chatId, isSheetOpen]);

  const handleSend = () => {
    if (input.trim() === '' || !user || !firestore || !chatId) return;
    setIsSending(true);

    const newMessage: ChatMessage = {
      id: new Date().toISOString(),
      sender: 'user',
      text: input,
      timestamp: new Date().toISOString(),
    };

    let updatedChat: Chat;

    if (chat) {
        updatedChat = {
            ...chat,
            messages: [...chat.messages, newMessage],
            lastMessageAt: new Date().toISOString(),
            readByAdmin: false
        };
    } else {
        updatedChat = {
            id: chatId,
            unitId: unit.id,
            unitTitle: unit.title,
            userId: user.uid,
            userName: user.username || 'Anonymous',
            messages: [newMessage],
            lastMessageAt: new Date().toISOString(),
            readByAdmin: false,
        };
    }
    
    setInput('');
    setIsSending(false);

    const chatRef = doc(firestore, 'chats', chatId);
    setDocumentNonBlocking(chatRef, updatedChat, { merge: true });
  };
  
  const messages = chat?.messages || [];

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetTrigger asChild>
        <Button className="w-full" size="lg">
          <MessageSquare className="mr-2 h-5 w-5" /> Request Unit
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Chat with an Agent</SheetTitle>
          <SheetDescription>
            Ask us anything about "{unit.title}".
          </SheetDescription>
        </SheetHeader>

        {!user ? (
            <div className='flex items-center justify-center h-full'>
                <Alert>
                    <AlertDescription>Please log in to start a chat.</AlertDescription>
                </Alert>
            </div>
        ) : (
            <>
            <div className="flex-1 overflow-y-auto p-4 my-4 bg-muted/50 rounded-lg">
            <div className="space-y-4">
                {messages.length === 0 && (
                    <div className='flex items-center justify-center h-full'>
                         <p className='text-sm text-muted-foreground'>Send a message to start the conversation.</p>
                    </div>
                )}
                {messages.map((msg) => (
                <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${
                    msg.sender === 'user' ? 'justify-end' : ''
                    }`}
                >
                    {msg.sender === 'admin' && (
                    <Avatar className="h-8 w-8">
                        <AvatarFallback>A</AvatarFallback>
                    </Avatar>
                    )}
                    <div
                    className={`max-w-xs rounded-lg p-3 ${
                        msg.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card'
                    }`}
                    >
                    <p className="text-sm">{msg.text}</p>
                    </div>
                </div>
                ))}
                {isSending && (
                    <div className="flex items-end gap-2 justify-end">
                        <div className="max-w-xs rounded-lg p-3 bg-primary text-primary-foreground">
                            <Loader2 className="h-5 w-5 animate-spin"/>
                        </div>
                    </div>
                )}
            </div>
            </div>
            <SheetFooter className="mt-auto">
            <div className="flex w-full gap-2">
                <div className="flex-1">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1"
                    onKeyDown={(e) => {
                        if(e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                  />
                </div>
                <Button onClick={handleSend} disabled={isSending || !input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
            </div>
            </SheetFooter>
            </>
        )}
      </SheetContent>
    </Sheet>
  );
}
