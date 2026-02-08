
'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, PlusCircle, X, Save, Eye, EyeOff, Lock } from 'lucide-react';
import type { AdminUser } from '@/lib/definitions';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';

const formSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['admin', 'superadmin']),
  tasks: z.array(z.object({ value: z.string().min(1, 'Task cannot be empty.') })).optional(),
  visible: z.boolean(),
});

type UserFormProps = {
  user?: AdminUser | null;
  onSave: (values: AdminUser, password?: string) => Promise<void>;
  isSaving: boolean;
};

export function UserForm({ user, onSave, isSaving }: UserFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: user?.username || '',
      email: user?.email || '',
      password: user?.password || '',
      role: (user?.role as 'admin' | 'superadmin') || 'admin',
      tasks: Array.isArray(user?.tasks) ? user.tasks.map(task => ({ value: task })) : [],
      visible: user?.visible ?? true,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'tasks',
  });

  useEffect(() => {
    if (user) {
      form.reset({
        username: user.username || '',
        email: user.email || '',
        password: user.password || '',
        role: (user.role as 'admin' | 'superadmin') || 'admin',
        tasks: Array.isArray(user.tasks) ? user.tasks.map(task => ({ value: task })) : [],
        visible: user.visible ?? true,
      });
    } else {
      form.reset({
        username: '',
        email: '',
        password: '',
        role: 'admin',
        tasks: [],
        visible: true,
      });
    }
  }, [user, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const passwordValue = values.password;
    
    if (!user && (!passwordValue || passwordValue.length < 6)) {
      form.setError('password', { message: 'Password must be at least 6 characters for new accounts.' });
      return;
    }

    const tasksArray = values.tasks?.map(t => t.value).filter(Boolean) || [];
    
    const newUserData: AdminUser = {
      id: user?.id || '', 
      username: values.username,
      email: values.email,
      password: passwordValue,
      role: values.role as 'admin' | 'superadmin',
      tasks: tasksArray,
      visible: values.visible,
    };

    await onSave(newUserData, passwordValue);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-8">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Full Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Professional Email</FormLabel>
                <FormControl>
                  <Input type="email" disabled={!!user} placeholder="Email Address" {...field} />
                </FormControl>
                 <FormDescription>{user ? "Email is fixed for authentication." : "Enter a valid employee email."}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Lock className="h-4 w-4" /> Login Password
                </FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input type={showPassword ? "text" : "password"} placeholder="Set password" {...field} />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Permissions</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select access level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="admin">Admin (Personal data only)</SelectItem>
                    <SelectItem value="superadmin">Superadmin (Company-wide)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="space-y-4 rounded-xl border p-4 bg-muted/30">
          <div className="flex items-center justify-between">
            <FormLabel className="text-sm font-semibold">Daily Goals</FormLabel>
            <Badge variant="outline" className="text-[10px] uppercase font-bold">Tasks</Badge>
          </div>
          <div className="space-y-3">
            {fields.map((field, index) => (
                <FormField
                key={field.id}
                control={form.control}
                name={`tasks.${index}.value`}
                render={({ field }) => (
                    <FormItem>
                    <div className="flex items-center gap-2">
                        <FormControl>
                        <Input className="bg-background" placeholder={`Task #${index + 1}`} {...field} />
                        </FormControl>
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                        <X className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                    <FormMessage />
                    </FormItem>
                )}
                />
            ))}
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full bg-background border-dashed"
                onClick={() => append({ value: '' })}
            >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Task
            </Button>
          </div>
        </div>

        <FormField
            control={form.control}
            name="visible"
            render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 bg-primary/5">
                <div className="space-y-0.5">
                    <FormLabel className="text-base">Account Active</FormLabel>
                    <FormDescription>
                    Disable to revoke access immediately.
                    </FormDescription>
                </div>
                <FormControl>
                    <Switch
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                    disabled={user?.email === 'abdallah@almoftah.com'} 
                    />
                </FormControl>
                </FormItem>
            )}
        />
        <Button type="submit" className="w-full h-12 text-lg font-bold shadow-lg" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Saving Account...
            </>
          ) : (
            <>
              <Save className="mr-2 h-5 w-5" />
              {user ? 'Update Profile' : 'Activate Admin'}
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
