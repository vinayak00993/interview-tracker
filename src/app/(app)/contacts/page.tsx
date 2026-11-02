import type { Metadata } from "next";
import { requireUserId } from "@/lib/session";
import { listContacts } from "@/lib/data/contacts";
import { ContactsDirectory } from "@/components/contacts/ContactsDirectory";

export const metadata: Metadata = { title: "Contacts" };

export default async function ContactsPage() {
  const userId = await requireUserId();
  const contacts = await listContacts(userId);
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-10 animate-fade-in-up">
      <ContactsDirectory contacts={contacts} />
    </div>
  );
}
