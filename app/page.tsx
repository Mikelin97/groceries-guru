import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';

export default async function RootPage() {
  const user = await getUser();
  
  if (user) {
    // User is authenticated, redirect to chat
    redirect('/chat');
  } else {
    // User is not authenticated, redirect to landing page
    redirect('/signin');
  }
}