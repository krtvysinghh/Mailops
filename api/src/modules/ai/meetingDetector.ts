export interface Meeting {
  date?: string;
  time?: string;
  location?: string;
}

export function extractMeetings(text: string): Meeting[] {
  const meetings: Meeting[] = [];
  
  const dateRegex = /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}(?:st|nd|rd|th)?\b/gi;
  const timeRegex = /\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/gi;
  const locRegex = /(?:in|at) (room \d+|zoom|teams|google meet|office)/gi;

  const dates = text.match(dateRegex) || [];
  const times = text.match(timeRegex) || [];
  const locs = text.match(locRegex) || [];

  const count = Math.max(dates.length, times.length, locs.length);

  for (let i = 0; i < count; i++) {
    const meeting: Meeting = {};
    if (dates[i]) meeting.date = dates[i];
    if (times[i]) meeting.time = times[i];
    if (locs[i]) {
      meeting.location = locs[i].replace(/^(in|at)\s+/i, '').trim();
    }
    if (Object.keys(meeting).length > 0) {
      meetings.push(meeting);
    }
  }

  return meetings;
}
