/**
 * CardDAV Contact Server (RFC 6352 / RFC 6350)
 */

export interface Contact {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  organization?: string;
  title?: string;
  notes?: string;
  created: Date;
  lastModified: Date;
}

// In-memory store for demonstration
const contactsStore = new Map<string, Contact>();

/**
 * Creates a vCard string from a Contact object (vCard 4.0 format)
 */
export function createVCard(contact: Contact): string {
  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:4.0',
    `UID:urn:uuid:${contact.id}`,
    `REV:${formatVCardDate(contact.lastModified)}`,
    `N:${escapeVCardValue(contact.lastName)};${escapeVCardValue(contact.firstName)};;;`,
    `FN:${escapeVCardValue(contact.firstName)} ${escapeVCardValue(contact.lastName)}`.trim(),
  ];

  if (contact.email) {
    lines.push(`EMAIL;TYPE=work,pref:${escapeVCardValue(contact.email)}`);
  }

  if (contact.phone) {
    lines.push(`TEL;TYPE=cell,voice;VALUE=uri:tel:${escapeVCardValue(contact.phone)}`);
  }

  if (contact.organization) {
    lines.push(`ORG:${escapeVCardValue(contact.organization)}`);
  }

  if (contact.title) {
    lines.push(`TITLE:${escapeVCardValue(contact.title)}`);
  }

  if (contact.notes) {
    lines.push(`NOTE:${escapeVCardValue(contact.notes)}`);
  }

  lines.push('END:VCARD');
  
  // RFC 6350 requires CRLF line endings
  return lines.join('\r\n') + '\r\n';
}

/**
 * Parses a vCard string into a partial Contact object
 */
export function parseVCard(vcardString: string): Partial<Contact> {
  const contact: Partial<Contact> = {};
  
  // Unfold lines (RFC 6350 requires folding long lines, which start with space on next line)
  const unfoldedStr = vcardString.replace(/\r?\n[ \t]/g, '');
  const lines = unfoldedStr.split(/\r?\n/);
  
  let inVCard = false;
  
  for (const line of lines) {
    if (line === 'BEGIN:VCARD') {
      inVCard = true;
      continue;
    }
    
    if (line === 'END:VCARD') {
      inVCard = false;
      break;
    }
    
    if (inVCard) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      
      const keyStr = line.substring(0, colonIdx);
      const value = unescapeVCardValue(line.substring(colonIdx + 1));
      
      // Handle parameters like EMAIL;TYPE=work
      const key = keyStr.split(';')[0];
      
      switch (key) {
        case 'UID':
          contact.id = value.replace(/^urn:uuid:/, '');
          break;
        case 'N':
          const parts = value.split(';');
          contact.lastName = parts[0] || '';
          contact.firstName = parts[1] || '';
          break;
        case 'FN':
          if (!contact.firstName && !contact.lastName) {
            const parts = value.split(' ');
            contact.firstName = parts[0] || '';
            contact.lastName = parts.slice(1).join(' ') || '';
          }
          break;
        case 'EMAIL':
          contact.email = value;
          break;
        case 'TEL':
          contact.phone = value.replace(/^tel:/, '');
          break;
        case 'ORG':
          contact.organization = value;
          break;
        case 'TITLE':
          contact.title = value;
          break;
        case 'NOTE':
          contact.notes = value;
          break;
      }
    }
  }
  
  return contact;
}

/**
 * Retrieves all contacts for a user
 */
export function syncContacts(userId: string): Contact[] {
  const userContacts: Contact[] = [];
  
  for (const contact of contactsStore.values()) {
    if (contact.userId === userId) {
      userContacts.push(contact);
    }
  }
  
  return userContacts;
}

/**
 * Exports all of a user's contacts as a single vCard file content
 */
export function exportAllVCards(userId: string): string {
  const contacts = syncContacts(userId);
  let result = '';
  
  for (const contact of contacts) {
    result += createVCard(contact);
  }
  
  return result;
}

/**
 * Adds or updates a contact in the store
 */
export function saveContact(contact: Contact): void {
  const now = new Date();
  
  if (!contact.id) {
    contact.id = generateId();
    contact.created = now;
  }
  
  contact.lastModified = now;
  contactsStore.set(contact.id, contact);
}

// Helpers

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + '-' + Date.now().toString(36);
}

function formatVCardDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').substring(0, 15) + 'Z';
}

function escapeVCardValue(str: string): string {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function unescapeVCardValue(str: string): string {
  if (!str) return '';
  return str
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}
