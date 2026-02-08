'use client';

import { useState, useEffect, useRef } from 'react';
import type { Chat, ChatMessage, AdminUser } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, MessageSquare, Trash2, AlertCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useUser, useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, orderBy, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

function ChatListItem({ 
  chat, 
  onSelect, 
  isSelected, 
  onDelete, 
  isSuperAdmin 
}: { 
  chat: Chat, 
  onSelect: () => void, 
  isSelected: boolean,
  onDelete: (e: React.MouseEvent) => void,
  isSuperAdmin: boolean
}) {
  const lastMessage = chat.messages[chat.messages.length - 1];
  return (
    <div className="relative group">
      <button
        onClick={onSelect}
        className={`w-full text-left p-3 hover:bg-muted/50 transition-colors rounded-lg ${isSelected ? 'bg-muted' : ''}`}
      >
        <div className="flex justify-between items-start">
          <div className='flex-1 pr-6'>
              <p className="font-semibold text-sm">{chat.userName}</p>
              <p className="text-xs text-muted-foreground truncate">{chat.unitTitle}</p>
          </div>
          {!chat.readByAdmin && <Badge variant="destructive" className='h-5'>New</Badge>}
        </div>
        <p className="text-xs text-muted-foreground mt-1 truncate">
          {lastMessage?.sender === 'user' ? `${chat.userName}: ` : 'You: '}{lastMessage?.text}
        </p>
        {chat.lastMessageAt && (
          <p className="text-xs text-muted-foreground text-right mt-1">
            {formatDistanceToNow(new Date(chat.lastMessageAt), { addSuffix: true })}
          </p>
        )}
      </button>
      {isSuperAdmin && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export default function ChatPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const isAdmin = user && user.role !== 'user';
  const isActive = isAdmin && (user.role === 'superadmin' || (user as AdminUser).visible !== false);
  const isSuperAdmin = user?.role === 'superadmin';

  const chatsQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading || !isActive || !user) return null;
    return query(collection(firestore, 'chats'), orderBy('lastMessageAt', 'desc'));
  }, [firestore, isUserLoading, user, isActive]);

  const { data: chats, isLoading } = useCollection<Chat>(chatsQuery);

  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [reply, setReply] = useState('');
  const [deleteChatId, setDeleteChatId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
      if (selectedChat && scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
      }
  }, [selectedChat, selectedChat?.messages.length]);


  const handleSelectChat = (chat: Chat) => {
    if (firestore && !chat.readByAdmin) {
      const chatRef = doc(firestore, 'chats', chat.id);
      setDocumentNonBlocking(chatRef, { readByAdmin: true }, { merge: true });
    }
    setSelectedChat(chat);
  };

  const handleSendReply = () => {
    if (!reply.trim() || !selectedChat || !user || !firestore) return;
    
    setIsSending(true);
    const newMessage: ChatMessage = {
      id: new Date().toISOString(),
      sender: 'admin',
      text: reply,
      timestamp: new Date().toISOString(),
    };
    
    const updatedMessages = [...selectedChat.messages, newMessage];
    const updatedChatData = {
      messages: updatedMessages,
      lastMessageAt: new Date().toISOString(),
      readByAdmin: true,
    };

    const chatRef = doc(firestore, 'chats', selectedChat.id);
    setDocumentNonBlocking(chatRef, updatedChatData, { merge: true });

    setReply('');
    setIsSending(false);
  }

  const handleDeleteChat = (chatId: string) => {
    if (!firestore || !isSuperAdmin) return;
    deleteDocumentNonBlocking(doc(firestore, 'chats', chatId));
    if (selectedChat?.id === chatId) {
      setSelectedChat(null);
    }
    toast({
      title: "Conversation Deleted",
      description: "The chat history has been permanently removed.",
    });
    setDeleteChatId(null);
  }

  if (!isActive && !isUserLoading) {
      return (
          <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-bold">Access Restricted</h2>
              <p className="text-muted-foreground">You do not have permission to view the chat system.</p>
          </div>
      );
  }

  return (
    <div className="h-full">
      <Card className="h-[calc(100vh-8rem)]">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 h-full">
          <div className="col-span-1 border-r flex flex-col h-full">
            <div className="p-4 border-b">
              <CardTitle>Inbox</CardTitle>
              <CardDescription>{chats?.length ?? 0} active conversations</CardDescription>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {(isLoading || isUserLoading) && Array.from({length: 5}).map((_, i) => <Skeleton key={i} className='h-20 w-full' />)}
                {chats && chats.length > 0 ? chats?.map((chat) => (
                  <ChatListItem
                    key={chat.id}
                    chat={chat}
                    isSuperAdmin={isSuperAdmin}
                    onSelect={() => handleSelectChat(chat)}
                    isSelected={selectedChat?.id === chat.id}
                    onDelete={(e) => {
                      e.stopPropagation();
                      setDeleteChatId(chat.id);
                    }}
                  />
                )) : (
                  !isLoading && !isUserLoading && <p className='p-4 text-center text-sm text-muted-foreground'>No chats yet.</p>
                )}
              </div>
            </ScrollArea>
          </div>
          <div className="md:col-span-2 lg:col-span-3 flex flex-col h-full bg-muted/10">
            {selectedChat ? (
              <>
                <div className="p-4 border-b bg-background flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{selectedChat.userName}</h3>
                    <p className="text-sm text-muted-foreground">{selectedChat.unitTitle}</p>
                  </div>
                  {isSuperAdmin && (
                    <Button variant="ghost" size="icon" onClick={() => setDeleteChatId(selectedChat.id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  )}
                </div>
                <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                  <div className="space-y-4">
                    {selectedChat.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex items-end gap-2 ${msg.sender === 'admin' ? 'justify-end' : ''}`}
                      >
                        {msg.sender === 'user' && (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{selectedChat.userName.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`max-w-md rounded-lg p-3 ${
                            msg.sender === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-background shadow-sm border'
                          }`}
                        >
                          <p className="text-sm">{msg.text}</p>
                          <p className={`text-[10px] mt-1 ${msg.sender === 'admin' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                             {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                         {msg.sender === 'admin' && (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>A</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t bg-background mt-auto">
                  <div className="flex w-full gap-2">
                    <Textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Type your reply..."
                      className="flex-1 min-h-[80px]"
                      onKeyDown={(e) => {
                        if(e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendReply();
                        }
                      }}
                      disabled={isSending}
                    />
                    <Button onClick={handleSendReply} className="h-auto" disabled={isSending || !reply.trim()}>
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                      <MessageSquare className="h-10 w-10 text-primary" />
                  </div>
                  <CardTitle className="text-2xl mb-2">Select a Conversation</CardTitle>
                  <CardDescription className="max-w-xs">
                      Choose a chat from the list on the left to view messages and respond to inquiries.
                  </CardDescription>
              </div>
            )}
          </div>
        </div>
      </Card>

      <AlertDialog open={!!deleteChatId} onOpenChange={(open) => !open && setDeleteChatId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Delete Conversation?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all messages in this chat conversation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteChatId && handleDeleteChat(deleteChatId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
