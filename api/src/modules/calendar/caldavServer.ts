/**
 * CalDAV Calendar Server (RFC 4791 / RFC 5545)
 */

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  attendees: string[];
  organizer?: string;
  created: Date;
  lastModified: Date;
}

// In-memory store for demonstration
const eventsStore = new Map<string, CalendarEvent>();

/**
 * Creates a new calendar event
 */
export function createEvent(
  userId: string,
  title: string,
  startTime: Date,
  endTime: Date,
  attendees: string[] = []
): CalendarEvent {
  const id = generateId();
  const now = new Date();
  
  const event: CalendarEvent = {
    id,
    userId,
    title,
    startTime,
    endTime,
    attendees,
    created: now,
    lastModified: now
  };
  
  eventsStore.set(id, event);
  return event;
}

/**
 * Lists events for a user within an optional time range
 */
export function listEvents(
  userId: string, 
  rangeStart?: Date, 
  rangeEnd?: Date
): CalendarEvent[] {
  const userEvents: CalendarEvent[] = [];
  
  for (const event of eventsStore.values()) {
    if (event.userId === userId) {
      if (rangeStart && event.endTime < rangeStart) continue;
      if (rangeEnd && event.startTime > rangeEnd) continue;
      
      userEvents.push(event);
    }
  }
  
  return userEvents;
}

/**
 * Parses an iCalendar (ICS) formatted string into event objects
 */
export function parseICS(icsString: string): Partial<CalendarEvent>[] {
  const events: Partial<CalendarEvent>[] = [];
  const lines = icsString.split(/\r?\n/);
  
  let currentEvent: Partial<CalendarEvent> | null = null;
  let inEvent = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = { attendees: [] };
      continue;
    }
    
    if (line === 'END:VEVENT') {
      if (currentEvent) events.push(currentEvent);
      inEvent = false;
      currentEvent = null;
      continue;
    }
    
    if (inEvent && currentEvent) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      
      const keyStr = line.substring(0, colonIdx);
      const value = line.substring(colonIdx + 1);
      
      // Handle parameters like DTSTART;TZID=America/New_York
      const key = keyStr.split(';')[0];
      
      switch (key) {
        case 'UID':
          currentEvent.id = value;
          break;
        case 'SUMMARY':
          currentEvent.title = value;
          break;
        case 'DESCRIPTION':
          // Simplified, doesn't handle line folding
          currentEvent.description = value.replace(/\\n/g, '\n');
          break;
        case 'LOCATION':
          currentEvent.location = value;
          break;
        case 'DTSTART':
          currentEvent.startTime = parseICSDate(value);
          break;
        case 'DTEND':
          currentEvent.endTime = parseICSDate(value);
          break;
        case 'ATTENDEE':
          // Extract mailto if present
          const mailtoMatch = value.match(/mailto:(.+)/i);
          if (mailtoMatch && currentEvent.attendees) {
            currentEvent.attendees.push(mailtoMatch[1]);
          } else if (currentEvent.attendees) {
            currentEvent.attendees.push(value);
          }
          break;
        case 'ORGANIZER':
          const orgMatch = value.match(/mailto:(.+)/i);
          if (orgMatch) currentEvent.organizer = orgMatch[1];
          break;
      }
    }
  }
  
  return events;
}

/**
 * Generates an iCalendar (ICS) formatted string from an event
 */
export function generateICS(event: CalendarEvent): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mailops//CalDAV Server//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${event.id}`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `CREATED:${formatICSDate(event.created)}`,
    `LAST-MODIFIED:${formatICSDate(event.lastModified)}`,
    `DTSTART:${formatICSDate(event.startTime)}`,
    `DTEND:${formatICSDate(event.endTime)}`,
    `SUMMARY:${escapeICSString(event.title)}`
  ];
  
  if (event.description) {
    lines.push(`DESCRIPTION:${escapeICSString(event.description)}`);
  }
  
  if (event.location) {
    lines.push(`LOCATION:${escapeICSString(event.location)}`);
  }
  
  if (event.organizer) {
    lines.push(`ORGANIZER:mailto:${event.organizer}`);
  }
  
  if (event.attendees && event.attendees.length > 0) {
    for (const attendee of event.attendees) {
      lines.push(`ATTENDEE:mailto:${attendee}`);
    }
  }
  
  lines.push('END:VEVENT');
  lines.push('END:VCALENDAR');
  
  // RFC 5545 requires CRLF line endings
  return lines.join('\r\n') + '\r\n';
}

// Helpers

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + '-' + Date.now().toString(36);
}

function parseICSDate(dateStr: string): Date {
  // Simplistic parser for YYYYMMDDTHHMMSSZ format
  if (dateStr.length === 16 && dateStr.endsWith('Z')) {
    const y = parseInt(dateStr.substring(0, 4));
    const m = parseInt(dateStr.substring(4, 6)) - 1;
    const d = parseInt(dateStr.substring(6, 8));
    const h = parseInt(dateStr.substring(9, 11));
    const min = parseInt(dateStr.substring(11, 13));
    const s = parseInt(dateStr.substring(13, 15));
    return new Date(Date.UTC(y, m, d, h, min, s));
  }
  // Fallback
  return new Date(dateStr);
}

function formatICSDate(date: Date): string {
  return date.toISOString()
    .replace(/[-:]/g, '')
    .substring(0, 15) + 'Z';
}

function escapeICSString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}
